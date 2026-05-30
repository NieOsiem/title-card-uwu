export const MODULE_ID = "title-card-uwu";

export const SETTINGS = Object.freeze({
  // Title font
  FONT_SOURCE:              "fontSource",
  GOOGLE_FONT_FAMILY:       "googleFontFamily",
  FOUNDRY_FONT_FAMILY:      "foundryFontFamily",
  // Subtitle font
  SUBTITLE_FONT_SOURCE:     "subtitleFontSource",
  SUBTITLE_GOOGLE_FONT:     "subtitleGoogleFont",
  SUBTITLE_FOUNDRY_FONT:    "subtitleFoundryFont",
  // Audio
  SOUND_PATH:               "soundPath",
  // Display
  DISPLAY_DURATION:         "displayDuration",
  BACKGROUND_COLOR:         "backgroundColor",
  BACKGROUND_TEXTURE:       "backgroundTexture",
  TEXTURE_OPACITY:          "textureOpacity",
  TEXT_COLOR:               "textColor",
  ZOOM_AMOUNT:              "zoomAmount",
  TITLE_SIZE_VW:            "titleSizeVw",
  VERTICAL_POSITION:        "verticalPosition",
  FADE_DURATION:            "fadeDuration",
  SUBTITLE_SPACING:         "subtitleSpacing",
  // Internal
  CURRENT_VARIANT_INDEX:    "currentVariantIndex",
});

export function getSetting(key) {
  return game.settings.get(MODULE_ID, key);
}

export function setSetting(key, value) {
  return game.settings.set(MODULE_ID, key, value);
}

const FONT_SOURCE_CHOICES = {
  google:  "TITLECARDUWU.Settings.FontSource.Google",
  foundry: "TITLECARDUWU.Settings.FontSource.Foundry",
};

export function registerSettings() {
  const ns = MODULE_ID;
  const S  = SETTINGS;

  // ── Title font ──────────────────────────────────────────────────────────

  game.settings.register(ns, S.FONT_SOURCE, {
    name:    "TITLECARDUWU.Settings.TitleFontSource.Name",
    hint:    "TITLECARDUWU.Settings.TitleFontSource.Hint",
    scope:   "world", config: true, type: String,
    choices: FONT_SOURCE_CHOICES,
    default: "google",
  });

  game.settings.register(ns, S.GOOGLE_FONT_FAMILY, {
    name:    "TITLECARDUWU.Settings.GoogleFontFamily.Name",
    hint:    "TITLECARDUWU.Settings.GoogleFontFamily.Hint",
    scope:   "world", config: true, type: String,
    default: "Oswald",
  });

  // Registered as String; renderSettingsConfig swaps the <input> for a <select>
  game.settings.register(ns, S.FOUNDRY_FONT_FAMILY, {
    name:    "TITLECARDUWU.Settings.FoundryFontFamily.Name",
    hint:    "TITLECARDUWU.Settings.FoundryFontFamily.Hint",
    scope:   "world", config: true, type: String,
    default: "",
  });

  // ── Subtitle font ───────────────────────────────────────────────────────

  game.settings.register(ns, S.SUBTITLE_FONT_SOURCE, {
    name:    "TITLECARDUWU.Settings.SubtitleFontSource.Name",
    hint:    "TITLECARDUWU.Settings.SubtitleFontSource.Hint",
    scope:   "world", config: true, type: String,
    choices: FONT_SOURCE_CHOICES,
    default: "google",
  });

  game.settings.register(ns, S.SUBTITLE_GOOGLE_FONT, {
    name:    "TITLECARDUWU.Settings.SubtitleGoogleFont.Name",
    hint:    "TITLECARDUWU.Settings.SubtitleGoogleFont.Hint",
    scope:   "world", config: true, type: String,
    default: "Oswald",
  });

  game.settings.register(ns, S.SUBTITLE_FOUNDRY_FONT, {
    name:    "TITLECARDUWU.Settings.SubtitleFoundryFont.Name",
    hint:    "TITLECARDUWU.Settings.SubtitleFoundryFont.Hint",
    scope:   "world", config: true, type: String,
    default: "",
  });

  // ── Audio ───────────────────────────────────────────────────────────────

  game.settings.register(ns, S.SOUND_PATH, {
    name:       "TITLECARDUWU.Settings.SoundPath.Name",
    hint:       "TITLECARDUWU.Settings.SoundPath.Hint",
    scope:      "world", config: true, type: String,
    default:    "",
    filePicker: "audio",
  });

  // ── Display ─────────────────────────────────────────────────────────────

  game.settings.register(ns, S.DISPLAY_DURATION, {
    name:    "TITLECARDUWU.Settings.DisplayDuration.Name",
    hint:    "TITLECARDUWU.Settings.DisplayDuration.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 1000, max: 15000, step: 500 },
    default: 5000,
  });

  game.settings.register(ns, S.BACKGROUND_COLOR, {
    name:    "TITLECARDUWU.Settings.BackgroundColor.Name",
    hint:    "TITLECARDUWU.Settings.BackgroundColor.Hint",
    scope:   "world", config: true, type: String,
    default: "#1db0f6",
  });

  game.settings.register(ns, S.BACKGROUND_TEXTURE, {
    name:       "TITLECARDUWU.Settings.BackgroundTexture.Name",
    hint:       "TITLECARDUWU.Settings.BackgroundTexture.Hint",
    scope:      "world", config: true, type: String,
    default:    "modules/title-card-uwu/textures/grunge.webp",
    filePicker: "imagevideo",
  });

  game.settings.register(ns, S.TEXTURE_OPACITY, {
    name:    "TITLECARDUWU.Settings.TextureOpacity.Name",
    hint:    "TITLECARDUWU.Settings.TextureOpacity.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 0, max: 100, step: 5 },
    default: 20,
  });

  game.settings.register(ns, S.TEXT_COLOR, {
    name:    "TITLECARDUWU.Settings.TextColor.Name",
    hint:    "TITLECARDUWU.Settings.TextColor.Hint",
    scope:   "world", config: true, type: String,
    default: "#f5e642",
  });

  game.settings.register(ns, S.ZOOM_AMOUNT, {
    name:    "TITLECARDUWU.Settings.ZoomAmount.Name",
    hint:    "TITLECARDUWU.Settings.ZoomAmount.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 0, max: 20, step: 1 },
    default: 6,
  });

  game.settings.register(ns, S.TITLE_SIZE_VW, {
    name:    "TITLECARDUWU.Settings.TitleSizeVw.Name",
    hint:    "TITLECARDUWU.Settings.TitleSizeVw.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 8, max: 40, step: 1 },
    default: 22,
  });

  game.settings.register(ns, S.VERTICAL_POSITION, {
    name:    "TITLECARDUWU.Settings.VerticalPosition.Name",
    hint:    "TITLECARDUWU.Settings.VerticalPosition.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 0, max: 100, step: 1 },
    default: 50,
  });

  game.settings.register(ns, S.FADE_DURATION, {
    name:    "TITLECARDUWU.Settings.FadeDuration.Name",
    hint:    "TITLECARDUWU.Settings.FadeDuration.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 0, max: 2000, step: 100 },
    default: 400,
  });

  game.settings.register(ns, S.SUBTITLE_SPACING, {
    name:    "TITLECARDUWU.Settings.SubtitleSpacing.Name",
    hint:    "TITLECARDUWU.Settings.SubtitleSpacing.Hint",
    scope:   "world", config: true, type: Number,
    range:   { min: 0, max: 10, step: 0.5 },
    default: 2.5,
  });

  // ── Internal ─────────────────────────────────────────────────────────────

  game.settings.register(ns, S.CURRENT_VARIANT_INDEX, {
    scope: "world", config: false, type: Number, default: 0,
  });
}

/**
 * Replace plain <input> elements for Foundry font settings with <select>
 * elements populated from FontConfig.getAvailableFonts(), which includes
 * all loaded fonts: built-in, module-provided, and user-added Additional Fonts.
 *
 * @param {HTMLElement} section
 */
export function injectFontSelectors(section) {
  const fontKeys = FontConfig.getAvailableFonts().sort();
  if (!fontKeys.length) return;

  for (const key of [SETTINGS.FOUNDRY_FONT_FAMILY, SETTINGS.SUBTITLE_FOUNDRY_FONT]) {
    const input = section.querySelector(`[name="${MODULE_ID}.${key}"]`);
    if (!input) continue;

    const current = input.value;
    const select  = document.createElement("select");
    select.name   = input.name;
    select.id     = input.id;

    const blank = document.createElement("option");
    blank.value       = "";
    blank.textContent = "—";
    select.appendChild(blank);

    for (const family of fontKeys) {
      const opt        = document.createElement("option");
      opt.value        = family;
      opt.textContent  = family;
      opt.style.fontFamily = family;
      if (family === current) opt.selected = true;
      select.appendChild(opt);
    }

    input.replaceWith(select);
  }
}