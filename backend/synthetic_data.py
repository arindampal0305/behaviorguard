"""
BehaviorGuard — Synthetic Training Data Generator
Generates realistic human and bot behavioral signal datasets.
"""

import numpy as np
import pandas as pd
from typing import Tuple

np.random.seed(42)


def generate_human_sample() -> dict:
    """Generate a single synthetic human behavioral session."""
    # Mouse signals — organic, varied
    mouse_event_count = np.random.randint(180, 650)
    mouse_avg_speed = np.clip(np.random.normal(0.8, 0.35), 0.1, 3.5)
    mouse_jitter_index = np.clip(np.random.normal(25, 8), 8, 55)
    mouse_path_curvature = np.clip(np.random.beta(5, 2) * 0.4 + 0.55, 0.5, 1.0)  # 0.55–0.95
    mouse_pause_count = np.random.randint(2, 18)

    # Keyboard signals — natural typing rhythm
    keystroke_count = np.random.randint(8, 35)
    avg_keystroke_gap_ms = np.clip(np.random.lognormal(np.log(180), 0.35), 80, 600)
    keystroke_rhythm_entropy = np.clip(np.random.normal(3.1, 0.5), 1.8, 4.5)
    backspace_ratio = np.clip(np.random.beta(2, 10), 0.0, 0.35)
    typing_speed_wpm = np.clip(np.random.normal(52, 18), 15, 120)

    # Scroll signals
    scroll_event_count = np.random.randint(1, 22)
    scroll_direction_changes = np.random.randint(0, 7)

    # Timing signals
    time_to_first_interaction_ms = np.random.uniform(700, 6000)
    form_fill_duration_ms = np.random.uniform(4000, 40000)

    # Fingerprint / environment signals
    timezone_language_match = 1 if np.random.random() > 0.05 else 0  # 95% match for humans
    headless_browser_score = np.clip(np.random.beta(1, 20), 0.0, 0.3)
    screen_resolution_common = 1 if np.random.random() > 0.08 else 0
    hardware_concurrency = np.random.choice([2, 4, 6, 8, 10, 12, 16], p=[0.05, 0.30, 0.15, 0.30, 0.08, 0.08, 0.04])

    return {
        "mouse_event_count": mouse_event_count,
        "mouse_avg_speed": mouse_avg_speed,
        "mouse_jitter_index": mouse_jitter_index,
        "mouse_path_curvature": mouse_path_curvature,
        "mouse_pause_count": mouse_pause_count,
        "keystroke_count": keystroke_count,
        "avg_keystroke_gap_ms": avg_keystroke_gap_ms,
        "keystroke_rhythm_entropy": keystroke_rhythm_entropy,
        "backspace_ratio": backspace_ratio,
        "typing_speed_wpm": typing_speed_wpm,
        "scroll_event_count": scroll_event_count,
        "scroll_direction_changes": scroll_direction_changes,
        "time_to_first_interaction_ms": time_to_first_interaction_ms,
        "form_fill_duration_ms": form_fill_duration_ms,
        "timezone_language_match": timezone_language_match,
        "headless_browser_score": headless_browser_score,
        "screen_resolution_common": screen_resolution_common,
        "hardware_concurrency": float(hardware_concurrency),
        "label": 1,  # 1 = human
    }


def generate_bot_sample(sophistication: float = 0.0) -> dict:
    """
    Generate a single synthetic bot behavioral session.
    sophistication: 0.0 = obvious bot, 1.0 = human-mimicking bot
    """
    s = sophistication  # shorthand

    # Mouse signals — bots either have zero or scripted movement
    if np.random.random() > 0.3 + 0.4 * s:
        # Simple bot: no mouse movement
        mouse_event_count = np.random.randint(0, 5)
        mouse_avg_speed = 0.0
        mouse_jitter_index = np.clip(np.random.normal(0.5 + s * 8, 0.3), 0.0, 10.0)
        mouse_path_curvature = np.clip(1.0 - s * 0.15, 0.85, 1.0)
        mouse_pause_count = 0
    else:
        # Scripted bot: too many or too regular events
        mouse_event_count = np.random.choice([
            np.random.randint(1200, 3000),  # too many — scripted
            np.random.randint(0, 3),        # too few
        ])
        mouse_avg_speed = 0.0 if mouse_event_count < 5 else np.clip(np.random.uniform(5, 25) * (1 - s * 0.5), 0.5, 25)
        mouse_jitter_index = np.clip(np.random.normal(0.8 + s * 15, 0.5 + s * 5), 0.0, 20.0)
        mouse_path_curvature = np.clip(1.0 - s * 0.2 + np.random.normal(0, 0.02), 0.75, 1.0)
        mouse_pause_count = 0 if s < 0.5 else np.random.randint(0, 3)

    # Keyboard signals — too fast or perfectly uniform
    keystroke_count = np.random.randint(5, 30)
    avg_keystroke_gap_ms = np.clip(np.random.uniform(1, 12) + s * np.random.normal(60, 20), 1, 200)
    keystroke_rhythm_entropy = np.clip(np.random.uniform(0.0, 0.6) + s * np.random.normal(1.2, 0.3), 0.0, 2.5)
    backspace_ratio = 0.0 if s < 0.6 else np.clip(np.random.beta(1, 15), 0.0, 0.1)
    typing_speed_wpm = np.clip(np.random.uniform(400, 1200) * (1 - s * 0.7), 80, 1200)

    # Scroll signals — bots don't scroll
    scroll_event_count = 0 if s < 0.4 else np.random.randint(0, 4)
    scroll_direction_changes = 0 if s < 0.5 else np.random.randint(0, 2)

    # Timing — bots are too fast
    time_to_first_interaction_ms = np.clip(np.random.uniform(5, 200) + s * np.random.uniform(100, 500), 5, 700)
    form_fill_duration_ms = np.clip(np.random.uniform(50, 600) + s * np.random.uniform(500, 3000), 50, 5000)

    # Fingerprint signals — bots often have suspicious environments
    timezone_language_match = 0 if np.random.random() > s * 0.7 else 1
    headless_browser_score = np.clip(np.random.beta(20, 1) * (1 - s * 0.4) + s * np.random.beta(5, 5), 0.3, 1.0)
    screen_resolution_common = 0 if np.random.random() > s * 0.6 else 1
    hardware_concurrency = float(np.random.choice([0, 1, 2], p=[0.3, 0.5, 0.2]) if s < 0.5 else np.random.choice([1, 2, 4], p=[0.4, 0.4, 0.2]))

    return {
        "mouse_event_count": float(mouse_event_count),
        "mouse_avg_speed": mouse_avg_speed,
        "mouse_jitter_index": mouse_jitter_index,
        "mouse_path_curvature": mouse_path_curvature,
        "mouse_pause_count": float(mouse_pause_count),
        "keystroke_count": float(keystroke_count),
        "avg_keystroke_gap_ms": avg_keystroke_gap_ms,
        "keystroke_rhythm_entropy": keystroke_rhythm_entropy,
        "backspace_ratio": backspace_ratio,
        "typing_speed_wpm": typing_speed_wpm,
        "scroll_event_count": float(scroll_event_count),
        "scroll_direction_changes": float(scroll_direction_changes),
        "time_to_first_interaction_ms": time_to_first_interaction_ms,
        "form_fill_duration_ms": form_fill_duration_ms,
        "timezone_language_match": float(timezone_language_match),
        "headless_browser_score": headless_browser_score,
        "screen_resolution_common": float(screen_resolution_common),
        "hardware_concurrency": hardware_concurrency,
        "label": 0,  # 0 = bot
    }


def generate_dataset(n_human: int = 500, n_bot: int = 500, n_sophisticated_bot: int = 100) -> Tuple[pd.DataFrame, pd.Series]:
    """
    Generate the complete training dataset.
    Returns (feature_df, labels_series)
    """
    samples = []

    # Human samples
    for _ in range(n_human):
        samples.append(generate_human_sample())

    # Simple bot samples
    for _ in range(n_bot):
        sophistication = np.random.beta(1, 5)  # mostly near 0 (obvious bots)
        samples.append(generate_bot_sample(sophistication=sophistication))

    # Sophisticated bot samples
    for _ in range(n_sophisticated_bot):
        sophistication = np.random.uniform(0.65, 0.95)
        samples.append(generate_bot_sample(sophistication=sophistication))

    df = pd.DataFrame(samples)
    labels = df.pop("label")
    return df, labels


if __name__ == "__main__":
    df, labels = generate_dataset()
    print(f"Dataset shape: {df.shape}")
    print(f"Human sessions: {(labels == 1).sum()}")
    print(f"Bot sessions: {(labels == 0).sum()}")
    print("\nFeature means by class:")
    df["label"] = labels
    print(df.groupby("label").mean().T)
