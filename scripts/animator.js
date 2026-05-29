
// ── Internal helpers ──────────────────────────────────────────────────────────

/** Wraps a rAF loop into an object callers can cancel or await. */
function makeHandle(cancelFn) {
  let resolve;
  const finished = new Promise(r => { resolve = r; });
  return {
    finished,
    _resolve: resolve,
    cancel: () => { cancelFn(); resolve(); },
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Exponential-decay zoom applied to an element via CSS transform.
 *
 * @param {HTMLElement} element
 * @param {object}      opts
 * @param {number}      opts.zoomPercent  - Total zoom at asymptote, e.g. 6 = 6 %
 * @param {number}      opts.duration     - Stop advancing after this many ms
 * @param {number}      [opts.tau]        - Time constant; defaults to duration / 4
 * @returns {AnimationHandle}
 */
export function startZoom(element, { zoomPercent, duration, tau }) {
  if (zoomPercent === 0) {
    // Nothing to animate — return an already-resolved handle
    return { finished: Promise.resolve(), cancel: () => {} };
  }

  const zoomFraction  = zoomPercent / 100;
  const timeConstant  = tau ?? duration / 4;
  let   rafId         = null;
  let   cancelled     = false;
  const startTime     = performance.now();

  const handle = makeHandle(() => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
  });

  function tick(now) {
    if (cancelled) return;

    const elapsed = now - startTime;
    const scale   = 1 + zoomFraction * (1 - Math.exp(-elapsed / timeConstant));
    element.style.transform = `scale(${scale})`;

    if (elapsed < duration) {
      rafId = requestAnimationFrame(tick);
    } else {
      // Land on the value that corresponds to exactly `duration` elapsed
      const finalScale = 1 + zoomFraction * (1 - Math.exp(-duration / timeConstant));
      element.style.transform = `scale(${finalScale})`;
      handle._resolve();
    }
  }

  rafId = requestAnimationFrame(tick);
  return handle;
}

/**
 * Linear fade-in from opacity 0 to 1.
 *
 * @param {HTMLElement} element
 * @param {object}      [opts]
 * @param {number}      [opts.delay=0]      - ms before the fade begins
 * @param {number}      [opts.duration=300] - ms for the fade itself
 * @returns {AnimationHandle}
 */
export function fadeIn(element, { delay = 0, duration = 300 } = {}) {
  let rafId     = null;
  let timeoutId = null;
  let cancelled = false;

  element.style.opacity = "0";

  const handle = makeHandle(() => {
    cancelled = true;
    if (timeoutId !== null) clearTimeout(timeoutId);
    if (rafId     !== null) cancelAnimationFrame(rafId);
  });

  function runFade() {
    const startTime = performance.now();

    function tick(now) {
      if (cancelled) return;
      const t = Math.min((now - startTime) / duration, 1);
      element.style.opacity = String(t);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        element.style.opacity = "1";
        handle._resolve();
      }
    }

    rafId = requestAnimationFrame(tick);
  }

  if (delay > 0) {
    timeoutId = setTimeout(runFade, delay);
  } else {
    runFade();
  }

  return handle;
}

/**
 * Linear fade-out from the element's current opacity to 0.
 *
 * @param {HTMLElement} element
 * @param {object}      [opts]
 * @param {number}      [opts.duration=400] - ms for the fade
 * @returns {AnimationHandle}
 */
export function fadeOut(element, { duration = 400 } = {}) {
  let rafId   = null;
  let cancelled = false;

  const startOpacity = parseFloat(element.style.opacity) || 1;
  const startTime    = performance.now();

  const handle = makeHandle(() => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
  });

  function tick(now) {
    if (cancelled) return;
    const t = Math.min((now - startTime) / duration, 1);
    element.style.opacity = String(startOpacity * (1 - t));
    if (t < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      element.style.opacity = "0";
      handle._resolve();
    }
  }

  rafId = requestAnimationFrame(tick);
  return handle;
}
