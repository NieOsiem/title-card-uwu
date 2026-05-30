import { startZoom, fadeIn, fadeOut } from "./animator.js";

/**
 * @typedef {Object} TitleCardOptions
 * @property {string}      title
 * @property {string}      subtitle1
 * @property {string}      subtitle2
 * @property {string}      backgroundColor
 * @property {string}      textColor
 * @property {string}      backgroundTexture
 * @property {number}      textureOpacity      - 0–100
 * @property {string}      titleFontFamily
 * @property {string|null} titleFontUrl
 * @property {string}      subtitleFontFamily
 * @property {string|null} subtitleFontUrl
 * @property {string|null} overlayImage
 * @property {string|null} soundPath
 * @property {number}      displayDuration     - ms
 * @property {number}      zoomPercent
 * @property {number}      titleSizeVw
 * @property {number}      verticalPosition    - 0–100
 * @property {number}      fadeDuration        - ms
 * @property {number}      subtitleSpacing     - vh units
 * @property {number}      titleScaleY         - vertical stretch multiplier
 * @property {number}      titlePerspective    - perspective distance in px
 * @property {number}      titleRotateX        - degrees, top tilts away
 * @property {number}      titleArcDepth       - arc curvature 0–100
 */

// ── Arc warp ──────────────────────────────────────────────────────────────────

/**
 * Warps the title text so the bottom edge follows an inward arc while the
 * top edge stays straight. Achieved by wrapping each character in a span
 * and applying a scaleY (from the top) that's smallest at the centre and
 * full-size at both edges, following a parabolic curve.
 *
 * Must be called inside a rAF so the element is in the DOM and
 * offsetLeft / offsetWidth return real values.
 *
 * @param {HTMLElement} titleEl       - .itc-title (plain text content)
 * @param {number}      curvatureFrac - 0 = flat, 1 = maximum arc (fraction of char height)
 */
function applyArcWarp(titleEl, curvatureFrac) {
  if (curvatureFrac <= 0) return;

  const text = titleEl.textContent;
  titleEl.textContent = "";

  // One span per character so we can measure and scale each independently.
  const spans = [...text].map(char => {
    const span = document.createElement("span");
    span.textContent        = char;
    span.style.display      = "inline-block";
    span.style.whiteSpace   = "pre";           // preserves space characters
    span.style.transformOrigin = "top center"; // scale from the top — keeps top edge flat
    titleEl.appendChild(span);
    return span;
  });

  // offsetLeft/offsetWidth are synchronous layout reads; fine inside a rAF.
  const totalWidth = titleEl.offsetWidth;
  if (!totalWidth) return;

  for (const span of spans) {
    // Normalised horizontal centre of this character (0 = left edge, 1 = right edge)
    const x = (span.offsetLeft + span.offsetWidth / 2) / totalWidth;

    // Parabola: 0 at both edges, 1 at centre
    const arcFactor = 1 - 4 * (x - 0.5) ** 2;

    // Centre characters are shortest; edges stay at full height
    const scaleY = Math.max(0.05, 1 - curvatureFrac * arcFactor);
    span.style.transform = `scaleY(${scaleY})`;
  }
}

// ── TitleCard class ───────────────────────────────────────────────────────────

class TitleCard {
  #el         = null;
  #handles    = [];
  #closeTimer = null;

  constructor(opts) {
    this.opts = opts;
  }

  show() {
    this.#injectFonts();
    this.#el = this.#buildDOM();
    document.body.appendChild(this.#el);

    requestAnimationFrame(() => {
      if (!this.#el) return;
      const titleEl = this.#el.querySelector(".itc-title");
      if (titleEl) applyArcWarp(titleEl, this.opts.titleArcDepth / 100);
    });

    this.#startAnimations();

    if (this.opts.soundPath) {
      foundry.audio.AudioHelper.play(
        { src: this.opts.soundPath, volume: 1.0, autoplay: true, loop: false },
        false
      );
    }

    this.#closeTimer = setTimeout(() => this.#beginClose(), this.opts.displayDuration);
  }

  dismiss() {
    clearTimeout(this.#closeTimer);
    this.#closeTimer = null;
    this.#handles.forEach(h => h.cancel());
    this.#handles = [];
    this.#el?.remove();
    this.#el = null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  #buildDOM() {
    const o = this.opts;

    const root = document.createElement("div");
    root.id = "title-card-uwu";

    const wrapper = document.createElement("div");
    wrapper.classList.add("itc-wrapper");
    wrapper.style.backgroundColor = o.backgroundColor;

    if (o.backgroundTexture) {
      const tex = document.createElement("div");
      tex.classList.add("itc-texture");
      tex.style.backgroundImage = `url("${o.backgroundTexture}")`;
      tex.style.opacity         = String(o.textureOpacity / 100);
      wrapper.appendChild(tex);
    }

    if (o.overlayImage) {
      const overlay = document.createElement("div");
      overlay.classList.add("itc-overlay-image");
      overlay.style.backgroundImage = `url("${o.overlayImage}")`;
      wrapper.appendChild(overlay);
    }

    const content = document.createElement("div");
    content.classList.add("itc-content");
    content.style.top       = `${o.verticalPosition}%`;
    content.style.transform = "translateY(-50%)";

    const perspectiveWrap = document.createElement("div");
    perspectiveWrap.classList.add("itc-title-perspective");
    perspectiveWrap.style.perspective = `${o.titlePerspective}px`;

    const titleEl = document.createElement("div");
    titleEl.classList.add("itc-title");
    titleEl.textContent      = o.title;
    titleEl.style.color      = o.textColor;
    titleEl.style.fontFamily = `"${o.titleFontFamily}", "Oswald", sans-serif`;
    titleEl.style.fontSize   = `clamp(2rem, ${o.titleSizeVw}vw, 28rem)`;
    titleEl.style.transform  = buildTitleTransform(o.titleRotateX, o.titleScaleY);

    perspectiveWrap.appendChild(titleEl);
    content.appendChild(perspectiveWrap);

    if (o.subtitle1 || o.subtitle2) {
      const block = document.createElement("div");
      block.classList.add("itc-subtitle-block");
      block.style.color      = o.textColor;
      block.style.fontFamily = `"${o.subtitleFontFamily}", "Oswald", sans-serif`;
      block.style.opacity    = "0";
      block.style.marginTop  = `${o.subtitleSpacing}vh`;

      if (o.subtitle1) {
        const s1 = document.createElement("div");
        s1.classList.add("itc-subtitle1");
        s1.textContent = o.subtitle1;
        block.appendChild(s1);
      }
      if (o.subtitle2) {
        const s2 = document.createElement("div");
        s2.classList.add("itc-subtitle2");
        s2.textContent = o.subtitle2;
        block.appendChild(s2);
      }
      content.appendChild(block);
    }

    wrapper.appendChild(content);
    root.appendChild(wrapper);
    return root;
  }

  #startAnimations() {
    const o     = this.opts;
    const block = this.#el.querySelector(".itc-subtitle-block");

    if (o.zoomPercent > 0) {
      this.#handles.push(
        startZoom(this.#el, { zoomPercent: o.zoomPercent, duration: o.displayDuration })
      );
    }
    if (block) {
      this.#handles.push(fadeIn(block, { delay: 500, duration: 400 }));
    }
  }

  async #beginClose() {
    this.#handles.forEach(h => h.cancel());
    this.#handles = [];
    if (this.#el) await fadeOut(this.#el, { duration: this.opts.fadeDuration }).finished;
    this.#el?.remove();
    this.#el = null;
  }

  #injectFonts() {
    _injectGoogleFont("itc-google-font-title",    this.opts.titleFontUrl);
    _injectGoogleFont("itc-google-font-subtitle", this.opts.subtitleFontUrl);
  }
}

// ── Module helpers ────────────────────────────────────────────────────────────

function buildTitleTransform(rotateX, scaleY) {
  const parts = [];
  if (rotateX !== 0) parts.push(`rotateX(${rotateX}deg)`);
  if (scaleY  !== 1) parts.push(`scaleY(${scaleY})`);
  return parts.join(" ") || "none";
}

function _injectGoogleFont(id, url) {
  if (!url || document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id    = id;
  link.rel   = "stylesheet";
  link.href  = url;
  document.head.appendChild(link);
}

// ── Module-level singleton ────────────────────────────────────────────────────

let _active = null;

export function showTitleCard(payload, resolved) {
  _active?.dismiss();
  const card = new TitleCard({
    title:     payload.title     || "",
    subtitle1: payload.subtitle1 || "",
    subtitle2: payload.subtitle2 || "",
    ...resolved,
  });
  _active = card;
  card.show();
}