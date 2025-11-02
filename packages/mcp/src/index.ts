#!/usr/bin/env node
import { FastMCP } from 'fastmcp';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Database } from '../../core/src/lib/database.js';
import { Matcher } from '../../core/src/lib/matcher.js';
import type { Level, TermsDatabase } from '../../core/src/lib/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load terms database
const dbPath = join(__dirname, '../../../data/terms-db.json');
const termsDb: TermsDatabase = JSON.parse(readFileSync(dbPath, 'utf-8'));
const db = new Database(termsDb);

// Create FastMCP instance
const mcp = new FastMCP({
  name: '支語警察 (Zhi Lang Cop)',
  version: '0.3.0'
});

// Tool 1: lintText - 檢查文字中的中國大陸用語
mcp.addTool({
  name: 'lintText',
  description: '檢查文字中的中國大陸用語（支語），並提供台灣用語建議',
  parameters: z.object({
    text: z.string().describe('要檢查的文字'),
    minLevel: z.enum(['hazard', 'error', 'warning', 'info', 'depends'])
      .optional()
      .default('error')
      .describe('最低檢查等級（預設: error）')
  }),
  execute: async ({ text, minLevel }) => {
    const matcher = new Matcher(db, { minLevel: minLevel as Level });
    const issues = matcher.findMatches(text);

    const byLevel: Record<string, number> = {};
    for (const issue of issues) {
      byLevel[issue.level] = (byLevel[issue.level] || 0) + 1;
    }

    const result = {
      success: true,
      summary: {
        total: issues.length,
        byLevel
      },
      issues: issues.map(issue => ({
        ruleId: issue.ruleId,
        level: issue.level,
        term: issue.term,
        message: issue.message,
        suggestions: issue.suggestions,
        location: issue.location
      }))
    };

    return JSON.stringify(result, null, 2);
  }
});

// Tool 2: lookupRule - 查詢特定詞彙或規則
mcp.addTool({
  name: 'lookupRule',
  description: '查詢特定詞彙或規則的詳細資訊',
  parameters: z.object({
    term: z.string().optional().describe('要查詢的詞彙'),
    ruleId: z.string().optional().describe('要查詢的規則 ID')
  }).refine(data => data.term || data.ruleId, {
    message: '必須提供 term 或 ruleId 其中一個'
  }),
  execute: async ({ term, ruleId }) => {
    let result: any;

    if (term) {
      const results = db.getRulesByTerm(term);
      result = {
        success: true,
        found: results.length > 0,
        entries: results.map(r => ({
          ruleId: r.ruleId,
          level: r.rule.level,
          message: r.rule.message,
          category: r.rule.category,
          concepts: r.rule.concepts,
          taiwanAlternatives: r.taiwanAlternatives
        }))
      };
    } else if (ruleId) {
      const rule = db.getRule(ruleId as any);
      if (!rule) {
        result = { success: true, found: false, entries: [] };
      } else {
        result = {
          success: true,
          found: true,
          entries: [{
            ruleId,
            level: rule.level,
            message: rule.message,
            category: rule.category,
            concepts: rule.concepts
          }]
        };
      }
    } else {
      result = { success: false, found: false, entries: [] };
    }

    return JSON.stringify(result, null, 2);
  }
});

// Tool 3: listRules - 列出所有規則
mcp.addTool({
  name: 'listRules',
  description: '列出所有可用的規則，可以按等級或分類過濾',
  parameters: z.object({
    level: z.enum(['hazard', 'error', 'warning', 'info', 'depends']).optional().describe('按等級過濾'),
    category: z.enum(['tech', 'general', 'programming', 'hardware']).optional().describe('按分類過濾'),
    limit: z.number().min(1).max(100).default(20).describe('限制返回數量')
  }),
  execute: async ({ level, category, limit }) => {
    let rules = db.getAllRules();

    // 過濾
    if (level) {
      rules = rules.filter(r => r.rule.level === level);
    }
    if (category) {
      rules = rules.filter(r => r.rule.category === category);
    }

    // 限制數量
    rules = rules.slice(0, limit);

    const result = {
      success: true,
      total: rules.length,
      rules: rules.map(r => ({
        ruleId: r.ruleId,
        level: r.rule.level,
        message: r.rule.message,
        category: r.rule.category
      }))
    };

    return JSON.stringify(result, null, 2);
  }
});

// Tool 4: getStats - 取得詞庫統計資訊
mcp.addTool({
  name: 'getStats',
  description: '取得詞庫的統計資訊',
  parameters: z.object({}),
  execute: async () => {
    const stats = db.getStatistics();
    const result = {
      success: true,
      ...stats
    };
    return JSON.stringify(result, null, 2);
  }
});

// Start server
mcp.start();
