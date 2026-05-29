
import { registerSettings, getSetting, setSetting, MODULE_ID, SETTINGS } from "./settings.js";
import { registerSocketListener, broadcastTitleCard }                     from "./socket.js";
import { showTitleCard }                                                   from "./title-card.js";
import { VariantTracker }                                                  from "./variants.js";
import { TitleCardDialog }                                                 from "./macros.js";
import { VariantManagerDialog }                                            from "./variant-manager.js";

// ── Settings init ─────────────────────────────────────────────────────────────

Hooks.once("init", () => {
  registerSettings();
});

// ── Ready ─────────────────────────────────────────────────────────────────────

Hooks.once("ready", () => {
  // Build the public API on game[MODULE_ID]
  game[MODULE_ID] = {
    show:        (opts = {})    => _gmShow(opts),
    showDialog:  ()             => _openDialog(),
    variants:    VariantTracker,
  };

  // Listen for broadcasts from the GM
  registerSocketListener((payload) => {
    const resolved = _resolveOptions(payload.variantId ?? null);
    showTitleCard(payload, resolved);
  });
});

// ── Settings UI — Variant Manager button ──────────────────────────────────────

Hooks.on("renderSettingsConfig", (_app, html) => {
  // Find the module's section in the settings config
  const section = html instanceof HTMLElement
    ? html.querySelector(`[data-category="${MODULE_ID}"]`)
    : html[0]?.querySelector(`[data-category="${MODULE_ID}"]`);

  if (!section) return;

  const btn = document.createElement("button");
  btn.type        = "button";
  btn.textContent = game.i18n.localize("TITLECARDUWU.Settings.VariantManager.Label");
  btn.style.marginTop = "0.5rem";
  btn.addEventListener("click", () => new VariantManagerDialog().render({ force: true }));

  // Append after the last setting in this module's group
  section.appendChild(btn);
});

// ── Internal helpers ──────────────────────────────────────────────────────────

/**
 * GM-only: validate, resolve options, advance progression, broadcast.
 * @param {object} opts - { title, subtitle1, subtitle2, variantId }
 */
async function _gmShow(opts) {
  if (!game.user.isGM) {
    return ui.notifications.error(game.i18n.localize("TITLECARDUWU.Errors.GMOnly"));
  }

  const title = (opts.title ?? "").trim();
  if (!title) {
    return ui.notifications.warn("Title Card Uwu: title cannot be empty.");
  }

  const payload = {
    title,
    subtitle1: (opts.subtitle1 ?? "").trim(),
    subtitle2: (opts.subtitle2 ?? "").trim(),
    variantId: opts.variantId ?? null,
  };

  // Advance progression unless a specific variantId was requested
  if (!payload.variantId) {
    await VariantTracker.advance();
  }

  broadcastTitleCard(payload, (p) => {
    const resolved = _resolveOptions(p.variantId);
    showTitleCard(p, resolved);
  });
}

function _openDialog() {
  if (!game.user.isGM) {
    return ui.notifications.error(game.i18n.localize("TITLECARDUWU.Errors.GMOnly"));
  }
  new TitleCardDialog().render({ force: true });
}

/**
 * Read all display settings and variant data, return a plain options object
 * ready to pass to showTitleCard(). Isolates settings reads to one place.
 *
 * @param {string|null} variantId
 * @returns {object}
 */
function _resolveOptions(variantId) {
  const variant        = VariantTracker.getForShow(variantId);
  const fontSource     = getSetting(SETTINGS.FONT_SOURCE);
  const googleFamily   = getSetting(SETTINGS.GOOGLE_FONT_FAMILY).trim();
  const foundryFamily  = getSetting(SETTINGS.FOUNDRY_FONT_FAMILY).trim();
  const rawSoundPath   = variant.soundPath ?? getSetting(SETTINGS.SOUND_PATH).trim();

  // ── Font resolution ─────────────────────────────────────────────────────
  let fontFamily = "Oswald"; // safe fallback
  let fontUrl    = null;

  if (fontSource === "google" && googleFamily) {
    fontFamily = googleFamily;
    // Request weight 700 (boldest standard); italic is applied via CSS
    const encoded = encodeURIComponent(googleFamily);
    fontUrl = `https://fonts.googleapis.com/css2?family=${encoded}:wght@700&display=swap`;
  } else if (fontSource === "foundry" && foundryFamily) {
    fontFamily = foundryFamily;
    // Foundry-registered fonts are already available in CSS; no <link> needed
  }

  return {
    backgroundColor:  getSetting(SETTINGS.BACKGROUND_COLOR),
    backgroundTexture: getSetting(SETTINGS.BACKGROUND_TEXTURE),
    textureOpacity:   getSetting(SETTINGS.TEXTURE_OPACITY),
    textColor:        getSetting(SETTINGS.TEXT_COLOR),
    zoomPercent:      getSetting(SETTINGS.ZOOM_AMOUNT),
    displayDuration:  getSetting(SETTINGS.DISPLAY_DURATION),
    fontFamily,
    fontUrl,
    soundPath:        rawSoundPath || null,
    overlayImage:     variant.overlayImage ?? null,
  };
}
