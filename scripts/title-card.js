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
 * @property {number}      titleArcDepth       - arc intrusion as % of element height
 */

// ── SVG clip path ─────────────────────────────────────────────────────────────

const CLIP_ID = "itc-arc-clip";

function getOrCreateClipPath() {
  let svg = document.getElementById("itc-arc-clip-svg");
  if (svg) return svg.querySelector("path");

  const ns = "http://www.w3.org/2000/svg";
  svg      = document.createElementNS(ns, "svg");
  svg.id   = "itc-arc-clip-svg";
  svg.setAttribute("width",  "0");
  svg.setAttribute("height", "0");
  svg.style.position = "absolute";

  const defs = document.createElementNS(ns, "defs");
  const clip = document.createElementNS(ns, "clipPath");
  clip.setAttribute("id",            CLIP_ID);
  // objectBoundingBox: coordinates are fractions of the clipped element's
  // own layout box, completely unaffected by any CSS transforms on ancestors.
  clip.setAttribute("clipPathUnits", "objectBoundingBox");

  const path = document.createElementNS(ns, "path");
  path.setAttribute("clip-rule", "evenodd");

  clip.appendChild(path);
  defs.appendChild(clip);
  svg.appendChild(defs);
  document.body.appendChild(svg);
  return path;
}

/**
 * Updates the arc clip path using objectBoundingBox fractions.
 *
 * The element's own box is always (0,0)→(1,1) in this coordinate system.
 * We need to know the aspect ratio (w/h) to make the ellipse look correct,
 * because objectBoundingBox scales x and y independently.
 *
 * @param {HTMLElement} clipTarget  - Element to receive clip-path (the wrapper)
 * @param {HTMLElement} measureEl   - Element to measure aspect ratio from
 * @param {number}      arcDepth    - arc intrusion as fraction of element height (0–1)
 */
function applyArcClip(clipTarget, measureEl, arcDepth) {
  if (arcDepth <= 0) return;

  const rect = measureEl.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  // In objectBoundingBox space the element is always a 1×1 unit square.
  // The ellipse rx/ry must compensate for the non-square aspect ratio so
  // the arc looks like a circular arc rather than a stretched oval.
  //
  // We want the arc to span the full width (rx = 0.5 in x-fraction units)
  // and have a pleasing curve depth. ry in objectBoundingBox units needs
  // to be scaled by (height/width) to produce the same pixel radius in both axes.
  //
  // Desired pixel ry = max(arcDepth_px * 3, width_px * 0.5)
  // In OBB units: ry_obb = ry_px / height_px
  const w          = rect.width;
  const h          = rect.height;
  const arcDepthPx = h * arcDepth;
  const ryPx       = Math.max(arcDepthPx * 3, w * 0.5);
  const ry         = ryPx / h;         // convert to OBB fraction of height
  const rx         = 0.5;              // always spans full width in OBB

  // Ellipse centre: cy - ry = 1 - arcDepth  =>  cy = 1 - arcDepth + ry
  const cy = 1 - arcDepth + ry;
  const cx = 0.5;

  // Evenodd path in OBB space:
  //   CCW rect  0,0 → 0,1 → 1,1 → 1,0  (clockwise in screen coords where Y↓)
  //   CW ellipse (counterclockwise arcs, sweep=0)
  const d = [
    `M 0,0 L 0,1 L 1,1 L 1,0 Z`,
    `M ${cx + rx},${cy} A ${rx},${ry} 0 1 0 ${cx - rx},${cy} A ${rx},${ry} 0 1 0 ${cx + rx},${cy} Z`,
  ].join(" ");

  getOrCreateClipPath().setAttribute("d", d);
  clipTarget.style.clipPath = `url(#${CLIP_ID})`;
}

function removeArcClip(el) {
  if (el) el.style.clipPath = "";
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

    requestAnimationFrame(() => requestAnimationFrame(() => {
      if (!this.#el) return;
      const wrapEl  = this.#el.querySelector(".itc-title-perspective");
      const titleEl = this.#el.querySelector(".itc-title");
      if (wrapEl && titleEl && this.opts.titleArcDepth > 0) {
        applyArcClip(wrapEl, titleEl, this.opts.titleArcDepth / 100);
      }
    }));

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
    removeArcClip(this.#el?.querySelector(".itc-title-perspective"));
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
      block.style.fontFamily = `"${o.subtitleFontFamily}", "Oswald, sans-serif`;
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
    removeArcClip(this.#el?.querySelector(".itc-title-perspective"));
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