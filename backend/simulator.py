"""
BehaviorGuard — Session Simulator
Generates synthetic human and bot sessions for demo mode.
"""

import uuid
import time
import math
import random
import numpy as np
from typing import Dict, Any, List


def _gen_mouse_event(x: float, y: float, t: float) -> Dict:
    return {"x": round(x), "y": round(y), "t": int(t)}


def simulate_human_session() -> Dict[str, Any]:
    """Generate a realistic human session payload."""
    base_time = int(time.time() * 1000) - 15000
    session_id = str(uuid.uuid4())

    # Organic mouse movement (Bezier-curve-like path)
    mouse_events = []
    x, y = random.uniform(200, 800), random.uniform(200, 600)
    t = base_time + random.randint(1200, 3500)
    for _ in range(random.randint(220, 500)):
        # Organic movement with jitter
        dx = random.gauss(0, 5) + random.gauss(0, 2)
        dy = random.gauss(0, 4) + random.gauss(0, 2)
        x = max(0, min(1920, x + dx))
        y = max(0, min(1080, y + dy))
        dt = max(8, int(random.lognormvariate(math.log(16), 0.3)))
        t += dt
        mouse_events.append(_gen_mouse_event(x, y, t))
        # Occasional pauses
        if random.random() < 0.03:
            t += random.randint(200, 800)

    # Typing events
    key_events = []
    chars = "user@example.com" + "password123"  # realistic input
    t_type = base_time + random.randint(2000, 5000)
    for ch in chars:
        gap = int(random.lognormvariate(math.log(180), 0.35))
        duration = int(random.uniform(50, 150))
        key_events.append({"key": ch, "down": t_type, "up": t_type + duration})
        t_type += gap + duration
        # Occasional backspace mistakes
        if random.random() < 0.08:
            key_events.append({
                "key": "Backspace",
                "down": t_type,
                "up": t_type + int(random.uniform(60, 120))
            })
            t_type += int(random.uniform(80, 200))

    # Scroll events
    scroll_events = []
    t_scroll = base_time + random.randint(1000, 4000)
    for _ in range(random.randint(3, 12)):
        t_scroll += random.randint(300, 1500)
        scroll_events.append({
            "dy": random.choice([-120, -60, 60, 120]) * random.randint(1, 3),
            "t": t_scroll
        })

    page_load_time = base_time
    submit_time = t_type + random.randint(500, 2000)

    return {
        "session_id": session_id,
        "mouse_events": mouse_events,
        "key_events": key_events,
        "scroll_events": scroll_events,
        "fingerprint": {
            "screen_width": random.choice([1920, 1366, 1536, 1440, 1280]),
            "screen_height": random.choice([1080, 768, 864, 900, 800]),
            "timezone_offset": -330,
            "language": "en-IN",
            "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0",
            "hardware_concurrency": random.choice([4, 6, 8, 10]),
            "device_memory": random.choice([4, 8, 16]),
            "webdriver": False,
            "plugins_count": random.randint(3, 8),
            "canvas_fingerprint": True,
        },
        "page_load_time": page_load_time,
        "submit_time": submit_time,
    }


def simulate_bot_session(sophistication: float = 0.0) -> Dict[str, Any]:
    """
    Generate a bot session payload.
    sophistication=0.0: obvious script-kiddie bot
    sophistication=1.0: advanced human-mimicking bot
    """
    base_time = int(time.time() * 1000) - 3000
    session_id = str(uuid.uuid4())
    s = sophistication

    # Mouse events — scripted or none
    mouse_events = []
    if s > 0.4:
        # Sophisticated bot: add some jittered movement
        x, y = 100, 100
        t = base_time + int(random.uniform(50, 300) + s * 500)
        for _ in range(int(random.uniform(5, 30) + s * 50)):
            dx = random.uniform(-3, 3) * s + (200 - x) * 0.05
            dy = random.uniform(-3, 3) * s + (200 - y) * 0.05
            x = max(0, min(1920, x + dx))
            y = max(0, min(1080, y + dy))
            dt = int(random.uniform(1, 5) + s * random.uniform(5, 20))
            t += max(1, dt)
            mouse_events.append(_gen_mouse_event(x, y, t))
    # Simple bots: no mouse movement at all

    # Key events — instant typing
    key_events = []
    chars = "botuser@test.com" + "testpass123"
    t_type = base_time + int(random.uniform(50, 200) + s * random.uniform(200, 1000))
    for ch in chars:
        gap = int(random.uniform(1, 10) + s * random.gauss(80, 20))
        gap = max(1, gap)
        key_events.append({"key": ch, "down": t_type, "up": t_type + random.randint(1, 5)})
        t_type += gap

    # Scroll — usually none for bots
    scroll_events = []
    if s > 0.5:
        for _ in range(random.randint(0, 3)):
            scroll_events.append({"dy": 120, "t": base_time + random.randint(100, 1000)})

    submit_time = t_type + int(random.uniform(10, 100))

    # Fingerprint — suspicious environment
    webdriver = True if s < 0.5 else (random.random() < 0.3)
    plugins = 0 if s < 0.4 else random.randint(0, 3)
    hw = 1 if s < 0.5 else random.choice([1, 2, 4])
    screen_w = 801 if s < 0.4 else random.choice([1280, 1920, 1366])
    screen_h = 601 if s < 0.4 else random.choice([800, 1080, 768])

    return {
        "session_id": session_id,
        "mouse_events": mouse_events,
        "key_events": key_events,
        "scroll_events": scroll_events,
        "fingerprint": {
            "screen_width": screen_w,
            "screen_height": screen_h,
            "timezone_offset": 888 if s < 0.5 else 0,
            "language": "en" if s < 0.5 else "en-US",
            "user_agent": (
                "Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0.0.0 PhantomJS"
                if s < 0.5 else
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/119.0.0.0"
            ),
            "hardware_concurrency": hw,
            "device_memory": 0 if s < 0.5 else random.choice([2, 4]),
            "webdriver": webdriver,
            "plugins_count": plugins,
            "canvas_fingerprint": s > 0.4,
        },
        "page_load_time": base_time,
        "submit_time": submit_time,
    }
