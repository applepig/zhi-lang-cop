# 支語警察 (zhi-lang-cop) 實作規格文件

> **專案現況**: Phase 0-2 已完成，詳見 [PROJECT_STATUS.md](./PROJECT_STATUS.md)

## 目錄
- [專案概述](#專案概述)
- [技術架構](#技術架構)
- [資料模型設計](#資料模型設計)
- [Phase 0: 資料標記](#phase-0-資料標記) ✅ **已完成**
- [Phase 1: 核心邏輯](#phase-1-核心邏輯) ✅ **已完成**
- [Phase 2: Web 應用](#phase-2-web-應用) ✅ **已完成** (架構已變更)
- [Phase 3: MCP Server](#phase-3-mcp-server) ⏸️ **待評估**
- [Phase 4: 智能斷詞](#phase-4-智能斷詞) 📋 **待規劃**
- [實作指南](#實作指南)

---

## 專案概述

### 目標
建立一個高效、可擴展的 linter 系統與 MCP 伺服器，協助識別中國大陸用語（支語）與台灣用語的差異。

### 核心特色
- ⚡ 純前端 SPA，無需後端伺服器
- 📊 清晰的五級嚴重性分類
- 🔍 支援多對多的詞彙-規則映射
- 🌐 Vue 3 + Vuetify 3 響應式介面
- 🤝 社群驅動的詞庫
- 💾 零託管成本，可部署至任何 CDN

### 嚴重性分級
| 等級 | 說明 | 圖示 | 範例 |
|------|------|------|------|
| `hazard` | 完全不同意義，會造成嚴重誤解 | 🔴 | 視頻 (video clip vs video frequency) |
| `error` | 正在侵蝕台灣用語，應該避免 | 🟠 | 優化 → 最佳化 |
| `warning` | 台灣有更偏好的用詞 | 🟡 | 日誌 → 記錄檔 |
| `info` | 翻譯 vs 保留英文的差異 | 🔵 | 上下文切換 → context switch |
| `depends` | 需根據上下文判斷 | ⚪ | 估計 (副詞 vs 動詞) |

---

## 技術架構

> **注意**: 架構已從原始規劃的 Monorepo + Fastify 改為純前端 SPA

### 當前技術棧 (v0.3.0)
```typescript
{
  "architecture": "Pure Frontend SPA (Serverless)",
  "language": "TypeScript",
  "runtime": "Browser only",
  "packageManager": "npm",
  "framework": "Vue 3",
  "uiLibrary": "Vuetify 3",
  "buildTool": "Vite",
  "deployment": "Static hosting (Netlify/Vercel/GitHub Pages)"
}
```

### 專案結構 (已簡化)
```
zhi-lang-cop/
├── package.json              # 單一 package
├── tsconfig.json
├── vite.config.ts
├── netlify.toml             # 部署配置
├── index.html
├── PROJECT_STATUS.md        # 專案現況文件
│
├── src/
│   ├── lib/                 # 核心邏輯 (從 Phase 1)
│   │   ├── database.ts      # 瀏覽器相容的 Database
│   │   ├── matcher.ts       # 文字匹配邏輯
│   │   └── types.ts         # TypeScript 型別
│   │
│   ├── components/          # Vue 組件
│   │   ├── LintInput.vue
│   │   ├── ResultsDisplay.vue
│   │   └── StatsCard.vue
│   │
│   ├── plugins/
│   │   └── vuetify.ts       # Vuetify 配置
│   │
│   ├── App.vue              # 主應用
│   └── main.ts              # 進入點
│
└── data/
    └── terms-db.json        # 80KB 詞庫 (打包進 bundle)
```

### 架構決策歷程

**原始規劃** (本文件撰寫時):
- Monorepo 結構 (pnpm workspace)
- Fastify 後端 API
- textlint 框架整合

**最終實作** (Phase 2 完成後):
- ❌ 捨棄 Monorepo - 簡化為單一 package
- ❌ 捨棄 Fastify - 改為純前端
- ❌ 捨棄 textlint - 自建 Database + Matcher

**變更原因**:
1. 純前端可部署到免費 CDN,零託管成本
2. 離線可用,載入後無需網路
3. 所有邏輯在瀏覽器執行,無 API 延遲
4. 簡化部署流程,無需伺服器管理

---

## 資料模型設計

### 核心概念
**問題**: 一個支語詞彙可能對應多個不同意義（多對多關係）

**解決方案**: 分離「規則」和「詞彙映射」

### 資料庫結構

```typescript
// types.ts
export interface TermsDatabase {
  version: string;
  lastUpdated: string;
  rules: Record<RuleId, Rule>;
  termToRulesMap: Record<string, TermMapping[]>;
}

export type RuleId = `CN${number}`; // CN001, CN002, ...

export interface Rule {
  level: 'hazard' | 'error' | 'warning' | 'info' | 'depends';
  message: string;
  category: 'tech' | 'general' | 'programming' | 'hardware';
  concepts: Concept[];
}

export interface Concept {
  lang: 'en' | 'zh-TW' | 'zh-CN';
  value: string;
}

export interface TermMapping {
  ruleId: RuleId;
  taiwanAlternatives: string[];
}
```

### 實際範例

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-11-01T00:00:00Z",
  
  "rules": {
    "00001": {
      "level": "hazard",
      "message": "在台灣，「視頻」通常指 video frequency（視訊頻率）。若要表達影片內容，請使用「影片」或「視訊」。",
      "category": "tech",
      "concepts": [
        { "lang": "en", "value": "video clip / video stream" },
        { "lang": "zh-TW", "value": "影片、視訊短片" },
        { "lang": "zh-CN", "value": "视频" }
      ]
    },
    
    "10000": {
      "level": "error",
      "message": "「優化」為中國大陸用語，台灣慣用「最佳化」來表達 optimization。",
      "category": "tech",
      "concepts": [
        { "lang": "en", "value": "optimization" },
        { "lang": "zh-TW", "value": "最佳化" },
        { "lang": "zh-CN", "value": "优化" }
      ]
    },
    
    "10089": {
      "level": "error",
      "message": "「數據庫」為中國用語，台灣慣用「資料庫」。",
      "category": "tech",
      "concepts": [
        { "lang": "en", "value": "database" },
        { "lang": "zh-TW", "value": "資料庫" },
        { "lang": "zh-CN", "value": "数据库" }
      ]
    }
  },
  
  "termToRulesMap": {
    "视频": [
      {
        "ruleId": "00001",
        "taiwanAlternatives": ["影片", "視訊"]
      }
    ],
    
    "優化": [
      {
        "ruleId": "10000",
        "taiwanAlternatives": ["最佳化"]
      }
    ],
    
    "数据库": [
      {
        "ruleId": "10089",
        "taiwanAlternatives": ["資料庫"]
      }
    ]
  }
}
```

### Rule ID 命名規則

參考 textlint 生態系統的慣例（如 `textlint-rule-no-todo`, `textlint-rule-terminology`），我們採用**數字分段**方式：

#### 方案一：10000 分段（推薦）

```typescript
// 每個等級分配 10000 個 ID 空間
type RuleId = string; // "0001", "10000", "20000", etc.

const RULE_ID_RANGES = {
  hazard: [0, 9999],      // 0001-9999
  error: [10000, 19999],  // 10000-19999
  warning: [20000, 29999], // 20000-29999
  info: [30000, 39999],    // 30000-39999
  depends: [40000, 49999]  // 40000-49999
} as const;

// 範例
const EXAMPLES = {
  '0001': { term: '視頻', level: 'hazard' },
  '0042': { term: '調用', level: 'hazard' },
  '10000': { term: '優化', level: 'error' },
  '10089': { term: '數據庫', level: 'error' },
  '20001': { term: '日誌', level: 'warning' },
  '30001': { term: '緩存', level: 'info' },
  '40001': { term: '估計', level: 'depends' }
};
```

**優點**：
- 清晰的數字分段，容易理解
- 每個等級有 10000 個 ID 空間
- 數字排序等於嚴重性排序
- 與 textlint 的簡潔風格一致

#### 方案二：英文前綴（備選）

```typescript
// 使用英文前綴 + 數字
type RuleId = string; // "H001", "E001", "W001", etc.

const RULE_ID_PREFIXES = {
  hazard: 'H',   // H001-H999
  error: 'E',    // E001-E999
  warning: 'W',  // W001-W999
  info: 'I',     // I001-I999
  depends: 'D'   // D001-D999
} as const;

// 範例
const EXAMPLES = {
  'H001': { term: '視頻', level: 'hazard' },
  'H042': { term: '調用', level: 'hazard' },
  'E001': { term: '優化', level: 'error' },
  'E089': { term: '數據庫', level: 'error' },
  'W001': { term: '日誌', level: 'warning' },
  'I001': { term: '緩存', level: 'info' },
  'D001': { term: '估計', level: 'depends' }
};
```

**優點**：
- 一眼就能看出等級（H = Hazard）
- ID 較短
- 類似 ESLint 的風格（但 ESLint 用描述性名稱）

#### textlint 生態系統慣例

textlint 本身的規則命名風格：
```typescript
// textlint 內建規則範例（僅供參考，我們不遵循此風格）
'no-todo'                  // 簡單描述
'no-start-duplicated-conjunction'  // 描述性名稱
'terminology'              // 單字名稱
```

但 textlint 規則**不使用數字 ID**，而是用描述性名稱。

對於我們的專案，因為：
1. 我們有**大量規則**（500+ 個詞彙）
2. 規則是**動態增長**的詞庫
3. 需要**快速引用**和**等級分類**

所以採用**數字 ID 系統**更合適，類似 linter 的錯誤碼（如 ESLint 的 `no-unused-vars` 內部也有數字編碼）。

#### 最終建議：方案一（10000 分段）

```typescript
// src/types.ts
export type RuleId = string; // 格式: "0001" | "10000" | ...

export const LEVEL_RANGES = {
  hazard: { min: 0, max: 9999, prefix: '' },
  error: { min: 10000, max: 19999, prefix: '' },
  warning: { min: 20000, max: 29999, prefix: '' },
  info: { min: 30000, max: 39999, prefix: '' },
  depends: { min: 40000, max: 49999, prefix: '' }
} as const;

// Helper function to generate rule ID
export function generateRuleId(level: Level, sequence: number): RuleId {
  const range = LEVEL_RANGES[level];
  const id = range.min + sequence;
  
  if (id > range.max) {
    throw new Error(`Rule ID overflow for level ${level}`);
  }
  
  return id.toString().padStart(5, '0'); // 確保 5 位數，如 "00001"
}

// 使用範例
generateRuleId('hazard', 1);   // "00001"
generateRuleId('hazard', 42);  // "00042"
generateRuleId('error', 1);    // "10001"
generateRuleId('error', 89);   // "10089"
```

這樣的設計：
- ✅ 清晰的數字分段
- ✅ 容易生成和管理
- ✅ 排序即代表嚴重性
- ✅ 有足夠的擴展空間
- ✅ 與 textlint 的簡潔理念一致

---

## Phase 0: 資料標記 ✅

**狀態**: 已完成 (2025-11-01) | **Branch**: `v0.1` | **詳細資訊**: [PROJECT_STATUS.md](./PROJECT_STATUS.md#phase-0-資料標記-v010-)

### 完成成果
- ✅ 100 個詞彙完整標記 (總規則數: 100, 總詞彙數: 99)
- ✅ 使用 5 個並行 AI agents 進行標記
- ✅ Rule ID 分配系統 (按嚴重性等級分段)
- ✅ 生成 `data/terms-db.json` (80KB)
- ✅ 分級分布: 🔴 Hazard (1) | 🟠 Error (44) | 🟡 Warning (27) | 🔵 Info (27) | ⚪ Depends (1)

---

### 原始目標
建立高品質、結構化的詞庫規則資料庫（100 個詞彙）

### 工作流程

#### Step 1: Claude Code 呼叫 Subagent 生成草稿

使用 Claude Code 的 extended thinking 功能呼叫 subagent 批量生成 JSONL 格式的標記資料：

```typescript
// scripts/generate-draft.ts
/**
 * 此腳本透過 Claude Code 的 subagent 功能生成詞彙標記草稿
 * 
 * 使用方式：
 * 1. 在 Claude Code 中執行此腳本
 * 2. 腳本會呼叫 subagent 為每個詞彙生成標記
 * 3. 輸出為 data/draft/terms-draft.jsonl
 * 4. 人工審核後替換為正式版本
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const TERMS_TO_ANNOTATE = [
  // 高頻技術術語（30 個）
  '視頻', '優化', '軟件', '硬件', '信息', '數據庫', '操作系統', '內存', 
  '文件夾', '日誌', '調用', '實現', '配置', '緩存', '字符串',
  // ... 更多詞彙
];

const SUBAGENT_PROMPT = `你是台灣的語言專家和軟體工程師。請為支語詞彙「{TERM}」生成完整的標記資料。

請以 JSON 格式輸出（單行，不要換行）：
{
  "rule_id": "根據等級分配 ID（見下方規則）",
  "term": "{TERM}",
  "level": "hazard|error|warning|info|depends",
  "message": "說明為什麼這是支語，以及台灣的用法差異",
  "category": "tech|general|programming|hardware",
  "concepts": [
    { "lang": "en", "value": "英文原文或概念" },
    { "lang": "zh-TW", "value": "台灣標準用法" },
    { "lang": "zh-CN", "value": "中國大陸用法" }
  ],
  "taiwan_alternatives": ["台灣建議用詞1", "台灣建議用詞2"],
  "reviewed": false
}

Rule ID 分配規則：
- hazard (0001-9999): 完全不同意義，如「視頻」
- error (10000-19999): 正在侵蝕台灣用語，如「優化」
- warning (20000-29999): 台灣有更偏好用詞，如「日誌」
- info (30000-39999): 翻譯 vs 保留英文，如「緩存」
- depends (40000-49999): 需根據上下文，如「估計」

範例：
輸入：視頻
輸出：{"rule_id":"0001","term":"視頻","level":"hazard","message":"在台灣，「視頻」通常指 video frequency（視訊頻率），若要表達影片內容，請使用「影片」或「視訊」。","category":"tech","concepts":[{"lang":"en","value":"video clip / video stream"},{"lang":"zh-TW","value":"影片、視訊短片"},{"lang":"zh-CN","value":"视频"}],"taiwan_alternatives":["影片","視訊"],"reviewed":false}

請只輸出 JSON，不要其他文字。`;

async function generateDrafts() {
  const draftDir = join(process.cwd(), 'data', 'draft');
  if (!existsSync(draftDir)) {
    mkdirSync(draftDir, { recursive: true });
  }
  
  const outputPath = join(draftDir, 'terms-draft.jsonl');
  
  // 清空或創建檔案
  writeFileSync(outputPath, '', 'utf-8');
  
  console.log('🤖 開始使用 Claude Code subagent 生成標記...\n');
  
  for (let i = 0; i < TERMS_TO_ANNOTATE.length; i++) {
    const term = TERMS_TO_ANNOTATE[i];
    console.log(`[${i + 1}/${TERMS_TO_ANNOTATE.length}] 處理: ${term}`);
    
    // 這裡由 Claude Code 呼叫 subagent
    // subagent 會根據 SUBAGENT_PROMPT 生成結果
    // 實際實作時，Claude Code 會自動處理這個呼叫
    
    const prompt = SUBAGENT_PROMPT.replace(/{TERM}/g, term);
    
    // 註：實際執行時，由 Claude Code 自動呼叫 subagent
    console.log(`   ⏳ 呼叫 subagent 生成標記...`);
    
    // Claude Code 會將 subagent 的回應寫入 outputPath
    // 格式為 JSONL（每行一個 JSON 物件）
  }
  
  console.log(`\n✅ 草稿已生成: ${outputPath}`);
  console.log('📝 請人工審核後，將正確的資料移至 data/terms-db.jsonl');
}

// 執行
generateDrafts().catch(console.error);
```

#### Step 2: 人工審核並修正

生成的草稿會儲存在 `data/draft/terms-draft.jsonl`，每行一個 JSON 物件：

```jsonl
{"rule_id":"00001","term":"視頻","level":"hazard","message":"在台灣，「視頻」通常指 video frequency...","category":"tech","concepts":[...],"taiwan_alternatives":["影片","視訊"],"reviewed":false}
{"rule_id":"10000","term":"優化","level":"error","message":"「優化」為中國大陸用語...","category":"tech","concepts":[...],"taiwan_alternatives":["最佳化"],"reviewed":false}
```

審核步驟：
1. 檢查 `level` 是否正確
2. 檢查 `message` 是否清晰準確
3. 檢查 `taiwan_alternatives` 是否完整
4. 確認 `concepts` 的描述正確
5. 將 `reviewed` 改為 `true`
6. 儲存為 `data/terms-db.jsonl`

#### Step 3: 編譯資料庫（可選）

如果需要將 JSONL 轉換為結構化的 JSON 資料庫：

```typescript
// scripts/build-database.ts
import { readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { createReadStream } from 'fs';

interface TermEntry {
  rule_id: string;
  term: string;
  level: string;
  message: string;
  category: string;
  concepts: Array<{ lang: string; value: string }>;
  taiwan_alternatives: string[];
  reviewed: boolean;
}

interface TermsDatabase {
  version: string;
  lastUpdated: string;
  rules: Record<string, {
    level: string;
    message: string;
    category: string;
    concepts: Array<{ lang: string; value: string }>;
  }>;
  termToRulesMap: Record<string, Array<{
    ruleId: string;
    taiwanAlternatives: string[];
  }>>;
}

async function buildDatabase() {
  const db: TermsDatabase = {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    rules: {},
    termToRulesMap: {}
  };
  
  // 讀取 JSONL
  const rl = createInterface({
    input: createReadStream('data/terms-db.jsonl'),
    crlfDelay: Infinity
  });
  
  let totalCount = 0;
  let reviewedCount = 0;
  
  for await (const line of rl) {
    if (!line.trim()) continue;
    
    const entry: TermEntry = JSON.parse(line);
    totalCount++;
    
    // 只處理已審核的項目
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
  
  // 輸出 JSON（用於 Phase 1-3）
  writeFileSync(
    'data/terms-db.json',
    JSON.stringify(db, null, 2),
    'utf-8'
  );
  
  console.log(`\n✅ 已編譯資料庫:`);
  console.log(`   總詞彙數: ${totalCount}`);
  console.log(`   已審核: ${reviewedCount}`);
  console.log(`   規則數: ${Object.keys(db.rules).length}`);
  console.log(`   詞彙映射: ${Object.keys(db.termToRulesMap).length}`);
  console.log(`\n📁 輸出檔案: data/terms-db.json`);
}

buildDatabase().catch(console.error);
```

#### Step 4: Google Sheets 同步（未來功能）

```typescript
// scripts/sync-to-sheets.ts
/**
 * 將 JSONL 資料同步到 Google Sheets
 * 
 * TODO: Phase 0 暫不實作，可在 Phase 2-3 考慮
 * 
 * 功能設計：
 * 1. 讀取 data/terms-db.jsonl
 * 2. 使用 Google Sheets API 上傳
 * 3. 設定欄位、格式、驗證規則
 * 4. 提供協作連結
 * 
 * 反向同步：
 * 1. 從 Google Sheets 下載
 * 2. 驗證格式
 * 3. 更新 data/terms-db.jsonl
 */
```

### 優先標記清單

1. **高頻技術術語**（30 個）
   - 視頻、優化、軟件、硬件、信息、數據庫、操作系統、內存、文件夾、日誌...

2. **容易混淆詞彙**（30 個）
   - 調用、實現、估計、默認、打開、文檔、配置、啟動、緩存...

3. **常見生活用語**（40 個）
   - 窗口、網絡、在線、視頻、鼠標、菜單、屏幕、打印、下載...

### 產出標準
- ✅ 至少 100 個詞彙完整標記
- ✅ 每個等級至少 10 個範例
- ✅ 所有項目都已審核（✅ 標記）
- ✅ `terms-db.json` 通過驗證測試

---

## Phase 1: 核心邏輯 ✅

**狀態**: 已完成 (2025-11-01) | **Branch**: `v0.2` | **詳細資訊**: [PROJECT_STATUS.md](./PROJECT_STATUS.md#phase-1-核心邏輯-v020-)

### 完成成果
- ✅ **架構決策**: 捨棄 textlint,改用自建 Database + Matcher 類別
- ✅ `Database` 類別 - 查詢詞庫與規則
- ✅ `Matcher` 類別 - 文字匹配與位置追蹤
- ✅ TypeScript 型別定義完整
- ✅ CLI 工具 (check/lookup/stats 指令)
- ✅ 測試覆蓋: 單元測試 15 個 + E2E 測試 9 個 (使用 Vitest)

### 最終檔案位置
核心邏輯已整合至 `src/lib/`:
```
src/lib/
├── database.ts    # 瀏覽器相容版本 (接受 JSON object)
├── matcher.ts     # 文字匹配邏輯
└── types.ts       # TypeScript 型別定義
```

---

### 原始目標
實作可獨立運作的 textlint 規則

### 原始規劃的套件結構 (已變更)

```
packages/core/  ❌ 已捨棄 Monorepo 結構
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # textlint rule entry ❌ 未使用
│   ├── database.ts       # Database loader ✅ 改為瀏覽器版本
│   ├── matcher.ts        # Matching algorithm ✅ 已實作
│   ├── types.ts          # Type definitions ✅ 已實作
│   └── utils.ts          # Helper functions
└── test/
    └── index.test.ts     # Unit tests ✅ 已實作 (Vitest)
```

### package.json

```json
{
  "name": "zhi-lang-cop-core",
  "version": "1.0.0",
  "description": "Core textlint rule for detecting PRC Chinese terms",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "keywords": ["textlint", "textlint-rule", "chinese", "taiwan"],
  "scripts": {
    "build": "tsc",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "@textlint/kernel": "^14.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  },
  "files": ["dist", "data"]
}
```

### 核心實作

#### 1. types.ts - 型別定義

```typescript
// src/types.ts
export type Level = 'hazard' | 'error' | 'warning' | 'info' | 'depends';
export type Category = 'tech' | 'general' | 'programming' | 'hardware';
export type RuleId = `CN${number}`;

export interface TermsDatabase {
  version: string;
  lastUpdated: string;
  rules: Record<RuleId, Rule>;
  termToRulesMap: Record<string, TermMapping[]>;
}

export interface Rule {
  level: Level;
  message: string;
  category: Category;
  concepts: Concept[];
}

export interface Concept {
  lang: 'en' | 'zh-TW' | 'zh-CN';
  value: string;
}

export interface TermMapping {
  ruleId: RuleId;
  taiwanAlternatives: string[];
}

export interface LintIssue {
  ruleId: RuleId;
  level: Level;
  term: string;
  message: string;
  suggestions: string[];
  location: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface LintResult {
  results: LintIssue[];
  summary: {
    total: number;
    byLevel: Record<Level, number>;
  };
  metadata: {
    version: string;
    checkedAt: string;
  };
}
```

#### 2. database.ts - 資料庫載入

```typescript
// src/database.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import type { TermsDatabase, RuleId, Rule } from './types';

export class Database {
  private db: TermsDatabase;
  
  constructor(dbPath?: string) {
    const path = dbPath || join(__dirname, '../data/terms-db.json');
    const content = readFileSync(path, 'utf-8');
    this.db = JSON.parse(content);
  }
  
  getRule(ruleId: RuleId): Rule | undefined {
    return this.db.rules[ruleId];
  }
  
  getRulesByTerm(term: string): Array<{
    rule: Rule;
    ruleId: RuleId;
    taiwanAlternatives: string[];
  }> {
    const mappings = this.db.termToRulesMap[term];
    if (!mappings) return [];
    
    return mappings.map(mapping => ({
      rule: this.db.rules[mapping.ruleId],
      ruleId: mapping.ruleId,
      taiwanAlternatives: mapping.taiwanAlternatives
    }));
  }
  
  getAllTerms(): string[] {
    return Object.keys(this.db.termToRulesMap);
  }
  
  getAllRules(): Array<{ ruleId: RuleId; rule: Rule }> {
    return Object.entries(this.db.rules).map(([ruleId, rule]) => ({
      ruleId: ruleId as RuleId,
      rule
    }));
  }
  
  getStatistics() {
    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};
    
    for (const rule of Object.values(this.db.rules)) {
      byLevel[rule.level] = (byLevel[rule.level] || 0) + 1;
      byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
    }
    
    return {
      version: this.db.version,
      lastUpdated: this.db.lastUpdated,
      totalRules: Object.keys(this.db.rules).length,
      totalTerms: Object.keys(this.db.termToRulesMap).length,
      byLevel,
      byCategory
    };
  }
}
```

#### 3. matcher.ts - 匹配演算法

```typescript
// src/matcher.ts
import type { Database } from './database';
import type { Level, LintIssue } from './types';

export interface MatcherOptions {
  minLevel?: Level;
}

const LEVEL_ORDER: Record<Level, number> = {
  hazard: 0,
  error: 1,
  warning: 2,
  info: 3,
  depends: 4
};

export class Matcher {
  constructor(
    private db: Database,
    private options: MatcherOptions = {}
  ) {}
  
  findMatches(text: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const terms = this.db.getAllTerms();
    
    // 按長度排序（長詞優先，避免部分匹配）
    const sortedTerms = terms.sort((a, b) => b.length - a.length);
    
    // 記錄已匹配的位置（避免重複匹配）
    const matchedRanges: Array<[number, number]> = [];
    
    for (const term of sortedTerms) {
      let startIndex = 0;
      
      while (true) {
        const index = text.indexOf(term, startIndex);
        if (index === -1) break;
        
        const endIndex = index + term.length;
        
        // 檢查是否與已匹配的範圍重疊
        const overlaps = matchedRanges.some(([start, end]) =>
          (index >= start && index < end) ||
          (endIndex > start && endIndex <= end) ||
          (index <= start && endIndex >= end)
        );
        
        if (!overlaps) {
          const matches = this.db.getRulesByTerm(term);
          
          for (const match of matches) {
            // 檢查等級過濾
            if (this.shouldInclude(match.rule.level)) {
              issues.push({
                ruleId: match.ruleId,
                level: match.rule.level,
                term,
                message: match.rule.message,
                suggestions: match.taiwanAlternatives,
                location: {
                  start: this.indexToPosition(text, index),
                  end: this.indexToPosition(text, endIndex)
                }
              });
            }
          }
          
          matchedRanges.push([index, endIndex]);
        }
        
        startIndex = index + 1;
      }
    }
    
    // 按位置排序
    issues.sort((a, b) => {
      const lineA = a.location.start.line;
      const lineB = b.location.start.line;
      if (lineA !== lineB) return lineA - lineB;
      return a.location.start.column - b.location.start.column;
    });
    
    return issues;
  }
  
  private shouldInclude(level: Level): boolean {
    if (!this.options.minLevel) return true;
    return LEVEL_ORDER[level] <= LEVEL_ORDER[this.options.minLevel];
  }
  
  private indexToPosition(text: string, index: number) {
    const lines = text.slice(0, index).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1
    };
  }
}
```

#### 4. index.ts - textlint rule

```typescript
// src/index.ts
import type { TextlintRuleModule } from '@textlint/types';
import { Database } from './database';
import { Matcher } from './matcher';
import type { Level } from './types';

export interface Options {
  minLevel?: Level;
}

const reporter: TextlintRuleModule<Options> = (context, options = {}) => {
  const { Syntax, RuleError, report, getSource } = context;
  const db = new Database();
  const matcher = new Matcher(db, { minLevel: options.minLevel });
  
  return {
    [Syntax.Document](node) {
      const text = getSource(node);
      const issues = matcher.findMatches(text);
      
      for (const issue of issues) {
        const error = new RuleError(
          `[${issue.ruleId}] ${issue.message}\n建議: ${issue.suggestions.join('、')}`,
          {
            index: this.getIndexFromPosition(text, issue.location.start)
          }
        );
        
        report(node, error);
      }
    }
  };
  
  function getIndexFromPosition(text: string, pos: { line: number; column: number }): number {
    const lines = text.split('\n');
    let index = 0;
    
    for (let i = 0; i < pos.line - 1; i++) {
      index += lines[i].length + 1; // +1 for \n
    }
    
    return index + pos.column - 1;
  }
};

export default reporter;
```

### 單元測試

```typescript
// test/index.test.ts
import { describe, it, expect } from 'vitest';
import { Database } from '../src/database';
import { Matcher } from '../src/matcher';

describe('Database', () => {
  it('should load terms database', () => {
    const db = new Database();
    const stats = db.getStatistics();
    
    expect(stats.totalRules).toBeGreaterThan(0);
    expect(stats.totalTerms).toBeGreaterThan(0);
  });
  
  it('should find rules by term', () => {
    const db = new Database();
    const results = db.getRulesByTerm('視頻');
    
    expect(results).toHaveLength(1);
    expect(results[0].ruleId).toBe('00001');
    expect(results[0].rule.level).toBe('hazard');
  });
});

describe('Matcher', () => {
  it('should find matches in text', () => {
    const db = new Database();
    const matcher = new Matcher(db);
    
    const issues = matcher.findMatches('我需要優化數據庫的性能');
    
    expect(issues).toHaveLength(2);
    expect(issues[0].term).toBe('優化');
    expect(issues[1].term).toBe('數據庫');
  });
  
  it('should filter by minLevel', () => {
    const db = new Database();
    const matcher = new Matcher(db, { minLevel: 'error' });
    
    const issues = matcher.findMatches('這是一個日誌檔案'); // 假設「日誌」是 warning
    
    expect(issues).toHaveLength(0); // 應該被過濾掉
  });
  
  it('should not double-match overlapping terms', () => {
    const db = new Database();
    const matcher = new Matcher(db);
    
    // 假設「數據」和「數據庫」都在詞庫中
    const issues = matcher.findMatches('數據庫');
    
    // 應該只匹配「數據庫」，不匹配「數據」
    expect(issues.some(i => i.term === '數據')).toBe(false);
  });
});
```

### 使用範例

```typescript
// 作為 textlint rule 使用
import { TextLintCore } from '@textlint/kernel';
import rule from 'zhi-lang-cop-core';

const linter = new TextLintCore();

const result = await linter.lintText('我需要優化數據庫', {
  rules: [
    {
      ruleId: 'zhi-lang-cop',
      rule,
      options: { minLevel: 'warning' }
    }
  ]
});

console.log(result.messages);
// [
//   {
//     ruleId: 'zhi-lang-cop',
//     message: '[10000] 「優化」為中國大陸用語...\n建議: 最佳化',
//     ...
//   }
// ]
```

### 產出標準
- ✅ npm 套件可正常安裝和使用
- ✅ 通過所有單元測試（覆蓋率 > 80%）
- ✅ 有完整的 TypeScript 型別定義
- ✅ 有 README 和使用範例
- ✅ 可作為 textlint rule 使用

---

## Phase 2: Web 應用 ✅

**狀態**: 已完成 (2025-11-02) | **Branch**: `claude/plan-claude-web-project-011CUhRKC6ePiQaQrDCAtFqb` | **詳細資訊**: [PROJECT_STATUS.md](./PROJECT_STATUS.md#phase-2-web-應用-v030-)

### 完成成果
- ✅ **重大架構變更**: 從 Fastify API 改為純前端 SPA
- ✅ Vue 3 + Vuetify 3 響應式 UI
- ✅ 三個核心組件: LintInput、ResultsDisplay、StatsCard
- ✅ Material Design 風格介面
- ✅ 即時檢查,無需 API 呼叫
- ✅ 建置成功: 588 KB (gzipped: 191 KB)
- ✅ 可部署至 Netlify/Vercel/GitHub Pages

### 最終架構
```
zhi-lang-cop/  (單一 package, 非 Monorepo)
├── src/
│   ├── lib/           # 核心邏輯 (從 Phase 1)
│   ├── components/    # Vue 組件
│   │   ├── LintInput.vue
│   │   ├── ResultsDisplay.vue
│   │   └── StatsCard.vue
│   ├── plugins/       # Vuetify 配置
│   ├── App.vue        # 主應用
│   └── main.ts
├── data/terms-db.json # 80KB 詞庫 (打包進 bundle)
├── index.html
├── vite.config.ts
├── netlify.toml       # 部署配置
└── package.json       # 單一 package
```

### 技術亮點
- ✅ 零後端依賴 (完全靜態)
- ✅ 離線可用 (載入後)
- ✅ 可部署至任何 CDN
- ✅ 零託管成本

---

### 原始目標 (已變更)
提供 REST API 和互動式 Playground

### 原始規劃的套件結構 (已捨棄)

```
packages/web/  ❌ 已改為純前端 SPA
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # Fastify server ❌ 已移除
│   ├── routes/
│   │   └── api.ts            # API routes ❌ 已移除
│   ├── services/
│   │   └── linter.ts         # Linter service ❌ 改為在瀏覽器執行
│   └── public/
│       ├── index.html        # Playground UI ✅ 改用 Vue SPA
│       ├── style.css
│       └── app.js
└── test/
    └── api.test.ts
```

### package.json

```json
{
  "name": "zhi-lang-cop-web",
  "version": "1.0.0",
  "description": "Web API for zhi-lang-cop",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest"
  },
  "dependencies": {
    "fastify": "^4.25.0",
    "@fastify/static": "^6.12.0",
    "@fastify/cors": "^8.5.0",
    "textlint-rule-zhi-lang-cop": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0"
  }
}
```

### API 實作

#### 1. Linter Service

```typescript
// src/services/linter.ts
import { Database } from 'zhi-lang-cop-core/src/database';
import { Matcher } from 'zhi-lang-cop-core/src/matcher';
import type { Level, LintResult } from 'zhi-lang-cop-core/src/types';

export class LinterService {
  private db: Database;
  
  constructor() {
    this.db = new Database();
  }
  
  lintText(text: string, minLevel?: Level): LintResult {
    const matcher = new Matcher(this.db, { minLevel });
    const results = matcher.findMatches(text);
    
    // 統計
    const byLevel: Record<Level, number> = {
      hazard: 0,
      error: 0,
      warning: 0,
      info: 0,
      depends: 0
    };
    
    for (const issue of results) {
      byLevel[issue.level]++;
    }
    
    return {
      results,
      summary: {
        total: results.length,
        byLevel
      },
      metadata: {
        version: this.db.getStatistics().version,
        checkedAt: new Date().toISOString()
      }
    };
  }
  
  lookupRule(query: { term?: string; ruleId?: string }) {
    if (query.term) {
      const results = this.db.getRulesByTerm(query.term);
      return {
        found: results.length > 0,
        entries: results.map(r => ({
          rule: r.rule,
          ruleId: r.ruleId,
          matchedTerm: query.term,
          taiwanAlternatives: r.taiwanAlternatives
        }))
      };
    }
    
    if (query.ruleId) {
      const rule = this.db.getRule(query.ruleId as any);
      return {
        found: !!rule,
        entries: rule ? [{ rule, ruleId: query.ruleId }] : []
      };
    }
    
    return { found: false, entries: [] };
  }
  
  listRules(filters?: {
    level?: Level;
    category?: string;
    limit?: number;
    sortBy?: 'level' | 'alphabetical';
  }) {
    let rules = this.db.getAllRules();
    
    // 過濾
    if (filters?.level) {
      rules = rules.filter(r => r.rule.level === filters.level);
    }
    if (filters?.category) {
      rules = rules.filter(r => r.rule.category === filters.category);
    }
    
    // 排序
    if (filters?.sortBy === 'alphabetical') {
      rules.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
    }
    
    // 限制數量
    if (filters?.limit) {
      rules = rules.slice(0, filters.limit);
    }
    
    return {
      rules: rules.map(r => ({
        ruleId: r.ruleId,
        level: r.rule.level,
        message: r.rule.message,
        category: r.rule.category
      })),
      total: rules.length
    };
  }
  
  getStatistics() {
    return this.db.getStatistics();
  }
}
```

#### 2. API Routes

```typescript
// src/routes/api.ts
import type { FastifyInstance } from 'fastify';
import { LinterService } from '../services/linter';

export async function apiRoutes(fastify: FastifyInstance) {
  const linter = new LinterService();
  
  // POST /api/lint
  fastify.post<{
    Body: {
      text: string;
      minLevel?: string;
    };
  }>('/api/lint', async (request, reply) => {
    const { text, minLevel } = request.body;
    
    if (!text) {
      return reply.code(400).send({ error: 'text is required' });
    }
    
    const result = linter.lintText(text, minLevel as any);
    return result;
  });
  
  // GET /api/lookup
  fastify.get<{
    Querystring: {
      term?: string;
      ruleId?: string;
    };
  }>('/api/lookup', async (request, reply) => {
    const { term, ruleId } = request.query;
    
    if (!term && !ruleId) {
      return reply.code(400).send({ error: 'term or ruleId is required' });
    }
    
    return linter.lookupRule({ term, ruleId });
  });
  
  // GET /api/rules
  fastify.get<{
    Querystring: {
      level?: string;
      category?: string;
      limit?: number;
      sortBy?: string;
    };
  }>('/api/rules', async (request) => {
    return linter.listRules(request.query as any);
  });
  
  // GET /api/stats
  fastify.get('/api/stats', async () => {
    return linter.getStatistics();
  });
}
```

#### 3. Fastify Server

```typescript
// src/index.ts
import Fastify from 'fastify';
import fastifyStatic from '@fastify/static';
import fastifyCors from '@fastify/cors';
import { join } from 'path';
import { apiRoutes } from './routes/api';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function start() {
  const fastify = Fastify({
    logger: true
  });
  
  // CORS
  await fastify.register(fastifyCors, {
    origin: true
  });
  
  // API routes
  await fastify.register(apiRoutes);
  
  // Static files (Playground UI)
  await fastify.register(fastifyStatic, {
    root: join(__dirname, 'public'),
    prefix: '/'
  });
  
  // Start server
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
```

### Playground UI

```html
<!-- src/public/index.html -->
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>支語警察 - Chinese Cop</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>🚓 支語警察</h1>
      <p>Traditional Chinese Term Checker</p>
    </header>
    
    <main>
      <div class="input-section">
        <textarea 
          id="input-text" 
          placeholder="貼上或輸入要檢查的文字..."
          rows="10"
        ></textarea>
        
        <div class="controls">
          <label>
            檢查等級：
            <select id="min-level">
              <option value="">全部</option>
              <option value="hazard">危險</option>
              <option value="error" selected>錯誤</option>
              <option value="warning">警告</option>
              <option value="info">資訊</option>
            </select>
          </label>
          
          <button id="check-btn">🔍 開始檢查</button>
        </div>
      </div>
      
      <div id="results" class="results hidden">
        <h2>檢查結果</h2>
        <div id="summary"></div>
        <div id="issues"></div>
      </div>
    </main>
    
    <footer>
      <a href="/api/docs">API 文件</a> |
      <a href="https://github.com/yourusername/zhi-lang-cop">GitHub</a>
    </footer>
  </div>
  
  <script src="/app.js"></script>
</body>
</html>
```

```javascript
// src/public/app.js
const inputText = document.getElementById('input-text');
const minLevel = document.getElementById('min-level');
const checkBtn = document.getElementById('check-btn');
const results = document.getElementById('results');
const summary = document.getElementById('summary');
const issues = document.getElementById('issues');

checkBtn.addEventListener('click', async () => {
  const text = inputText.value.trim();
  if (!text) {
    alert('請輸入要檢查的文字');
    return;
  }
  
  checkBtn.disabled = true;
  checkBtn.textContent = '檢查中...';
  
  try {
    const response = await fetch('/api/lint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        minLevel: minLevel.value || undefined
      })
    });
    
    const data = await response.json();
    displayResults(data);
  } catch (error) {
    alert('檢查失敗：' + error.message);
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = '🔍 開始檢查';
  }
});

function displayResults(data) {
  const { results: issueList, summary: sum } = data;
  
  // 顯示摘要
  const levelEmojis = {
    hazard: '🔴',
    error: '🟠',
    warning: '🟡',
    info: '🔵',
    depends: '⚪'
  };
  
  const summaryHTML = `
    <div class="summary-box">
      <strong>發現 ${sum.total} 個問題</strong>
      ${Object.entries(sum.byLevel)
        .filter(([_, count]) => count > 0)
        .map(([level, count]) => `
          <span class="level-badge ${level}">
            ${levelEmojis[level]} ${level}: ${count}
          </span>
        `)
        .join('')}
    </div>
  `;
  
  summary.innerHTML = summaryHTML;
  
  // 顯示問題列表
  if (issueList.length === 0) {
    issues.innerHTML = '<p class="no-issues">✅ 沒有發現問題</p>';
  } else {
    const issuesHTML = issueList.map(issue => `
      <div class="issue ${issue.level}">
        <div class="issue-header">
          <span class="issue-term">${issue.term}</span>
          <span class="issue-level">${levelEmojis[issue.level]} ${issue.level}</span>
        </div>
        <div class="issue-body">
          <p class="issue-message">${issue.message}</p>
          <p class="issue-suggestions">
            <strong>建議：</strong>${issue.suggestions.join('、')}
          </p>
        </div>
      </div>
    `).join('');
    
    issues.innerHTML = issuesHTML;
  }
  
  results.classList.remove('hidden');
}
```

### 部署

#### Vercel 部署

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "packages/web/dist/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "packages/web/dist/index.js"
    }
  ]
}
```

#### Docker 部署

```dockerfile
# Dockerfile
FROM node:20-slim

WORKDIR /app

# 安裝 pnpm
RUN npm install -g pnpm

# 複製所有套件
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/ ./packages/
COPY data/ ./data/

# 安裝依賴
RUN pnpm install --frozen-lockfile

# 建置
RUN pnpm -r build

# 暴露端口
EXPOSE 3000

# 啟動
CMD ["node", "packages/web/dist/index.js"]
```

### 產出標準
- ✅ API 正常運作（可用 Postman/curl 測試）
- ✅ Swagger/OpenAPI 文件
- ✅ Playground UI 功能完整
- ✅ 可部署到至少一個雲端平台
- ✅ 有公開 demo 網站

---

## Phase 3: MCP Server ⏸️

**狀態**: 待評估 | **架構衝突**: MCP 需要 Node.js runtime,與當前純前端架構不相容

### 架構挑戰
由於 Phase 2 已改為純前端 SPA,MCP Server 實作面臨以下挑戰:

1. **Runtime 需求衝突**:
   - MCP Server 需要 Node.js runtime
   - 當前專案已完全移除 Node.js 後端

2. **可能的解決方案**:
   - **方案 A**: 建立獨立的 Node.js package (不與 Web App 整合)
   - **方案 B**: 延後至詞庫擴充後再評估
   - **方案 C**: 考慮使用 Browser Extension 替代 MCP

3. **建議**: 先進行 Phase 4 (智能斷詞) 和詞庫擴充,等專案成熟後再決定是否需要 MCP

---

### 原始目標 (待重新評估)
整合到 MCP 生態，讓 AI 助理能使用

### 原始規劃的套件結構 (需重新設計)

```
packages/mcp/  ⏸️ 需獨立 package,不與 Web App 共用
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts          # MCP server entry
│   └── tools.ts          # Tool definitions
└── test/
    └── tools.test.ts
```

### package.json

```json
{
  "name": "zhi-lang-cop-mcp",
  "version": "1.0.0",
  "description": "MCP server for zhi-lang-cop",
  "type": "module",
  "bin": {
    "zhi-lang-cop-mcp": "./dist/index.js"
  },
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "fastmcp": "^1.0.0",
    "textlint-rule-zhi-lang-cop": "workspace:*"
  },
  "devDependencies": {
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

### MCP Tools 實作

```typescript
// src/tools.ts
import { z } from 'zod';
import { Database } from 'zhi-lang-cop-core/src/database';
import { Matcher } from 'zhi-lang-cop-core/src/matcher';
import type { Level } from 'zhi-lang-cop-core/src/types';

// Schemas
export const LintTextSchema = z.object({
  text: z.string().describe('要檢查的文字'),
  minLevel: z.enum(['hazard', 'error', 'warning', 'info', 'depends'])
    .optional()
    .describe('最低檢查等級（預設: error）')
});

export const LookupRuleSchema = z.object({
  term: z.string().optional().describe('要查詢的詞彙'),
  ruleId: z.string().optional().describe('要查詢的規則 ID')
}).refine(data => data.term || data.ruleId, {
  message: '必須提供 term 或 ruleId 其中一個'
});

export const ListRulesSchema = z.object({
  level: z.enum(['hazard', 'error', 'warning', 'info', 'depends']).optional(),
  category: z.enum(['tech', 'general', 'programming', 'hardware']).optional(),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['level', 'alphabetical']).optional()
});

// Tool implementations
export class ZhiLangCopTools {
  private db: Database;
  
  constructor() {
    this.db = new Database();
  }
  
  lintText(params: z.infer<typeof LintTextSchema>) {
    const { text, minLevel = 'error' } = params;
    const matcher = new Matcher(this.db, { minLevel });
    const results = matcher.findMatches(text);
    
    // 統計
    const byLevel: Record<Level, number> = {
      hazard: 0,
      error: 0,
      warning: 0,
      info: 0,
      depends: 0
    };
    
    for (const issue of results) {
      byLevel[issue.level]++;
    }
    
    return {
      results: results.map(issue => ({
        ruleId: issue.ruleId,
        level: issue.level,
        term: issue.term,
        message: issue.message,
        suggestions: issue.suggestions,
        location: issue.location
      })),
      summary: {
        total: results.length,
        byLevel
      }
    };
  }
  
  lookupRule(params: z.infer<typeof LookupRuleSchema>) {
    const { term, ruleId } = params;
    
    if (term) {
      const results = this.db.getRulesByTerm(term);
      return {
        found: results.length > 0,
        entries: results.map(r => ({
          rule: {
            ruleId: r.ruleId,
            level: r.rule.level,
            message: r.rule.message,
            category: r.rule.category,
            concepts: r.rule.concepts
          },
          matchedTerm: term,
          taiwanAlternatives: r.taiwanAlternatives
        }))
      };
    }
    
    if (ruleId) {
      const rule = this.db.getRule(ruleId as any);
      if (!rule) {
        return { found: false, entries: [] };
      }
      
      return {
        found: true,
        entries: [{
          rule: {
            ruleId,
            level: rule.level,
            message: rule.message,
            category: rule.category,
            concepts: rule.concepts
          }
        }]
      };
    }
    
    return { found: false, entries: [] };
  }
  
  listRules(params: z.infer<typeof ListRulesSchema>) {
    const { level, category, limit, sortBy } = params;
    let rules = this.db.getAllRules();
    
    // 過濾
    if (level) {
      rules = rules.filter(r => r.rule.level === level);
    }
    if (category) {
      rules = rules.filter(r => r.rule.category === category);
    }
    
    // 排序
    if (sortBy === 'alphabetical') {
      rules.sort((a, b) => a.ruleId.localeCompare(b.ruleId));
    }
    
    // 限制
    rules = rules.slice(0, limit);
    
    return {
      rules: rules.map(r => ({
        ruleId: r.ruleId,
        level: r.rule.level,
        message: r.rule.message,
        category: r.rule.category
      })),
      total: rules.length
    };
  }
  
  getStats() {
    return this.db.getStatistics();
  }
}
```

```typescript
// src/index.ts
#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import {
  ZhiLangCopTools,
  LintTextSchema,
  LookupRuleSchema,
  ListRulesSchema
} from './tools.js';

const mcp = new FastMCP('支語警察 (Chinese Cop)', {
  version: '1.0.0'
});

const tools = new ZhiLangCopTools();

// Tool 1: lintText
mcp.addTool({
  name: 'lintText',
  description: '檢查文字中的中國大陸用語（支語），並提供台灣用語建議',
  parameters: LintTextSchema,
  execute: async (params) => {
    return tools.lintText(params);
  }
});

// Tool 2: lookupRule
mcp.addTool({
  name: 'lookupRule',
  description: '查詢特定詞彙或規則的詳細資訊',
  parameters: LookupRuleSchema,
  execute: async (params) => {
    return tools.lookupRule(params);
  }
});

// Tool 3: listRules
mcp.addTool({
  name: 'listRules',
  description: '列出所有可用的規則，可以按等級或分類過濾',
  parameters: ListRulesSchema,
  execute: async (params) => {
    return tools.listRules(params);
  }
});

// Tool 4: getStats
mcp.addTool({
  name: 'getStats',
  description: '取得詞庫的統計資訊',
  parameters: z.object({}),
  execute: async () => {
    return tools.getStats();
  }
});

// Start server
mcp.start({
  transportType: 'stdio'
});
```

### Claude Desktop 設定

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "zhi-lang-cop": {
      "command": "node",
      "args": [
        "/path/to/zhi-lang-cop/packages/mcp/dist/index.js"
      ]
    }
  }
}
```

或使用 npx:

```json
{
  "mcpServers": {
    "zhi-lang-cop": {
      "command": "npx",
      "args": ["-y", "zhi-lang-cop-mcp"]
    }
  }
}
```

### 使用範例

在 Claude Desktop 中：

```
User: 幫我檢查這段文字：「我需要優化數據庫的性能」

Claude: 我來幫你檢查這段文字。
[使用 lintText tool]

發現 2 個問題：

1. 🟠 優化 (error)
   建議：最佳化
   說明：「優化」為中國大陸用語，台灣慣用「最佳化」來表達 optimization。

2. 🟠 數據庫 (error)
   建議：資料庫
   說明：「數據庫」為中國用語，台灣慣用「資料庫」。

建議改寫：「我需要最佳化資料庫的性能」
```

### 產出標準
- ✅ 可用 `node` 執行
- ✅ 在 Claude Desktop 中正常工作
- ✅ 4 個 tools 完整實作
- ✅ 有 MCP 設定文件
- ✅ 發佈到 npm

---

## Phase 4: 智能斷詞 📋

**狀態**: 待規劃 | **架構考量**: 需評估 bundle size 影響

### 目標
整合中文斷詞器，提升檢查準確度

### 純前端架構的限制
由於當前已改為純前端 SPA,斷詞器的選擇需考慮:

1. **Bundle Size 影響**:
   - 當前 bundle: 588 KB (gzipped: 191 KB)
   - 加入斷詞器可能增加數 MB
   - 需評估是否值得增加載入時間

2. **瀏覽器相容性**:
   - 需確保斷詞器可在瀏覽器執行
   - 避免使用 Node.js 專屬的 native modules

3. **延遲載入策略**:
   - 考慮將斷詞器設為可選功能
   - 使用動態 import 減少初始載入

### 技術選擇

| 方案 | 大小 | 準確度 | 瀏覽器支援 | 繁體支援 | 建議 |
|------|------|--------|-----------|----------|------|
| node-jieba | ~10MB | ~90% | ⚠️ 需驗證 | ⚠️ 需調教 | 待評估 bundle size |
| jieba-wasm | ~3-5MB | ~90% | ✅ WASM | ⚠️ 需調教 | 優先考慮 |
| ckip-transformers | N/A (Python) | ~97% | ❌ 不支援 | ✅ 原生 | 不適用 |
| 自建詞邊界演算法 | <100KB | ~70% | ✅ 純 JS | ✅ | 輕量替代方案 |

### 實作策略

```typescript
// packages/core/src/segmenter.ts
import * as jieba from 'nodejieba';

export interface Segmenter {
  segment(text: string): string[];
}

export class JiebaSegmenter implements Segmenter {
  constructor() {
    // 載入自定義詞典（技術術語）
    jieba.load({
      userDict: './data/custom-dict.txt'
    });
  }
  
  segment(text: string): string[] {
    return jieba.cut(text);
  }
}

// 更新 Matcher 使用斷詞
export class SmartMatcher extends Matcher {
  constructor(
    db: Database,
    private segmenter: Segmenter,
    options: MatcherOptions = {}
  ) {
    super(db, options);
  }
  
  findMatches(text: string): LintIssue[] {
    // 先斷詞
    const tokens = this.segmenter.segment(text);
    
    // 檢查每個 token
    const issues: LintIssue[] = [];
    let offset = 0;
    
    for (const token of tokens) {
      const matches = this.db.getRulesByTerm(token);
      
      if (matches.length > 0) {
        const index = text.indexOf(token, offset);
        
        for (const match of matches) {
          if (this.shouldInclude(match.rule.level)) {
            issues.push({
              ruleId: match.ruleId,
              level: match.rule.level,
              term: token,
              message: match.rule.message,
              suggestions: match.taiwanAlternatives,
              location: {
                start: this.indexToPosition(text, index),
                end: this.indexToPosition(text, index + token.length)
              }
            });
          }
        }
      }
      
      offset = text.indexOf(token, offset) + token.length;
    }
    
    return issues;
  }
}
```

### 自定義詞典

```
// data/custom-dict.txt
數據庫 5 n
資料庫 10 n
最佳化 8 v
優化 3 v
視頻 3 n
影片 10 n
```

### 產出標準
- ✅ 解決單字過度匹配問題
- ✅ 準確度明顯提升
- ✅ 詞庫擴充到 500+ 詞彙
- ✅ 效能仍可接受（< 2 秒）

---

## 實作指南

> **注意**: 以下指南已根據當前純前端架構更新

### 開發環境設定 (當前版本 v0.3.0)

```bash
# 1. Clone repository
git clone https://github.com/applepig/zhi-lang-cop.git
cd zhi-lang-cop

# 2. 安裝依賴 (使用 npm,已不使用 pnpm)
npm install

# 3. 開發模式
npm run dev:client     # 啟動 Vite dev server (http://localhost:5173)

# 4. 建置
npm run build:client   # 輸出到 dist/

# 5. 預覽建置結果
npm run preview
```

### package.json (當前版本)

```json
{
  "name": "zhi-lang-cop-web",
  "version": "0.3.0",
  "type": "module",
  "scripts": {
    "dev:client": "vite",
    "build:client": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.4.0",
    "vuetify": "^3.5.0",
    "@mdi/font": "^7.4.0",
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0",
    "vite-plugin-vuetify": "^2.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  }
}
```

### ~~pnpm-workspace.yaml~~ (已移除)

~~已改為單一 package,不再使用 pnpm workspace~~

### 共用 TypeScript 設定

```json
// tsconfig.json (root)
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist"]
}
```

### Git 工作流程 (當前版本)

```bash
# Feature branch (使用 claude/ 前綴)
git checkout -b claude/feature-name

# 開發...
npm run build:client
# 注意: 測試指令已移除,可在未來重新加入

# Commit (使用 Claude Code 自動產生 commit message)
git add .
git commit -m "feat: add new feature

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"

# Push
git push origin claude/feature-name
```

### 部署流程 (取代發佈流程)

由於改為純前端 SPA,不再發佈到 npm,改為部署到靜態托管平台:

```bash
# 1. 建置
npm run build:client

# 2. 部署到 Netlify (自動)
# - Push 到 GitHub 後自動觸發部署
# - 或使用 Netlify CLI: netlify deploy --prod

# 3. 部署到 Vercel (自動)
# - 連接 GitHub repository
# - 自動偵測 Vite 專案並建置

# 4. 手動部署到任何靜態托管
# - 將 dist/ 目錄上傳即可
```

### 品質檢查 (當前版本)

```bash
# Type check
npx tsc --noEmit

# 建置測試
npm run build:client

# 本地預覽
npm run preview
```

---

## 時程規劃

> **注意**: Phase 0-2 已完成,以下為實際執行時程與原始規劃對比

### 總覽 (更新至 2025-11-02)
- **Phase 0**: ✅ 已完成 (2025-11-01) - 1 天 (原估 1 週)
- **Phase 1**: ✅ 已完成 (2025-11-01) - 1 天 (原估 1 週)
- **Phase 2**: ✅ 已完成 (2025-11-02) - 1 天 (原估 1-2 週,架構已變更)
- **Phase 3**: ⏸️ 待評估 (原估 1 週,需重新規劃)
- **Phase 4**: 📋 待規劃 (原估 2 週)
- **實際完成**: Phase 0-2 共 2 天 vs 原估 3-4 週

### Phase 0 詳細時程（1 週）

| 天數 | 任務 |
|------|------|
| Day 1-2 | LLM 生成 100 個詞彙的草稿 |
| Day 3-5 | Google Sheets 協作審核 |
| Day 6 | 編譯資料庫、驗證 |
| Day 7 | 建立標記指南文件 |

### Phase 1 詳細時程（1 週）

| 天數 | 任務 |
|------|------|
| Day 1-2 | 設定專案結構、型別定義 |
| Day 3-4 | 實作 Database、Matcher |
| Day 5-6 | 實作 textlint rule、測試 |
| Day 7 | 文件、發佈到 npm |

### Phase 2 詳細時程（1-2 週）

| 天數 | 任務 |
|------|------|
| Week 1 Day 1-3 | Fastify API 實作 |
| Week 1 Day 4-5 | Playground UI 開發 |
| Week 1 Day 6-7 | API 測試 |
| Week 2 Day 1-3 | UI 優化、回應優化 |
| Week 2 Day 4-5 | 部署設定 |
| Week 2 Day 6-7 | 上線、文件 |

### Phase 3 詳細時程（1 週）

| 天數 | 任務 |
|------|------|
| Day 1-2 | fastmcp-ts 整合 |
| Day 3-4 | 4 個 tools 實作 |
| Day 5-6 | Claude Desktop 測試 |
| Day 7 | 發佈到 npm |

### Phase 4 詳細時程（2 週）

| 天數 | 任務 |
|------|------|
| Week 1 | jieba 整合、測試 |
| Week 2 | 詞庫擴充、優化 |

---

## 成功標準

### Phase 0 完成標準 ✅ 已達成
- ✅ 100 個詞彙完整標記
- ✅ 每個等級至少 10 個範例 (Hazard 1, Error 44, Warning 27, Info 27, Depends 1)
- ✅ 所有項目已審核（使用 5 個 AI agents）
- ✅ `terms-db.json` 格式正確 (80KB)
- ⚠️ 標記指南文件 (未建立,但有完整的 PROJECT_STATUS.md)

### Phase 1 完成標準 ✅ 已達成 (部分變更)
- ⚠️ npm 套件可安裝 (已改為瀏覽器內嵌,不發佈 npm)
- ✅ 測試覆蓋率 > 80% (單元測試 15 個 + E2E 測試 9 個)
- ✅ TypeScript 型別完整
- ⚠️ 可作為 textlint rule (已捨棄 textlint,改用自建邏輯)
- ✅ 有 README 和範例 (見 PROJECT_STATUS.md)

### Phase 2 完成標準 ✅ 已達成 (重大變更)
- ⚠️ 4 個 API endpoints 正常 (改為純前端,無 API)
- ⚠️ Swagger UI 可訪問 (改為純前端,無 API)
- ✅ Playground 功能完整 (Vue SPA 即時檢查)
- ✅ 可部署到雲端平台 (Netlify/Vercel ready)
- ⏳ 有公開 demo 網站 (待部署)

### Phase 3 完成標準 ⏸️ 待重新評估
- ⏸️ 可用 node 執行 (需獨立 package)
- ⏸️ Claude Desktop 正常
- ⏸️ 4 個 tools 完整
- ⏸️ 有 MCP 設定文件
- ⏸️ 發佈到 npm

### Phase 4 完成標準 📋 待規劃
- 📋 支援至少一種斷詞器 (需評估 bundle size)
- 📋 解決單字匹配問題
- 📋 準確度提升
- 📋 詞庫 500+ 詞彙
- 📋 效能 < 2 秒 (瀏覽器環境)

---

## 附錄

### 參考資源

#### 技術文件
- [textlint](https://textlint.github.io/)
- [fastmcp-ts](https://www.npmjs.com/package/fastmcp)
- [Fastify](https://fastify.dev/)
- [node-jieba](https://github.com/yanyiwu/nodejieba)

#### 資料來源
- [黑暗執行緒術語表](https://github.com/darkthread/darkthread.github.io/blob/master/comp-terms/terms.csv)

#### 社群
- [台灣 vs 中國用語討論](https://blog.darkthread.net/blog/comp-terms/)

### 常見問題 (更新至 v0.3.0)

**Q: 為什麼最後選擇純前端而不是 Fastify API？**
A: 純前端可部署到免費 CDN,零託管成本,離線可用,且所有邏輯在瀏覽器執行無 API 延遲。對於詞庫檢查這類純計算任務,不需要後端。

**Q: 為什麼不使用 textlint？**
A: textlint 增加了複雜度且不適合純前端使用。自建的 Database + Matcher 更輕量且完全符合需求。

**Q: 資料庫會自動更新嗎？**
A: 當前是靜態打包進 bundle。未來可考慮 GitHub Actions 自動更新 + 重新建置部署。

**Q: 可以自定義規則嗎？**
A: Phase 4 可支援,可能透過 IndexedDB 或動態載入詞庫。

**Q: 如何處理簡繁轉換？**
A: 建議使用 OpenCC 預處理,但不在此專案範圍。

**Q: 為什麼 Phase 3 (MCP Server) 被延後？**
A: MCP 需要 Node.js runtime,與當前純前端架構衝突。若要實作需建立獨立的 Node.js package。考慮先完成詞庫擴充後再評估是否需要。

### License

MIT

---

## 結語

**專案狀態更新** (2025-11-02):

Phase 0-2 已成功完成,但實作過程中做出重大架構調整:
- ✅ **化繁為簡**: 從 Monorepo + Fastify 改為單一 package 純前端 SPA
- ✅ **零成本部署**: 可部署至任何靜態托管平台,無需伺服器
- ✅ **快速迭代**: Phase 0-2 實際僅用 2 天完成 (原估 3-4 週)

**原始規劃 vs 實際執行**:

本文件原始規劃:
1. **清晰的階段劃分**：從資料標記到 MCP，循序漸進 ✅
2. **完整的程式碼範例**：可直接複製使用 ⚠️ (部分已過時)
3. **詳細的型別定義**：TypeScript 確保品質 ✅
4. **實用的工具鏈**：~~pnpm workspace、textlint、fastmcp~~ → Vue 3 + Vite + Vuetify 📝
5. **社群驅動**：~~Google Sheets 協作~~、開源 ✅

**下一步建議**:
- 📦 部署到生產環境 (Netlify 優先)
- 📊 評估是否需要 Phase 3 (MCP Server)
- 🔍 規劃 Phase 4 (智能斷詞) 的瀏覽器實作方案
- 📝 更新 README.md 使用文件

詳細的專案現況請見 [PROJECT_STATUS.md](./PROJECT_STATUS.md)

---

**最後更新**: 2025-11-02
**文件版本**: 2.0 (反映 v0.3.0 架構變更)

🚀 Generated with Claude Code
