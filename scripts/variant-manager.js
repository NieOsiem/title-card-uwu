
import { VariantTracker }   from "./variants.js";
import { getSetting, SETTINGS } from "./settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class VariantManagerDialog extends HandlebarsApplicationMixin(ApplicationV2) {

  static DEFAULT_OPTIONS = {
    id:       "itc-variant-manager",
    classes:  ["dialog"],
    tag:      "dialog",
    window:   {
      frame:     true,
      title:     "TITLECARDUWU.VariantManager.WindowTitle",
      resizable: false,
    },
    position: { width: 380 },
    actions:  {
      advance:  VariantManagerDialog.#onAdvance,
      reset:    VariantManagerDialog.#onReset,
      setIndex: VariantManagerDialog.#onSetIndex,
    },
  };

  static PARTS = {
    form: { template: "modules/title-card-uwu/templates/variant-manager.hbs" },
  };

  // ── Context ───────────────────────────────────────────────────────────────

  async _prepareContext(_options) {
    const all     = VariantTracker.getAll();
    const current = VariantTracker.getCurrent();
    const index   = getSetting(SETTINGS.CURRENT_VARIANT_INDEX);

    return {
      variants: all.map((v, i) => ({
        ...v,
        index,
        isCurrent: v.id === current.id,
        label: game.i18n.localize(v.label),
      })),
      current: {
        ...current,
        index,
        label: game.i18n.localize(current.label),
      },
      maxIndex: all.length - 1,
      i18n: {
        currentVariant: game.i18n.localize("TITLECARDUWU.VariantManager.CurrentVariant"),
        index:          game.i18n.localize("TITLECARDUWU.VariantManager.Index"),
        advance:        game.i18n.localize("TITLECARDUWU.VariantManager.Advance"),
        reset:          game.i18n.localize("TITLECARDUWU.VariantManager.Reset"),
        setIndex:       game.i18n.localize("TITLECARDUWU.VariantManager.SetIndex"),
        apply:          game.i18n.localize("TITLECARDUWU.VariantManager.Apply"),
        close:          game.i18n.localize("TITLECARDUWU.VariantManager.Close"),
      },
    };
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  static async #onAdvance(_event, _target) {
    await VariantTracker.advance();
    this.render();
  }

  static async #onReset(_event, _target) {
    await VariantTracker.reset();
    this.render();
  }

  static async #onSetIndex(_event, _target) {
    const input = this.element.querySelector("#itc-set-index-input");
    const n     = parseInt(input?.value ?? "0", 10);
    if (!isNaN(n)) {
      await VariantTracker.setIndex(n);
      this.render();
    }
  }
}
