import { startZoom, fadeIn, fadeOut } from "./animator.js";

/**
 * @typedef {Object} TitleCardOptions
 * @property {string}      title
 * @property {string}      subtitle1
 * @property {string}      subtitle2
 * @property {string}      backgroundColor
 * @property {string}      textColor
 * @property {string}      backgroundTexture
 * @property {number}      textureOpacity    - 0–100
 * @property {string}      fontFamily
 * @property {string|null} fontUrl
 * @property {string|null} overlayImage
 * @property {string|null} soundPath
 * @property {number}      displayDuration   - ms
 * @property {number}      zoomPercent
 */

class TitleCard {
  /** @type {HTMLElement|null} */
  #el = null;
  #handles = [];
  #closeTimer = null;

  /** @param {TitleCardOptions} opts */
  constructor(opts) {
    this.opts = opts;
  }

  show() {
    this.#injectFont();
    this.#el = this.#buildDOM();
    document.body.appendChild(this.#el);
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
      tex.style.opacity = String(o.textureOpacity / 100);
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

    const titleEl = document.createElement("div");
    titleEl.classList.add("itc-title");
    titleEl.textContent = o.title;
    titleEl.style.color = o.textColor;
    titleEl.style.fontFamily = `"${o.fontFamily}", "Oswald", sans-serif`;
    content.appendChild(titleEl);

    if (o.subtitle1 || o.subtitle2) {
      const block = document.createElement("div");
      block.classList.add("itc-subtitle-block");
      block.style.color = o.textColor;
      block.style.fontFamily = `"${o.fontFamily}", "Oswald", sans-serif`;
      block.style.opacity = "0";

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
    const o       = this.opts;
    const wrapper = this.#el.querySelector(".itc-wrapper");
    const block   = this.#el.querySelector(".itc-subtitle-block");

    if (o.zoomPercent > 0) {
      this.#handles.push(
        startZoom(wrapper, { zoomPercent: o.zoomPercent, duration: o.displayDuration })
      );
    }

    if (block) {
      this.#handles.push(fadeIn(block, { delay: 500, duration: 400 }));
    }
  }

  async #beginClose() {
    this.#handles.forEach(h => h.cancel());
    this.#handles = [];

    const wrapper = this.#el?.querySelector(".itc-wrapper");
    if (wrapper) {
      await fadeOut(wrapper, { duration: 400 }).finished;
    }
    this.#el?.remove();
    this.#el = null;
  }

  #injectFont() {
    const { fontUrl } = this.opts;
    if (!fontUrl || document.getElementById("itc-google-font")) return;
    const link  = document.createElement("link");
    link.id     = "itc-google-font";
    link.rel    = "stylesheet";
    link.href   = fontUrl;
    document.head.appendChild(link);
  }
}

// ── Module-level singleton ────────────────────────────────────────────────────

let _active = null;

/**
 * @param {object} payload   - { title, subtitle1, subtitle2, variantId }
 * @param {object} resolved  - Pre-resolved display options from settings (see main.js)
 */
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