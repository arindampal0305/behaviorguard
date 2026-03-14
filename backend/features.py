"""
BehaviorGuard — Feature Engineering
Transforms raw signal payloads from the browser into the 18 ML features.
"""

import math
import numpy as np
from typing import Dict, Any, List


FEATURE_NAMES = [
    "mouse_event_count",
    "mouse_avg_speed",
    "mouse_jitter_index",
    "mouse_path_curvature",
    "mouse_pause_count",
    "keystroke_count",
    "avg_keystroke_gap_ms",
    "keystroke_rhythm_entropy",
    "backspace_ratio",
    "typing_speed_wpm",
    "scroll_event_count",
    "scroll_direction_changes",
    "time_to_first_interaction_ms",
    "form_fill_duration_ms",
    "timezone_language_match",
    "headless_browser_score",
    "screen_resolution_common",
    "hardware_concurrency",
]

# Common human screen resolutions
COMMON_RESOLUTIONS = {
    (1920, 1080), (1366, 768), (1536, 864), (1440, 900), (1280, 800),
    (1280, 1024), (1600, 900), (2560, 1440), (3840, 2160), (1024, 768),
    (2560, 1600), (1680, 1050), (1920, 1200), (2880, 1800), (1360, 768),
    (1920, 1080), (2048, 1152), (1280, 720), (1024, 600), (800, 600),
}

# Timezone to language group mapping (offset in minutes -> expected language prefixes)
TIMEZONE_LANGUAGE_MAP = {
    range(-720, -540): ["en"],               # Pacific/US
    range(-540, -420): ["en"],               # Mountain/Alaska
    range(-420, -300): ["en", "es"],         # Central/Mexico
    range(-300, -180): ["en", "es", "pt"],   # Eastern/South America
    range(-180, -60):  ["pt", "es"],         # Brazil/Argentina
    range(-60, 60):    ["en", "fr", "de", "pt", "es", "nl"],  # Europe/UK
    range(60, 180):    ["de", "fr", "it", "pl", "cs", "ar"],  # Central Europe
    range(180, 300):   ["ar", "tr", "ru"],   # Middle East
    range(300, 420):   ["ru", "ur", "hi", "en"],  # Russia/South Asia
    range(420, 540):   ["hi", "en", "bn", "th"],  # India/SE Asia
    range(540, 660):   ["zh", "ko", "ja"],   # East Asia
    range(660, 780):   ["ja", "en"],          # Japan/Australia
}


def _shannon_entropy(values: List[float]) -> float:
    """Compute Shannon entropy of a list of values (discretized to 10ms bins)."""
    if len(values) < 2:
        return 0.0
    bins = np.histogram(values, bins=20)[0]
    bins = bins[bins > 0]
    prob = bins / bins.sum()
    return float(-np.sum(prob * np.log2(prob + 1e-10)))


def _compute_mouse_features(mouse_events: List[Dict]) -> Dict[str, float]:
    """Extract mouse behavioral features from raw event list."""
    if not mouse_events or len(mouse_events) < 2:
        return {
            "mouse_event_count": float(len(mouse_events) if mouse_events else 0),
            "mouse_avg_speed": 0.0,
            "mouse_jitter_index": 0.0,
            "mouse_path_curvature": 1.0,
            "mouse_pause_count": 0.0,
        }

    events = sorted(mouse_events, key=lambda e: e.get("t", 0))
    count = len(events)

    speeds = []
    angles = []
    pauses = 0
    total_path = 0.0

    for i in range(1, len(events)):
        dx = events[i].get("x", 0) - events[i-1].get("x", 0)
        dy = events[i].get("y", 0) - events[i-1].get("y", 0)
        dt = max(events[i].get("t", 0) - events[i-1].get("t", 0), 1)  # avoid div/0

        dist = math.sqrt(dx*dx + dy*dy)
        speed = dist / dt
        speeds.append(speed)
        total_path += dist

        angle = math.degrees(math.atan2(dy, dx))
        angles.append(angle)

        if dt > 200:
            pauses += 1

    # Mouse jitter: std dev of direction changes
    direction_changes = [abs(angles[i] - angles[i-1]) for i in range(1, len(angles))]
    jitter_index = float(np.std(direction_changes)) if direction_changes else 0.0

    # Path curvature: straight-line distance / actual path length
    first = events[0]
    last = events[-1]
    straight_line = math.sqrt(
        (last.get("x", 0) - first.get("x", 0))**2 +
        (last.get("y", 0) - first.get("y", 0))**2
    )
    curvature = float(straight_line / max(total_path, 1))

    return {
        "mouse_event_count": float(count),
        "mouse_avg_speed": float(np.mean(speeds)) if speeds else 0.0,
        "mouse_jitter_index": min(jitter_index, 180.0),
        "mouse_path_curvature": min(curvature, 1.0),
        "mouse_pause_count": float(pauses),
    }


def _compute_keyboard_features(key_events: List[Dict]) -> Dict[str, float]:
    """Extract keyboard behavioral features."""
    if not key_events:
        return {
            "keystroke_count": 0.0,
            "avg_keystroke_gap_ms": 0.0,
            "keystroke_rhythm_entropy": 0.0,
            "backspace_ratio": 0.0,
            "typing_speed_wpm": 0.0,
        }

    events = sorted(key_events, key=lambda e: e.get("down", 0))
    count = len(events)
    backspace_count = sum(1 for e in events if e.get("key", "") in ["Backspace", "Delete"])

    # Inter-keystroke gaps
    gaps = []
    for i in range(1, len(events)):
        gap = events[i].get("down", 0) - events[i-1].get("down", 0)
        if gap > 0:
            gaps.append(gap)

    avg_gap = float(np.mean(gaps)) if gaps else 0.0
    entropy = _shannon_entropy(gaps) if gaps else 0.0

    # Typing speed (WPM) — estimate from total duration
    if len(events) >= 2:
        total_ms = events[-1].get("down", 0) - events[0].get("down", 0)
        if total_ms > 0:
            chars_per_minute = (count / total_ms) * 60000
            wpm = chars_per_minute / 5.0
        else:
            wpm = 0.0
    else:
        wpm = 0.0

    return {
        "keystroke_count": float(count),
        "avg_keystroke_gap_ms": avg_gap,
        "keystroke_rhythm_entropy": entropy,
        "backspace_ratio": float(backspace_count / count) if count > 0 else 0.0,
        "typing_speed_wpm": float(min(wpm, 1500.0)),
    }


def _compute_scroll_features(scroll_events: List[Dict]) -> Dict[str, float]:
    """Extract scroll behavioral features."""
    if not scroll_events:
        return {"scroll_event_count": 0.0, "scroll_direction_changes": 0.0}

    events = sorted(scroll_events, key=lambda e: e.get("t", 0))
    direction_changes = 0
    prev_dy = None

    for e in events:
        dy = e.get("dy", 0)
        if prev_dy is not None and dy != 0 and prev_dy != 0:
            if (dy > 0) != (prev_dy > 0):
                direction_changes += 1
        if dy != 0:
            prev_dy = dy

    return {
        "scroll_event_count": float(len(events)),
        "scroll_direction_changes": float(direction_changes),
    }


def _compute_timing_features(payload: Dict) -> Dict[str, float]:
    """Extract timing and session duration features."""
    page_load_time = payload.get("page_load_time", 0)
    submit_time = payload.get("submit_time", 0)

    # Detect first interaction time
    all_events_times = []
    for ev in payload.get("mouse_events", []):
        all_events_times.append(ev.get("t", float("inf")))
    for ev in payload.get("key_events", []):
        all_events_times.append(ev.get("down", float("inf")))
    for ev in payload.get("scroll_events", []):
        all_events_times.append(ev.get("t", float("inf")))

    first_interaction = min(all_events_times) if all_events_times else submit_time
    time_to_first = max(first_interaction - page_load_time, 0)

    key_events = sorted(payload.get("key_events", []), key=lambda e: e.get("down", 0))
    if len(key_events) >= 2:
        form_fill = max(key_events[-1].get("down", 0) - key_events[0].get("down", 0), 0)
    else:
        form_fill = max(submit_time - first_interaction, 0)

    return {
        "time_to_first_interaction_ms": float(min(time_to_first, 30000)),
        "form_fill_duration_ms": float(min(form_fill, 120000)),
    }


def _compute_fingerprint_features(fingerprint: Dict) -> Dict[str, float]:
    """Extract browser fingerprint and environment features."""
    # Headless browser detection — composite score
    headless_signals = []

    if fingerprint.get("webdriver", False):
        headless_signals.append(0.9)
    if fingerprint.get("plugins_count", 5) == 0:
        headless_signals.append(0.7)
    if fingerprint.get("hardware_concurrency", 4) <= 1:
        headless_signals.append(0.4)
    if fingerprint.get("device_memory", 4) == 0:
        headless_signals.append(0.5)

    user_agent = fingerprint.get("user_agent", "")
    if "headless" in user_agent.lower():
        headless_signals.append(0.95)
    if "phantomjs" in user_agent.lower():
        headless_signals.append(0.98)
    if not fingerprint.get("canvas_fingerprint", True):
        headless_signals.append(0.6)

    headless_score = float(np.mean(headless_signals)) if headless_signals else 0.0

    # Screen resolution check
    w = fingerprint.get("screen_width", 1920)
    h = fingerprint.get("screen_height", 1080)
    screen_resolution_common = 1.0 if (w, h) in COMMON_RESOLUTIONS else 0.0

    # Timezone-language consistency check
    tz_offset = fingerprint.get("timezone_offset", 0)
    language = fingerprint.get("language", "en").split("-")[0].lower()
    tz_match = 0.0
    for tz_range, lang_list in TIMEZONE_LANGUAGE_MAP.items():
        if tz_offset in tz_range:
            tz_match = 1.0 if language in lang_list else 0.0
            break

    hardware_concurrency = float(fingerprint.get("hardware_concurrency", 4))

    return {
        "timezone_language_match": tz_match,
        "headless_browser_score": min(headless_score, 1.0),
        "screen_resolution_common": screen_resolution_common,
        "hardware_concurrency": hardware_concurrency,
    }


def engineer_features(payload: Dict[str, Any]) -> Dict[str, float]:
    """
    Main entry point. Takes the full raw signal payload and returns
    a dict of 18 engineered features ready for ML inference.
    """
    mouse_feats = _compute_mouse_features(payload.get("mouse_events", []))
    key_feats = _compute_keyboard_features(payload.get("key_events", []))
    scroll_feats = _compute_scroll_features(payload.get("scroll_events", []))
    timing_feats = _compute_timing_features(payload)
    fp_feats = _compute_fingerprint_features(payload.get("fingerprint", {}))

    features = {}
    features.update(mouse_feats)
    features.update(key_feats)
    features.update(scroll_feats)
    features.update(timing_feats)
    features.update(fp_feats)

    # Ensure all 18 features are present
    for name in FEATURE_NAMES:
        features.setdefault(name, 0.0)

    # Return in canonical order
    return {name: features[name] for name in FEATURE_NAMES}


def features_to_array(features: Dict[str, float]) -> list:
    """Convert feature dict to ordered list for model input."""
    return [features[name] for name in FEATURE_NAMES]
