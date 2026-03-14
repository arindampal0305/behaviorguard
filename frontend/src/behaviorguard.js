/**
 * BehaviorGuard — Passive Signal Collector v1.0
 * Silently records behavioral signals and sends them to the backend.
 * Zero UI interaction — completely invisible to the user.
 */
(function () {
  'use strict';

  const API_ENDPOINT = 'http://localhost:8000/analyze';
  const THROTTLE_MS = 16; // ~60fps throttle for mouse events

  // Session ID
  const sessionId = 'bg-' + Math.random().toString(36).substr(2, 9) + '-' + Date.now();
  const pageLoadTime = Date.now();

  // Signal buffers
  const mouseEvents = [];
  const keyEvents = {};   // key → { key, down, up }
  const keyEventsList = [];
  const scrollEvents = [];

  let lastMouseTime = 0;
  let submitted = false;

  // ─── Mouse Events (throttled to 60fps) ───────────────────────────
  document.addEventListener('mousemove', function (e) {
    const now = Date.now();
    if (now - lastMouseTime < THROTTLE_MS) return;
    lastMouseTime = now;
    mouseEvents.push({ x: e.clientX, y: e.clientY, t: now });
  }, { passive: true });

  // ─── Keyboard Events ─────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    const now = Date.now();
    keyEvents[e.code] = { key: e.key, down: now };
  }, { passive: true });

  document.addEventListener('keyup', function (e) {
    const now = Date.now();
    if (keyEvents[e.code]) {
      keyEventsList.push({
        key: keyEvents[e.code].key,
        down: keyEvents[e.code].down,
        up: now,
      });
      delete keyEvents[e.code];
    }
  }, { passive: true });

  // ─── Scroll Events ───────────────────────────────────────────────
  document.addEventListener('wheel', function (e) {
    scrollEvents.push({ dy: e.deltaY, t: Date.now() });
  }, { passive: true });

  document.addEventListener('scroll', function () {
    scrollEvents.push({ dy: window.scrollY, t: Date.now() });
  }, { passive: true });

  // ─── Browser Fingerprint ─────────────────────────────────────────
  function collectFingerprint() {
    let canvasFingerprint = true;
    try {
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('BehaviorGuard🛡️', 2, 2);
      canvasFingerprint = c.toDataURL().length > 100;
    } catch (_) {
      canvasFingerprint = false;
    }

    return {
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      timezone_offset: -(new Date().getTimezoneOffset()),  // positive for east
      language: navigator.language || 'en',
      user_agent: navigator.userAgent,
      hardware_concurrency: navigator.hardwareConcurrency || 0,
      device_memory: navigator.deviceMemory || 0,
      webdriver: !!navigator.webdriver,
      plugins_count: navigator.plugins ? navigator.plugins.length : 0,
      canvas_fingerprint: canvasFingerprint,
    };
  }

  // ─── Submit Signals ───────────────────────────────────────────────
  function submitSignals(event) {
    if (submitted) return;
    submitted = true;

    const payload = {
      session_id: sessionId,
      mouse_events: mouseEvents,
      key_events: keyEventsList,
      scroll_events: scrollEvents,
      fingerprint: collectFingerprint(),
      page_load_time: pageLoadTime,
      submit_time: Date.now(),
    };

    console.log('[BehaviorGuard] Submitting signals:', {
      mouse: mouseEvents.length,
      keys: keyEventsList.length,
      scroll: scrollEvents.length,
    });

    // Use sendBeacon for reliability on form submit, fallback to fetch
    const json = JSON.stringify(payload);
    if (navigator.sendBeacon && event && event.type === 'submit') {
      const blob = new Blob([json], { type: 'application/json' });
      navigator.sendBeacon(API_ENDPOINT, blob);
    } else {
      fetch(API_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
        keepalive: true,
      }).then(res => res.json()).then(data => {
        console.log('[BehaviorGuard] Result:', data.verdict, data.score);
        // Dispatch custom event for any page handler
        document.dispatchEvent(new CustomEvent('behaviorguard:result', { detail: data }));
      }).catch(err => {
        console.warn('[BehaviorGuard] Failed to submit:', err);
      });
    }
  }

  // ─── Auto-submit on form submit ──────────────────────────────────
  document.addEventListener('submit', submitSignals, { once: true });

  // ─── Auto-submit after 5 seconds of inactivity ───────────────────
  let inactivityTimer = null;
  function resetInactivity() {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(function () {
      if (!submitted) submitSignals(null);
    }, 5000);
  }
  document.addEventListener('mousemove', resetInactivity, { passive: true });
  document.addEventListener('keydown', resetInactivity, { passive: true });

  // Expose globally for integration
  window.BehaviorGuard = { sessionId, submit: submitSignals };

  console.log('[BehaviorGuard] Collector initialized. Session:', sessionId);
})();
