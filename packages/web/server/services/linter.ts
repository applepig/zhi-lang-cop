import { Database, Matcher } from 'zhi-lang-cop-core';
import type { Level, LintIssue } from 'zhi-lang-cop-core';

export class LinterService {
  private db: Database;

  constructor() {
    this.db = new Database();
  }

  lint(text: string, minLevel?: Level): LintIssue[] {
    const matcher = new Matcher(this.db, { minLevel });
    return matcher.findMatches(text);
  }

  lookupTerm(term: string) {
    const results = this.db.getRulesByTerm(term);
    return results.map(r => ({
      ruleId: r.ruleId,
      term,
      level: r.rule.level,
      message: r.rule.message,
      category: r.rule.category,
      taiwanAlternatives: r.taiwanAlternatives,
      concepts: r.rule.concepts
    }));
  }

  lookupRule(ruleId: string) {
    return this.db.getRule(ruleId);
  }

  getRules(params?: { level?: Level; category?: string; limit?: number; offset?: number }) {
    const allRules = this.db.getAllRules();

    let filtered = allRules;

    // Filter by level
    if (params?.level) {
      filtered = filtered.filter(r => r.rule.level === params.level);
    }

    // Filter by category
    if (params?.category) {
      filtered = filtered.filter(r => r.rule.category === params.category);
    }

    // Pagination
    const offset = params?.offset || 0;
    const limit = params?.limit || 50;

    return {
      total: filtered.length,
      offset,
      limit,
      rules: filtered.slice(offset, offset + limit)
    };
  }

  getStats() {
    return this.db.getStatistics();
  }
}
