#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 讀取 JSONL
const jsonlPath = path.join(__dirname, '../data/annotated/terms-annotated.jsonl');
const content = fs.readFileSync(jsonlPath, 'utf-8');
const lines = content.trim().split('\n');

const db = {
  version: '0.1.0',
  lastUpdated: new Date().toISOString(),
  rules: {},
  termToRulesMap: {}
};

let totalCount = 0;
let reviewedCount = 0;

for (const line of lines) {
  if (!line.trim()) continue;

  const entry = JSON.parse(line);
  totalCount++;

  // 只處理已審核的項目（prototyping 階段全部標記為 true）
  if (!entry.reviewed) {
    console.log(`⚠️  跳過未審核: ${entry.term}`);
    continue;
  }

  reviewedCount++;

  // 建立 rule
  db.rules[entry.rule_id] = {
    level: entry.level,
    message: entry.message,
    category: entry.category,
    concepts: entry.concepts
  };

  // 建立 term mapping
  if (!db.termToRulesMap[entry.term]) {
    db.termToRulesMap[entry.term] = [];
  }

  db.termToRulesMap[entry.term].push({
    ruleId: entry.rule_id,
    taiwanAlternatives: entry.taiwan_alternatives
  });
}

// 輸出 JSON
const outputPath = path.join(__dirname, '../data/terms-db.json');
fs.writeFileSync(
  outputPath,
  JSON.stringify(db, null, 2),
  'utf-8'
);

console.log('\n✅ 已編譯資料庫:');
console.log(`   總詞彙數: ${totalCount}`);
console.log(`   已審核: ${reviewedCount}`);
console.log(`   規則數: ${Object.keys(db.rules).length}`);
console.log(`   詞彙映射: ${Object.keys(db.termToRulesMap).length}`);
console.log(`\n📁 輸出檔案: ${outputPath}`);

// 統計
const byLevel = {};
const byCategory = {};

for (const rule of Object.values(db.rules)) {
  byLevel[rule.level] = (byLevel[rule.level] || 0) + 1;
  byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
}

console.log('\n按等級統計:');
for (const [level, count] of Object.entries(byLevel)) {
  console.log(`  ${level}: ${count}`);
}

console.log('\n按分類統計:');
for (const [category, count] of Object.entries(byCategory)) {
  console.log(`  ${category}: ${count}`);
}
