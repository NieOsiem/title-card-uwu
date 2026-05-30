import { registerSettings, getSetting, MODULE_ID, SETTINGS, injectFontSelectors } from "./settings.js";
import { registerSocketListener, broadcastTitleCard }                               from "./socket.js";
import { showTitleCard }                                                             from "./title-card.js";
import { VariantTracker }                                                            from "./variants.js";
import { TitleCardDialog }                                                           from "./macros.js";
import { VariantManagerDialog }                                                      from "./variant-manager.js";

Hooks.once("init", () => {
  registerSettings();
});

Hooks.once("ready", () => {
  game[MODULE_ID] = {
    show:       (opts = {}) => _gmShow(opts),
    showDialog: ()          => _openDialog(),
    variants:   VariantTracker,
  };

  registerSocketListener((payload) => {
    showTitleCard(payload, _resolveOptions(payload.variantId ?? null));
  });
});

Hooks.on("renderSettingsConfig", (_app, html) => {
  const section = html instanceof HTMLElement
    ? html.querySelector(`[data-category="${MODULE_ID}"]`)
    : html[0]?.querySelector(`[data-category="${MODULE_ID}"]`);

  if (!section) return;

  injectFontSelectors(section);

  const btn = document.createElement("button");
  btn.type        = "button";
  btn.textContent = game.i18n.localize("TITLECARDUWU.Settings.VariantManager.Label");
  btn.style.marginTop = "0.5rem";
  btn.addEventListener("click", () => new VariantManagerDialog().render({ force: true }));
  section.appendChild(btn);
});

// ── Internal helpers ──────────────────────────────────────────────────────────

async function _gmShow(opts) {
  if (!game.user.isGM) {
    return ui.notifications.error(game.i18n.localize("TITLECARDUWU.Errors.GMOnly"));
  }

  const payload = {
    title:     (opts.title ?? "").trim() || game.i18n.localize("TITLECARDUWU.DefaultTitle"),
    subtitle1: (opts.subtitle1 ?? "").trim(),
    subtitle2: (opts.subtitle2 ?? "").trim(),
    variantId: opts.variantId ?? null,
  };

  if (!payload.variantId) {
    await VariantTracker.advance();
  }

  broadcastTitleCard(payload, (p) => {
    showTitleCard(p, _resolveOptions(p.variantId));
  });
}

function _openDialog() {
  if (!game.user.isGM) {
    return ui.notifications.error(game.i18n.localize("TITLECARDUWU.Errors.GMOnly"));
  }
  new TitleCardDialog().render({ force: true });
}

function _resolveFont(sourceKey, googleKey, foundryKey) {
  const source  = getSetting(sourceKey);
  const google  = getSetting(googleKey).trim();
  const foundry = getSetting(foundryKey).trim();

  if (source === "google" && google) {
    const encoded = encodeURIComponent(google);
    return {
      fontFamily: google,
      fontUrl:    `https://fonts.googleapis.com/css2?family=${encoded}:wght@700&display=swap`,
    };
  }
  if (source === "foundry" && foundry) {
    return { fontFamily: foundry, fontUrl: null };
  }
  return { fontFamily: "Oswald", fontUrl: null };
}

function _resolveOptions(variantId) {
  const variant = VariantTracker.getForShow(variantId);

  const title    = _resolveFont(SETTINGS.FONT_SOURCE,         SETTINGS.GOOGLE_FONT_FAMILY,  SETTINGS.FOUNDRY_FONT_FAMILY);
  const subtitle = _resolveFont(SETTINGS.SUBTITLE_FONT_SOURCE, SETTINGS.SUBTITLE_GOOGLE_FONT, SETTINGS.SUBTITLE_FOUNDRY_FONT);

  return {
    backgroundColor:    getSetting(SETTINGS.BACKGROUND_COLOR),
    backgroundTexture:  getSetting(SETTINGS.BACKGROUND_TEXTURE),
    textureOpacity:     getSetting(SETTINGS.TEXTURE_OPACITY),
    textColor:          getSetting(SETTINGS.TEXT_COLOR),
    zoomPercent:        getSetting(SETTINGS.ZOOM_AMOUNT),
    displayDuration:    getSetting(SETTINGS.DISPLAY_DURATION),
    titleSizeVw:        getSetting(SETTINGS.TITLE_SIZE_VW),
    verticalPosition:   getSetting(SETTINGS.VERTICAL_POSITION),
    titleFontFamily:    title.fontFamily,
    titleFontUrl:       title.fontUrl,
    subtitleFontFamily: subtitle.fontFamily,
    subtitleFontUrl:    subtitle.fontUrl,
    soundPath:          variant.soundPath ?? (getSetting(SETTINGS.SOUND_PATH).trim() || null),
    overlayImage:       variant.overlayImage ?? null,
  };
}