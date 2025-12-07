// ext/worksheetGenerator.js
// Генерация "листа заданий" (worksheet) для печати или просмотра.
// Использует те же настройки, что и тренажёр, и тот же generateExample,
// чтобы не ломать логику "физики" абакуса.

import { state } from "../core/state.js";
import { generateExample } from "./core/generator.js";
import { buildGeneratorSettingsFromSettings } from "./core/buildGeneratorSettings.js";

// В этом модуле храним последний сгенерированный лист,
// чтобы UI и печать могли его использовать.
let lastWorksheet = null;

/**
 * Сколько примеров генерировать по умолчанию.
 * Берём из settings.examples, как в тренажёре.
 */
function getDefaultExampleCount(examplesCfg) {
  if (!examplesCfg) return 10;
  return examplesCfg.infinite ? 10 : (examplesCfg.count ?? 10);
}

/**
 * Сгенерировать worksheet (лист примеров для печати).
 */
export function generateWorksheet(options = {}) {
  const { count, showAnswers = false } = options;

  const st = state.settings ?? {};
  const examplesCfg = st.examples ?? {};

  const examplesToGenerate =
    typeof count === "number" && count > 0
      ? count
      : getDefaultExampleCount(examplesCfg);

  const generatorConfig = buildGeneratorSettingsFromSettings(st);

  const examples = [];

  for (let i = 0; i < examplesToGenerate; i++) {
    const generated = generateExample(generatorConfig);

    const steps = Array.isArray(generated.steps)
      ? generated.steps
      : [];

    const answer =
      typeof generated.answer !== "undefined"
        ? generated.answer
        : (typeof generated.correctAnswer !== "undefined"
            ? generated.correctAnswer
            : null);

    examples.push({
      id: i + 1,
      actionsCount: steps.length,
      answer,
      steps
    });
  }

  const worksheet = {
    examples,
    meta: {
      createdAt: new Date().toISOString(),
      settingsSnapshot: JSON.parse(JSON.stringify(st)),
      showAnswers: !!showAnswers
    }
  };

  lastWorksheet = worksheet;
  return worksheet;
}

/**
 * Получить последний сгенерированный worksheet.
 */
export function getLastWorksheet() {
  return lastWorksheet;
}
