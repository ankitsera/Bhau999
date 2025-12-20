export const DOUBLE_PANA_BY_RESULT_DIGIT = {
  "0": ["118", "226", "244", "299", "334", "488", "550", "668", "677"],
  "1": ["100", "119", "155", "227", "335", "344", "399", "588", "669"],
  "2": ["110", "200", "228", "255", "336", "499", "660", "688", "778"],
  "3": ["166", "229", "300", "337", "355", "445", "599", "779", "788"],
  "4": ["112", "220", "266", "338", "400", "446", "455", "699", "770"],
  "5": ["113", "122", "177", "339", "366", "447", "500", "799", "889"],
  "6": ["114", "277", "330", "448", "466", "556", "600", "880", "899"],
  "7": ["115", "133", "188", "223", "377", "449", "557", "566", "700"],
  "8": ["116", "224", "233", "288", "440", "477", "558", "800", "990"],
  "9": ["117", "144", "199", "225", "388", "559", "577", "667", "900"],
};

/**
 * Flat list of all double pana values (string).
 */
export const ALL_DOUBLE_PANA = Object.keys(DOUBLE_PANA_BY_RESULT_DIGIT)
  .sort((a, b) => Number(a) - Number(b))
  .flatMap((k) => DOUBLE_PANA_BY_RESULT_DIGIT[k]);

/**
 * Suggestions helper for Easy Mode input.
 * - 1 digit: all panas whose first digit matches
 * - 2 digits: all panas starting with those 2 digits
 * - 3 digits: exact match only
 */
export const getDoublePanaSuggestions = (input) => {
  if (!input) return [];

  const clean = String(input).replace(/[^0-9]/g, "");
  if (clean.length === 0) return [];
  if (clean.length > 3) return [];

  // startsWith matching from ALL list
  const matches = ALL_DOUBLE_PANA.filter((p) => p.startsWith(clean));

  // keep results stable + unique
  const uniq = Array.from(new Set(matches));

  // small UX rule: don't show dropdown if already 3 digits
  if (clean.length === 3) {
    return uniq.includes(clean) ? [clean] : [];
  }

  return uniq;
};

/**
 * Motor helper: returns all DOUBLE PANAs that can be formed using ONLY digits in `digitsStr`
 * - digitsStr should be 4..6 unique digits (but works for any length >= 1)
 */
export function getDoublePanaMotorPanas(digitsStr) {
  const digits = String(digitsStr || "").replace(/[^0-9]/g, "");
  const set = new Set(digits.split(""));

  const matches = ALL_DOUBLE_PANA.filter((p) => set.has(p[0]) && set.has(p[1]) && set.has(p[2]));

  return Array.from(new Set(matches)).sort((a, b) => Number(a) - Number(b));
}

/* -------------------- ✅ DP COMMON HELPER (NEW) -------------------- */
/**
 * Precompute: digit -> all DOUBLE PANAS that contain that digit anywhere.
 * Used by DpCommon screen.
 */
const DOUBLE_PANA_BY_ANY_DIGIT = (() => {
  const acc = { "0": [], "1": [], "2": [], "3": [], "4": [], "5": [], "6": [], "7": [], "8": [], "9": [] };

  ALL_DOUBLE_PANA.forEach((p) => {
    const uniq = new Set(p.split("")); // double pana can repeat digit, so Set avoids pushing twice
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
 * Return all double panas where `digit` exists in the pana.
 */
export function getDoublePanaCommonDigitPanas(digit) {
  const d = String(digit ?? "").replace(/[^0-9]/g, "");
  if (d.length !== 1) return [];
  return DOUBLE_PANA_BY_ANY_DIGIT[d] || [];
}