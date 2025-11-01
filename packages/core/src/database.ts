import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { TermsDatabase, RuleId, Rule } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class Database {
  private db: TermsDatabase;

  constructor(dbPath?: string) {
    // Default path: ../../../data/terms-db.json (from packages/core/dist/)
    const path = dbPath || join(__dirname, '../../../data/terms-db.json');
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
