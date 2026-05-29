

export const MODULE_ID = "invincible-title-card";

/** Enum of all setting keys. Import this instead of writing strings. */
export const SETTINGS = Object.freeze({
  FONT_SOURCE:          "fontSource",
  GOOGLE_FONT_FAMILY:   "googleFontFamily",
  FOUNDRY_FONT_FAMILY:  "foundryFontFamily",
  SOUND_PATH:           "soundPath",
  DISPLAY_DURATION:     "displayDuration",
  BACKGROUND_COLOR:     "backgroundColor",
  BACKGROUND_TEXTURE:   "backgroundTexture",
  TEXTURE_OPACITY:      "textureOpacity",
  TEXT_COLOR:           "textColor",
  ZOOM_AMOUNT:          "zoomAmount",
  // Hidden — managed programmatically by VariantTracker
  CURRENT_VARIANT_INDEX: "currentVariantIndex",
});

/** @returns {*} The current value of a module setting. */
export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

/** @returns {Promise} Resolves when the setting has been stored. */
export function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}

/** Register all settings. Call once from the "init" hook. */
export function registerSettings() {
  const ns = MODULE_ID;
  const S  = SETTINGS;

  // ── Font ────────────────────────────────────────────────────────────────

  game.settings.register(ns, S.FONT_SOURCE, {
    name: "INVINCIBLE.Settings.FontSource.Name",
    hint: "INVINCIBLE.Settings.FontSource.Hint",
    scope: "world",
    config: true,
    type: String,
    choices: {
      google:  "INVINCIBLE.Settings.FontSource.Google",
      foundry: "INVINCIBLE.Settings.FontSource.Foundry",
    },
    default: "google",
  });

  game.settings.register(ns, S.GOOGLE_FONT_FAMILY, {
    name: "INVINCIBLE.Settings.GoogleFontFamily.Name",
    hint: "INVINCIBLE.Settings.GoogleFontFamily.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "Oswald",
  });

  game.settings.register(ns, S.FOUNDRY_FONT_FAMILY, {
    name: "INVINCIBLE.Settings.FoundryFontFamily.Name",
    hint: "INVINCIBLE.Settings.FoundryFontFamily.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  // ── Audio ───────────────────────────────────────────────────────────────

  game.settings.register(ns, S.SOUND_PATH, {
    name: "INVINCIBLE.Settings.SoundPath.Name",
    hint: "INVINCIBLE.Settings.SoundPath.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "",
    filePicker: "audio",
  });

  // ── Display ─────────────────────────────────────────────────────────────

  game.settings.register(ns, S.DISPLAY_DURATION, {
    name: "INVINCIBLE.Settings.DisplayDuration.Name",
    hint: "INVINCIBLE.Settings.DisplayDuration.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 1000, max: 15000, step: 500 },
    default: 5000,
  });

  game.settings.register(ns, S.BACKGROUND_COLOR, {
    name: "INVINCIBLE.Settings.BackgroundColor.Name",
    hint: "INVINCIBLE.Settings.BackgroundColor.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "#1db0f6",
  });

  game.settings.register(ns, S.BACKGROUND_TEXTURE, {
    name: "INVINCIBLE.Settings.BackgroundTexture.Name",
    hint: "INVINCIBLE.Settings.BackgroundTexture.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "modules/invincible-title-card/textures/grunge.webp",
    filePicker: "imagevideo",
  });

  game.settings.register(ns, S.TEXTURE_OPACITY, {
    name: "INVINCIBLE.Settings.TextureOpacity.Name",
    hint: "INVINCIBLE.Settings.TextureOpacity.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 100, step: 5 },
    default: 20,
  });

  game.settings.register(ns, S.TEXT_COLOR, {
    name: "INVINCIBLE.Settings.TextColor.Name",
    hint: "INVINCIBLE.Settings.TextColor.Hint",
    scope: "world",
    config: true,
    type: String,
    default: "#f5e642",
  });

  game.settings.register(ns, S.ZOOM_AMOUNT, {
    name: "INVINCIBLE.Settings.ZoomAmount.Name",
    hint: "INVINCIBLE.Settings.ZoomAmount.Hint",
    scope: "world",
    config: true,
    type: Number,
    range: { min: 0, max: 20, step: 1 },
    default: 6,
  });

  // ── Internal (hidden from settings UI) ──────────────────────────────────

  game.settings.register(ns, S.CURRENT_VARIANT_INDEX, {
    scope: "world",
    config: false,
    type: Number,
    default: 0,
  });
}
