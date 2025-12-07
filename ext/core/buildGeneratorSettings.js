// ext/core/buildGeneratorSettings.js
// Helper to build generator settings from global settings object.
// Extracted from ext/trainer_logic.js so it can be reused by other modules
// (e.g. worksheet / print).

import { DEFAULTS } from "../../core/utils/constants.js";

/**
 * Build configuration object for example generator based on
 * full settings slice from global state.
 *
 * @param {Object} st - settings from state (state.settings)
 * @returns {Object} generatorSettings
 */
export function buildGeneratorSettingsFromSettings(st = {}) {
  const actionsCfg = st.actions ?? {};
  const blockSimpleDigits = Array.isArray(st?.blocks?.simple?.digits)
    ? st.blocks.simple.digits
    : [];

  const selectedDigits =
    blockSimpleDigits.length > 0
      ? blockSimpleDigits.map((d) => parseInt(d, 10))
      : [1, 2, 3, 4];

  const genMin =
    actionsCfg.infinite === true
      ? DEFAULTS.ACTIONS_MIN
      : (actionsCfg.min ??
         actionsCfg.count ??
         DEFAULTS.ACTIONS_MIN);

  const genMax =
    actionsCfg.infinite === true
      ? DEFAULTS.ACTIONS_MAX
      : (actionsCfg.max ??
         actionsCfg.count ??
         DEFAULTS.ACTIONS_MAX);

  return {
    blocks: {
      simple: {
        digits: selectedDigits,
        includeFive:
          (st.blocks?.simple?.includeFive ??
            selectedDigits.includes(5)),
        onlyAddition:
          (st.blocks?.simple?.onlyAddition ?? false),
        onlySubtraction:
          (st.blocks?.simple?.onlySubtraction ?? false)
      },
      brothers: {
        active: st.blocks?.brothers?.active ?? false,
        digits: st.blocks?.brothers?.digits ?? [4],
        onlyAddition: st.blocks?.brothers?.onlyAddition ?? false,
        onlySubtraction: st.blocks?.brothers?.onlySubtraction ?? false
      },
      friends: {
        active: st.blocks?.friends?.active ?? false
      },
      mix: {
        active: st.blocks?.mix?.active ?? false
      }
    },

    actions: {
      min: genMin,
      max: genMax,
      count: actionsCfg.count,
      infinite: actionsCfg.infinite === true
    },

    digits: st.digits,
    combineLevels: st.combineLevels || false
  };
}
