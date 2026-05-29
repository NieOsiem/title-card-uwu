
import { getSetting, setSetting, SETTINGS } from "./settings.js";

/**
 * @typedef {Object} Variant
 * @property {string}      id            - Unique identifier
 * @property {string}      label         - i18n key for display name
 * @property {string|null} overlayImage  - URL of overlay PNG (null = none)
 * @property {string|null} soundPath     - Variant-specific sound (null = use setting)
 * @property {number}      textDistress  - Reserved: CSS filter intensity (0 = off)
 */

/** @type {Variant[]} */
const VARIANTS = [
  {
    id:           "clean",
    label:        "INVINCIBLE.Variants.Clean",
    overlayImage: null,
    soundPath:    null,   // falls back to module setting
    textDistress: 0,
  },
  // ── Future variants (uncomment and supply assets) ──────────────────────
  // {
  //   id:           "blood1",
  //   label:        "INVINCIBLE.Variants.Blood1",
  //   overlayImage: "modules/invincible-title-card/textures/blood1.webp",
  //   soundPath:    null,
  //   textDistress: 0,
  // },
  // {
  //   id:           "gritty",
  //   label:        "INVINCIBLE.Variants.Gritty",
  //   overlayImage: "modules/invincible-title-card/textures/gritty.webp",
  //   soundPath:    null,
  //   textDistress: 0.4,
  // },
];

/** Internal: clamp an index to the valid variant range. */
function clampIndex(n) {
  return Math.max(0, Math.min(Math.round(n), VARIANTS.length - 1));
}

export const VariantTracker = Object.freeze({

  /** All registered variants (read-only copy). */
  getAll() {
    return [...VARIANTS];
  },

  /** The variant at the current world-stored index. */
  getCurrent() {
    const index = getSetting(SETTINGS.CURRENT_VARIANT_INDEX);
    return VARIANTS[clampIndex(index)];
  },

  /** Advance to the next variant, wrapping around at the end. */
  async advance() {
    const current = getSetting(SETTINGS.CURRENT_VARIANT_INDEX);
    const next    = (current + 1) % VARIANTS.length;
    await setSetting(SETTINGS.CURRENT_VARIANT_INDEX, next);
    return VARIANTS[next];
  },

  /** Manually jump to a specific index. */
  async setIndex(n) {
    const clamped = clampIndex(n);
    await setSetting(SETTINGS.CURRENT_VARIANT_INDEX, clamped);
    return VARIANTS[clamped];
  },

  /** Reset progression back to the first variant. */
  async reset() {
    await setSetting(SETTINGS.CURRENT_VARIANT_INDEX, 0);
    return VARIANTS[0];
  },

  /**
   * Resolves which variant to actually use for a show() call.
   *
   * @param {string|null} overrideId - Pass a variant id to force a specific one,
   *                                   or null to use the current progression index.
   * @returns {Variant}
   */
  getForShow(overrideId = null) {
    if (overrideId) {
      const found = VARIANTS.find(v => v.id === overrideId);
      if (found) return found;
      console.warn(`Invincible Title Card | Unknown variant id "${overrideId}", using current.`);
    }
    return this.getCurrent();
  },
});
