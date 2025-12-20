const SINGLE_PANA_BY_RESULT_DIGIT = {
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

const DOUBLE_PANA_BY_RESULT_DIGIT = {
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

console.log("=== VERIFYING SINGLE PANA ===");
let singleErrors = [];
for (const [key, numbers] of Object.entries(SINGLE_PANA_BY_RESULT_DIGIT)) {
  for (const num of numbers) {
    const sum = num.split('').reduce((a, b) => a + parseInt(b), 0);
    const result = sum % 10;
    if (result != key) {
      singleErrors.push(`Key ${key}: ${num} has sum ${sum}, result ${result}`);
    }
  }
}

if (singleErrors.length === 0) {
  console.log('✓ Single Pana: All numbers follow the formula (sum of digits) % 10 = key');
} else {
  console.log('✗ Single Pana: Found ' + singleErrors.length + ' errors:');
  singleErrors.forEach(e => console.log('  ' + e));
}

console.log("\n=== VERIFYING DOUBLE PANA ===");
let doubleErrors = [];
for (const [key, numbers] of Object.entries(DOUBLE_PANA_BY_RESULT_DIGIT)) {
  for (const num of numbers) {
    const sum = num.split('').reduce((a, b) => a + parseInt(b), 0);
    const result = sum % 10;
    if (result != key) {
      doubleErrors.push(`Key ${key}: ${num} has sum ${sum}, result ${result}`);
    }
  }
}

if (doubleErrors.length === 0) {
  console.log('✓ Double Pana: All numbers follow the formula (sum of digits) % 10 = key');
} else {
  console.log('✗ Double Pana: Found ' + doubleErrors.length + ' errors:');
  doubleErrors.forEach(e => console.log('  ' + e));
}

console.log("\n=== SUMMARY ===");
console.log(`Single Pana: ${Object.values(SINGLE_PANA_BY_RESULT_DIGIT).flat().length} entries`);
console.log(`Double Pana: ${Object.values(DOUBLE_PANA_BY_RESULT_DIGIT).flat().length} entries`);
