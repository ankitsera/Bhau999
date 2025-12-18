export const ALL_TRIPLE_PANA = [
  "000",
  "111",
  "222",
  "333",
  "444",
  "555",
  "666",
  "777",
  "888",
  "999",
];

// Map by RESULT digit (sum of digits % 10)
// 000 -> 0
// 111 -> 3
// 222 -> 6
// 333 -> 9
// 444 -> 12 % 10 = 2
// 555 -> 15 % 10 = 5
// 666 -> 18 % 10 = 8
// 777 -> 21 % 10 = 1
// 888 -> 24 % 10 = 4
// 999 -> 27 % 10 = 7
export const TRIPLE_PANA_BY_RESULT_DIGIT = {
  0: ["000"],
  1: ["777"],
  2: ["444"],
  3: ["111"],
  4: ["888"],
  5: ["555"],
  6: ["222"],
  7: ["999"],
  8: ["666"],
  9: ["333"],
};

// Map by FIRST digit (useful for suggestion-like flows)
export const TRIPLE_PANA_BY_FIRST_DIGIT = ALL_TRIPLE_PANA.reduce((acc, pana) => {
  const first = pana[0];
  if (!acc[first]) acc[first] = [];
  acc[first].push(pana);
  return acc;
}, {});

// Helper: get suggestions (works like your singlePanaMap helper)
export function getTriplePanaSuggestions(input) {
  if (!input) return [];

  const cleaned = input.replace(/[^0-9]/g, "");
  if (cleaned.length === 0) return [];

  const first = cleaned[0];
  const baseList = TRIPLE_PANA_BY_FIRST_DIGIT[first] || [];

  // 1 digit -> all triple panas starting with that digit
  if (cleaned.length === 1) return baseList;

  // 2–3 digits -> filter by prefix
  return baseList.filter((p) => p.startsWith(cleaned));
}