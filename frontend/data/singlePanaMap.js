import { getDoublePanaSuggestions } from './doublePanaMap';
import { getTriplePanaSuggestions } from './triplePanaMap';

export const SINGLE_PANA_BY_RESULT_DIGIT = {
  0: ['127','136','145','190','235','280','370','389','460','479','569','578',],
  1: ['128','137','146','236','245','290','380','470','489','560','579','678',],
  2: ['129','138','147','156','237','246','345','390','480','570','589','679',],
  3: ['120','139','148','157','238','247','256','346','490','580','670','689',],
  4: ['130','149','158','167','239','248','257','347','356','590','680','789',],
  5: ['140','159','168','230','249','258','267','348','357','456','690','780',],
  6: ['123','150','169','178','240','259','268','349','358','367','457','790',],
  7: ['124','160','179','250','269','278','340','359','368','458','467','890',],
  8: ['125','134','170','189','260','279','350','369','378','459','468','567',],
  9: ['126','135','180','234','270','289','360','379','450','469','478','568',],
};

// Flatten once into a master list
export const ALL_SINGLE_PANA = Object.values(
  SINGLE_PANA_BY_RESULT_DIGIT,
).flat();

// Precompute map by FIRST digit for super-fast suggestions
const PANAS_BY_FIRST_DIGIT = ALL_SINGLE_PANA.reduce((acc, pana) => {
  const first = pana[0];
  if (!acc[first]) acc[first] = [];
  acc[first].push(pana);
  return acc;
}, {});

// Helper: get pana suggestions for user input
export function getSinglePanaSuggestions(input) {
  if (!input) return [];

  const cleaned = input.replace(/[^0-9]/g, '');
  if (cleaned.length === 0) return [];

  const first = cleaned[0];
  const baseList = PANAS_BY_FIRST_DIGIT[first] || [];

  // 1 digit: all panas starting with that digit
  if (cleaned.length === 1) {
    return baseList;
  }

  // 2–3 digits: progressively filter by prefix
  return baseList.filter(pana => pana.startsWith(cleaned));
}

/**
 * Motor helper: sanitize input to UNIQUE digits (no duplicates), maxLen up to 6.
 * - Blocks duplicate digits while typing/pasting
 * - Keeps order of first occurrence
 */
export function sanitizeMotorDigits(input, maxLen = 6) {
  const clean = String(input || "").replace(/[^0-9]/g, "");
  let uniq = "";

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (!uniq.includes(ch)) uniq += ch;
    if (uniq.length === maxLen) break;
  }

  return uniq;
}

/**
 * Motor helper: returns all SINGLE PANAs that can be formed using ONLY digits in `digitsStr`
 * - digitsStr must be 4..6 unique digits (but function works for any length >= 1)
 * - Example: "258469" -> all panas whose 3 digits are in that set
 */
export function getSinglePanaMotorPanas(digitsStr) {
  const digits = String(digitsStr || "").replace(/[^0-9]/g, "");
  const set = new Set(digits.split(""));

  const matches = ALL_SINGLE_PANA.filter((p) => set.has(p[0]) && set.has(p[1]) && set.has(p[2]));

  return Array.from(new Set(matches)).sort((a, b) => Number(a) - Number(b));
}

/* -------------------- ✅ SP COMMON HELPER (NEW) -------------------- */
/**
 * Precompute: digit -> all SINGLE PANAS that contain that digit anywhere.
 * Used by SpCommon screen.
 */
const SINGLE_PANA_BY_ANY_DIGIT = (() => {
  const acc = { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [] };

  ALL_SINGLE_PANA.forEach((p) => {
    // single pana digits are unique, so no need for Set, but safe anyway
    const uniq = new Set(p.split(""));
    uniq.forEach((d) => {
      if (acc[d]) acc[d].push(p);
    });
  });

  // sort for stable UI
  Object.keys(acc).forEach((k) => {
    acc[k].sort((a, b) => Number(a) - Number(b));
  });

  return acc;
})();

/**
 * Return all single panas where `digit` exists in the pana.
 */
export function getSinglePanaCommonDigitPanas(digit) {
  const d = String(digit ?? "").replace(/[^0-9]/g, "");
  if (d.length !== 1) return [];
  return SINGLE_PANA_BY_ANY_DIGIT[d] || [];
}

/**
 * Combined suggestions from ALL three pana types: single, double, and triple.
 * Returns a merged, deduplicated, sorted list of all matching panas.
 */
export function getAllPanaSuggestions(input) {
  const singleSuggestions = getSinglePanaSuggestions(input);
  const doubleSuggestions = getDoublePanaSuggestions(input);
  const tripleSuggestions = getTriplePanaSuggestions(input);

  // Combine and remove duplicates, then sort numerically
  const all = [
    ...singleSuggestions,
    ...doubleSuggestions,
    ...tripleSuggestions,
  ];

  return Array.from(new Set(all)).sort((a, b) => Number(a) - Number(b));
}