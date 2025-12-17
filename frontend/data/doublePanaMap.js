export const DOUBLE_PANA_BY_RESULT_DIGIT = {
  "0": ["118", "226", "244", "299", "334", "488", "550", "668", "677"],
  "1": ["100", "119", "155", "227", "335", "344", "399", "588", "669"],
  "2": ["110", "200", "228", "255", "336", "499", "660", "688", "778"],
  "3": ["166", "229", "300", "337", "445", "558", "599", "779", "788"],
  "4": ["112", "220", "338", "400", "446", "455", "664", "699", "770"],
  "5": ["113", "122", "177", "339", "366", "447", "500", "799", "889"],
  "6": ["114", "277", "330", "448", "466", "556", "600", "880", "899"],
  "7": ["115", "133", "188", "223", "377", "449", "557", "566", "700"],
  "8": ["116", "224", "233", "288", "440", "477", "558", "800", "990"],
  "9": ["117", "144", "199", "225", "388", "559", "577", "667", "900"],
};

/**
 * Flat list of all double pana values (string).
 * Useful for special-mode initialization and totals.
 */
export const ALL_DOUBLE_PANA = Object.keys(DOUBLE_PANA_BY_RESULT_DIGIT)
  .sort((a, b) => Number(a) - Number(b))
  .flatMap((k) => DOUBLE_PANA_BY_RESULT_DIGIT[k]);

/**
 * Suggestions helper for Easy Mode input.
 * - If user types 1 digit: show all panas whose first digit matches
 * - If user types 2 digits: show all panas starting with those 2 digits
 * - If user types 3 digits: return exact match (if exists), else []
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