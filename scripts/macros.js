
import { VariantTracker }    from "./variants.js";
import { MODULE_ID }         from "./settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

// ── Dialog ────────────────────────────────────────────────────────────────────

export class TitleCardDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id:       "itc-show-dialog",
    classes:  ["dialog"],
    tag:      "dialog",
    window:   {
      frame: true,
      title: "INVINCIBLE.Dialog.WindowTitle",
    },
    position: { width: 420 },
    actions:  {
      show:      TitleCardDialog.#onShow,
      copyMacro: TitleCardDialog.#onCopyMacro,
    },
  };

  static PARTS = {
    form: { template: "modules/invincible-title-card/templates/dialog.hbs" },
  };

  // ── Context ─────────────────────────────────────────────────────────────

  async _prepareContext(_options) {
    const variants = VariantTracker.getAll().map(v => ({
      id:        v.id,
      label:     game.i18n.localize(v.label),
      isCurrent: v.id === VariantTracker.getCurrent().id,
    }));

    return {
      variants,
      i18n: {
        title:          game.i18n.localize("INVINCIBLE.Dialog.Title"),
        titlePH:        game.i18n.localize("INVINCIBLE.Dialog.TitlePlaceholder"),
        subtitle1:      game.i18n.localize("INVINCIBLE.Dialog.Subtitle1"),
        subtitle1PH:    game.i18n.localize("INVINCIBLE.Dialog.Subtitle1Placeholder"),
        subtitle2:      game.i18n.localize("INVINCIBLE.Dialog.Subtitle2"),
        subtitle2PH:    game.i18n.localize("INVINCIBLE.Dialog.Subtitle2Placeholder"),
        variant:        game.i18n.localize("INVINCIBLE.Dialog.Variant"),
        currentLabel:   game.i18n.localize("INVINCIBLE.Dialog.CurrentLabel"),
        show:           game.i18n.localize("INVINCIBLE.Dialog.Show"),
        copyMacro:      game.i18n.localize("INVINCIBLE.Dialog.CopyMacro"),
        cancel:         game.i18n.localize("INVINCIBLE.Dialog.Cancel"),
      },
    };
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Read the current form values from the dialog DOM. */
  #readForm() {
    const el = this.element;
    return {
      title:     el.querySelector("#itc-title")?.value.trim()     ?? "",
      subtitle1: el.querySelector("#itc-subtitle1")?.value.trim() ?? "",
      subtitle2: el.querySelector("#itc-subtitle2")?.value.trim() ?? "",
      variantId: el.querySelector("#itc-variant")?.value          ?? null,
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  static async #onShow(_event, _target) {
    const opts = this.#readForm();
    // null means "use current progression" which is the default behaviour
    const variantId = opts.variantId === "__current__" ? null : opts.variantId;
    game[MODULE_ID].show({ ...opts, variantId });
    this.close();
  }

  static async #onCopyMacro(_event, _target) {
    const opts = this.#readForm();
    const variantId = opts.variantId === "__current__" ? null : opts.variantId;
    const script = generateMacroScript({ ...opts, variantId });

    try {
      await navigator.clipboard.writeText(script);
      ui.notifications.info(game.i18n.localize("INVINCIBLE.Dialog.MacroCopied"));
    } catch {
      console.log(`%c[Invincible Title Card] Hardcoded macro script:`, "font-weight:bold");
      console.log(script);
      ui.notifications.warn(game.i18n.localize("INVINCIBLE.Dialog.MacroCopyFailed"));
    }
  }
}

// ── Macro script generator ────────────────────────────────────────────────────

/**
 * Returns a self-contained macro script string with options baked in.
 *
 * @param {object}      opts
 * @param {string}      opts.title
 * @param {string}      [opts.subtitle1]
 * @param {string}      [opts.subtitle2]
 * @param {string|null} [opts.variantId]  - null = use current progression
 * @returns {string}
 */
export function generateMacroScript({ title, subtitle1 = "", subtitle2 = "", variantId = null }) {
  // Safely serialise so quote characters inside text don't break the script
  const safe = (s) => JSON.stringify(s);

  return [
    `// Invincible Title Card — hardcoded macro`,
    `// Edit the values below to customise.`,
    `game["${MODULE_ID}"].show({`,
    `  title:     ${safe(title)},`,
    `  subtitle1: ${safe(subtitle1)},`,
    `  subtitle2: ${safe(subtitle2)},`,
    `  variantId: ${safe(variantId)},  // null = follow progression`,
    `});`,
  ].join("\n");
}
