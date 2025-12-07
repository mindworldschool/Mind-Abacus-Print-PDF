// ext/worksheetGenerator.js
// Генерация "листа заданий" (worksheet) для печати или просмотра.
// Использует те же настройки, что и тренажёр, и тот же generateExample,
// чтобы не ломать логику "физики" абакуса.

import { state } from "../core/state.js";
import { generateExample } from "./core/generator.js";

// В этом модуле храним последний сгенерированный лист,
// чтобы UI и печать могли его использовать.
let lastWorksheet = null;

/**
 * Вспомогательная функция: сколько примеров генерировать по умолчанию
 * (логика такая же, как в trainer_logic.js → getExampleCount)
 */
function getDefaultExampleCount(examplesCfg) {
  if (!examplesCfg) return 10;
  return examplesCfg.infinite ? 10 : (examplesCfg.count ?? 10);
}

/**
 * Построить конфиг для generateExample на основе текущих настроек.
 * Логика совпадает с ext/trainer_logic.js → showNextExample().
 */
function buildGeneratorConfigFromSettings(settings) {
  const st = settings ?? {};
  const actionsCfg = st.actions ?? {};
  const blockSimpleDigits = Array.isArray(st?.blocks?.simple?.digits)
    ? st.blocks.simple.digits
    : [];

  // какие "цифры" используются в простых примерах
  const selectedDigits =
    blockSimpleDigits.length > 0
      ? blockSimpleDigits.map((d) => parseInt(d, 10))
      : [1, 2, 3, 4];

  // min/max шагов — как в trainer_logic.js
  const minSteps = actionsCfg.infinite ? 2 : (actionsCfg.count ?? 2);
  const maxSteps = actionsCfg.infinite ? 5 : (actionsCfg.count ?? 2);

  return {
    blocks: {
      simple: {
        digits: selectedDigits
      }
    },
    actions: {
      min: minSteps,
      max: maxSteps
    }
  };
}

/**
 * Сгенерировать worksheet (лист примеров для печати).
 *
 * @param {Object} options
 * @param {number} [options.count]       - Сколько примеров сгенерировать (если не указано — берём из настроек).
 * @param {boolean} [options.showAnswers]- Флаг "показывать ли ответы" (для листа с ответами).
 *
 * @returns {Object} worksheet
 *   {
 *     examples: [
 *       {
 *         id: number,          // № примера по порядку
 *         actionsCount: number,// количество действий (шагов)
 *         answer: number|null, // правильный ответ
 *         steps: Array         // массив шагов (для справки / листа ответов)
 *       },
 *       ...
 *     ],
 *     meta: {
 *       createdAt: string,     // ISO-строка даты создания
 *       settingsSnapshot: {},  // "снимок" настроек на момент генерации
 *       showAnswers: boolean   // нужно ли выводить лист ответов
 *     }
 *   }
 */
export function generateWorksheet(options = {}) {
  const { count, showAnswers = false } = options;

  // Берём текущие настройки из глобального state
  const st = state.settings ?? {};
  const examplesCfg = st.examples ?? {};

  // Сколько примеров генерировать:
  const examplesToGenerate =
    typeof count === "number" && count > 0
      ? count
      : getDefaultExampleCount(examplesCfg);

  // Конфиг для генератора примеров — строго как в тренажёре
  const generatorConfig = buildGeneratorConfigFromSettings(st);

  const examples = [];

  for (let i = 0; i < examplesToGenerate; i++) {
    const generated = generateExample(generatorConfig);

    // Ожидаем, что generateExample вернёт объект в формате,
    // с которым уже работает тренажёр:
    //   { steps: [...], answer: number, ... }
    const steps = Array.isArray(generated.steps)
      ? generated.steps
      : [];

    const answer =
      typeof generated.answer !== "undefined"
        ? generated.answer
        : null;

    examples.push({
      id: i + 1,
      actionsCount: steps.length,
      answer,
      steps
    });
  }

  // Собираем объект worksheet
  const worksheet = {
    examples,
    meta: {
      createdAt: new Date().toISOString(),
      // Делаем "снимок" настроек, чтобы понимать, под какие параметры был создан лист
      settingsSnapshot: JSON.parse(JSON.stringify(st)),
      showAnswers: !!showAnswers
    }
  };

  // Сохраняем как последний сгенерированный лист
  lastWorksheet = worksheet;

  return worksheet;
}

/**
 * Получить последний сгенерированный worksheet.
 * Можно использовать в UI и при печати PDF.
 */
export function getLastWorksheet() {
  return lastWorksheet;
}
