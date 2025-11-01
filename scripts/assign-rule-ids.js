#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 讀取所有 group 的 JSONL 檔案
const groups = ['group1', 'group2', 'group3', 'group4', 'group5'];
const draftDir = path.join(__dirname, '../data/draft');

// 收集所有 entries
const allEntries = [];

for (const group of groups) {
  const filePath = path.join(draftDir, `${group}.jsonl`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');

  for (const line of lines) {
    if (line.trim()) {
      const entry = JSON.parse(line);
      allEntries.push(entry);
    }
  }
}

console.log(`總共收集了 ${allEntries.length} 個詞彙`);

// 按 level 分組
const byLevel = {
  hazard: [],
  error: [],
  warning: [],
  info: [],
  depends: []
};

for (const entry of allEntries) {
  if (!byLevel[entry.level]) {
    console.error(`警告: 未知的 level "${entry.level}" for term "${entry.term}"`);
    continue;
  }
  byLevel[entry.level].push(entry);
}

// 顯示統計
console.log('\n按等級統計:');
for (const [level, entries] of Object.entries(byLevel)) {
  console.log(`  ${level}: ${entries.length} 個`);
}

// 分配 Rule ID
const ID_RANGES = {
  hazard: { start: 1, max: 9999 },
  error: { start: 10000, max: 19999 },
  warning: { start: 20000, max: 29999 },
  info: { start: 30000, max: 39999 },
  depends: { start: 40000, max: 49999 }
};

const finalEntries = [];

for (const [level, entries] of Object.entries(byLevel)) {
  const range = ID_RANGES[level];

  entries.forEach((entry, index) => {
    const ruleId = (range.start + index).toString().padStart(5, '0');

    finalEntries.push({
      rule_id: ruleId,
      term: entry.term,
      level: entry.level,
      message: entry.message,
      category: entry.category,
      concepts: entry.concepts,
      taiwan_alternatives: entry.taiwan_alternatives,
      reviewed: true  // Prototyping 階段標記為已審核
    });
  });
}

// 按 rule_id 排序
finalEntries.sort((a, b) => a.rule_id.localeCompare(b.rule_id));

console.log(`\n總共生成了 ${finalEntries.length} 個標記項目`);

// 輸出 JSONL
const annotatedDir = path.join(__dirname, '../data/annotated');
if (!fs.existsSync(annotatedDir)) {
  fs.mkdirSync(annotatedDir, { recursive: true });
}

const jsonlPath = path.join(annotatedDir, 'terms-annotated.jsonl');
const jsonlContent = finalEntries.map(entry => JSON.stringify(entry)).join('\n');
fs.writeFileSync(jsonlPath, jsonlContent, 'utf-8');

console.log(`\n✅ JSONL 已儲存: ${jsonlPath}`);

// 同時輸出為陣列格式的 JSON（方便檢視）
const jsonPath = path.join(annotatedDir, 'terms-annotated.json');
fs.writeFileSync(jsonPath, JSON.stringify(finalEntries, null, 2), 'utf-8');

console.log(`✅ JSON 已儲存: ${jsonPath}`);

// 顯示範例
console.log('\n範例項目（前 3 個）:');
finalEntries.slice(0, 3).forEach(entry => {
  console.log(`  ${entry.rule_id}: ${entry.term} (${entry.level})`);
});
