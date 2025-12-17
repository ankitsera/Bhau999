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
