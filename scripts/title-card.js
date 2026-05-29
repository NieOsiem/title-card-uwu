
import { startZoom, fadeIn, fadeOut } from "./animator.js";

const { ApplicationV2 } = foundry.applications.api;

/**
 * @typedef {Object} TitleCardOptions
 * @property {string}      title           - Main title text (uppercased in CSS)
 * @property {string}      subtitle1       - First subtitle line
 * @property {string}      subtitle2       - Second subtitle line
 * @property {string}      backgroundColor - Hex color string
 * @property {string}      textColor       - Hex color string
 * @property {string}      backgroundTexture - URL or empty string
 * @property {number}      textureOpacity  - 0–100
 * @property {string}      fontFamily      - CSS font-family value
 * @property {string|null} fontUrl         - Google Fonts stylesheet href, or null
 * @property {string|null} overlayImage    - Variant overlay image URL, or null
 * @property {string|null} soundPath       - Audio file path, or null
 * @property {number}      displayDuration - ms to hold the card
 * @property {number}      zoomPercent     - Total zoom travel in percent
 */

export class TitleCardApplication extends ApplicationV2 {

  /** @type {TitleCardOptions} */
  #opts;

  /** Active animation handles — cancelled on close. */
  #handles = [];

  /** Timeout id for the auto-close timer. */
  #closeTimer = null;

  constructor(options, cardOpts) {
    super(options);
    this.#opts = cardOpts;
  }

  /** @override */
  static DEFAULT_OPTIONS = {
    id:       "title-card-uwu",
    classes:  ["title-card-uwu-overlay"],
    popOut:   false,
    window:   { frame: false },
  };

  // ── Rendering ─────────────────────────────────────────────────────────────

  /** @override — Build DOM directly; no external template file needed. */
  async _renderHTML(_context, _options) {
    const o = this.#opts;

    const wrapper = document.createElement("div");
    wrapper.classList.add("itc-wrapper");
    wrapper.style.cssText = `
      background-color: ${o.backgroundColor};
    `;

    // Texture layer (separate element so opacity is independent of text)
    if (o.backgroundTexture) {
      const tex = document.createElement("div");
      tex.classList.add("itc-texture");
      tex.style.cssText = `
        background-image: url("${o.backgroundTexture}");
        opacity: ${o.textureOpacity / 100};
      `;
      wrapper.appendChild(tex);
    }

    // Optional variant overlay image (future blood splatter etc.)
    if (o.overlayImage) {
      const overlay = document.createElement("div");
      overlay.classList.add("itc-overlay-image");
      overlay.style.backgroundImage = `url("${o.overlayImage}")`;
      wrapper.appendChild(overlay);
    }

    // Content block (centred; this is what gets zoomed)
    const content = document.createElement("div");
    content.classList.add("itc-content");

    const titleEl = document.createElement("div");
    titleEl.classList.add("itc-title");
    titleEl.textContent = o.title;
    titleEl.style.color = o.textColor;
    titleEl.style.fontFamily = `"${o.fontFamily}", "Oswald", sans-serif`;

    const subtitleBlock = document.createElement("div");
    subtitleBlock.classList.add("itc-subtitle-block");
    subtitleBlock.style.color = o.textColor;
    subtitleBlock.style.fontFamily = `"${o.fontFamily}", "Oswald", sans-serif`;
    subtitleBlock.style.opacity = "0"; // fades in via animator

    if (o.subtitle1) {
      const s1 = document.createElement("div");
      s1.classList.add("itc-subtitle1");
      s1.textContent = o.subtitle1;
      subtitleBlock.appendChild(s1);
    }

    if (o.subtitle2) {
      const s2 = document.createElement("div");
      s2.classList.add("itc-subtitle2");
      s2.textContent = o.subtitle2;
      subtitleBlock.appendChild(s2);
    }

    content.appendChild(titleEl);
    if (o.subtitle1 || o.subtitle2) content.appendChild(subtitleBlock);
    wrapper.appendChild(content);

    return wrapper;
  }

  /** @override — Mount element, inject font, start animations, play sound. */
  async _onRender(context, options) {
    await super._onRender(context, options);

    this.#injectFont();

    const wrapper     = this.element.querySelector(".itc-wrapper");
    const content     = this.element.querySelector(".itc-content");
    const subtitleBlock = this.element.querySelector(".itc-subtitle-block");
    const o           = this.#opts;

    // ── Sound ────────────────────────────────────────────────────────────
    if (o.soundPath) {
      foundry.audio.AudioHelper.play(
        { src: o.soundPath, volume: 1.0, autoplay: true, loop: false },
        false  // not broadcast — each client plays locally from socket trigger
      );
    }

    // ── Animations ───────────────────────────────────────────────────────
    // Zoom the whole wrapper (background + text move together)
    if (o.zoomPercent > 0) {
      this.#handles.push(
        startZoom(wrapper, {
          zoomPercent: o.zoomPercent,
          duration:    o.displayDuration,
        })
      );
    }

    // Subtitle fade-in after a short delay
    if (subtitleBlock) {
      this.#handles.push(
        fadeIn(subtitleBlock, { delay: 500, duration: 400 })
      );
    }

    // Auto-close after displayDuration + fade-out
    this.#closeTimer = setTimeout(() => this.#beginClose(), o.displayDuration);
  }

  // ── Teardown ──────────────────────────────────────────────────────────────

  /** Fade out then destroy. Called by the auto-close timer or external code. */
  async #beginClose() {
    // Cancel any still-running animations except fade-out
    this.#handles.forEach(h => h.cancel());
    this.#handles = [];

    const wrapper = this.element?.querySelector(".itc-wrapper");
    if (wrapper) {
      const fadeHandle = fadeOut(wrapper, { duration: 400 });
      await fadeHandle.finished;
    }

    await this.close({ force: true });
  }

  /** @override — Clean up timers and animation handles. */
  async _preClose(_options) {
    if (this.#closeTimer !== null) {
      clearTimeout(this.#closeTimer);
      this.#closeTimer = null;
    }
    this.#handles.forEach(h => h.cancel());
    this.#handles = [];
    return super._preClose(_options);
  }

  // ── Font injection ────────────────────────────────────────────────────────

  /** Inject a Google Fonts <link> into <head> once; skip if already present. */
  #injectFont() {
    const { fontUrl } = this.#opts;
    if (!fontUrl) return;

    const existingId = "itc-google-font";
    if (document.getElementById(existingId)) return; // already loaded

    const link  = document.createElement("link");
    link.id     = existingId;
    link.rel    = "stylesheet";
    link.href   = fontUrl;
    document.head.appendChild(link);
  }
}

// ── Static show helper ────────────────────────────────────────────────────────

/** Singleton guard — only one card on screen at a time. */
let _activeCard = null;

/**
 * Resolve settings + variant into options, then render the card.
 * This is what socket.js calls on every client.
 *
 * @param {object}      payload
 * @param {string}      payload.title
 * @param {string}      payload.subtitle1
 * @param {string}      payload.subtitle2
 * @param {string|null} payload.variantId
 * @param {object}      resolvedOptions - Pre-resolved from settings (see main.js)
 */
export function showTitleCard(payload, resolvedOptions) {
  // Dismiss any existing card immediately
  if (_activeCard) {
    _activeCard.close({ force: true });
    _activeCard = null;
  }

  const cardOpts = {
    title:             payload.title   || "",
    subtitle1:         payload.subtitle1 || "",
    subtitle2:         payload.subtitle2 || "",
    ...resolvedOptions,
  };

  const app = new TitleCardApplication({}, cardOpts);
  _activeCard = app;

  app.render({ force: true });

  // Clean up reference when the app closes
  app.addEventListener("close", () => {
    if (_activeCard === app) _activeCard = null;
  });
}
