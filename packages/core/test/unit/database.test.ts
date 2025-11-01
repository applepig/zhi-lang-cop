import { describe, it, expect, beforeAll } from 'vitest';
import { Database } from '../../src/database.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Database', () => {
  let db: Database;

  beforeAll(() => {
    // Use the actual database from project root
    const dbPath = join(__dirname, '../../../../data/terms-db.json');
    db = new Database(dbPath);
  });

  it('should load terms database', () => {
    const stats = db.getStatistics();
    expect(stats.totalRules).toBeGreaterThan(0);
    expect(stats.totalTerms).toBeGreaterThan(0);
  });

  it('should find rules by term', () => {
    const results = db.getRulesByTerm('視頻');
    expect(results).toHaveLength(1);
    expect(results[0].rule.level).toBe('hazard');
  });

  it('should get rule by id', () => {
    const rule = db.getRule('00001');
    expect(rule).toBeDefined();
    expect(rule?.level).toBe('hazard');
  });

  it('should return empty array for unknown term', () => {
    const results = db.getRulesByTerm('不存在的詞');
    expect(results).toHaveLength(0);
  });

  it('should return all terms', () => {
    const terms = db.getAllTerms();
    expect(terms.length).toBeGreaterThan(0);
    expect(terms).toContain('視頻');
    expect(terms).toContain('優化');
  });

  it('should return all rules', () => {
    const rules = db.getAllRules();
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0]).toHaveProperty('ruleId');
    expect(rules[0]).toHaveProperty('rule');
  });

  it('should return statistics', () => {
    const stats = db.getStatistics();
    expect(stats).toHaveProperty('version');
    expect(stats).toHaveProperty('lastUpdated');
    expect(stats).toHaveProperty('totalRules');
    expect(stats).toHaveProperty('totalTerms');
    expect(stats).toHaveProperty('byLevel');
    expect(stats).toHaveProperty('byCategory');
  });
});
