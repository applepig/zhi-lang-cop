import { describe, it, expect, beforeAll } from 'vitest';
import { Database } from '../../src/database.js';
import { Matcher } from '../../src/matcher.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Matcher', () => {
  let db: Database;

  beforeAll(() => {
    const dbPath = join(__dirname, '../../../../data/terms-db.json');
    db = new Database(dbPath);
  });

  it('should find matches in text', () => {
    const matcher = new Matcher(db);
    const issues = matcher.findMatches('我需要優化數據庫的性能');

    expect(issues.length).toBeGreaterThanOrEqual(2);
    expect(issues.some(i => i.term === '優化')).toBe(true);
    expect(issues.some(i => i.term === '數據庫')).toBe(true);
  });

  it('should filter by minLevel', () => {
    const matcher = new Matcher(db, { minLevel: 'hazard' });
    // 優化和數據庫都是 error level，應該被過濾掉
    const issues = matcher.findMatches('優化數據庫');

    expect(issues).toHaveLength(0);
  });

  it('should include hazard level when minLevel is error', () => {
    const matcher = new Matcher(db, { minLevel: 'error' });
    const issues = matcher.findMatches('這是視頻');

    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].term).toBe('視頻');
    expect(issues[0].level).toBe('hazard');
  });

  it('should calculate correct line and column', () => {
    const matcher = new Matcher(db);
    const text = '第一行\n第二行有優化\n第三行';
    const issues = matcher.findMatches(text);

    const optimizeIssue = issues.find(i => i.term === '優化');
    expect(optimizeIssue?.location.start.line).toBe(2);
  });

  it('should return suggestions for each issue', () => {
    const matcher = new Matcher(db);
    const issues = matcher.findMatches('優化');

    expect(issues[0].suggestions).toBeDefined();
    expect(issues[0].suggestions.length).toBeGreaterThan(0);
    expect(issues[0].suggestions).toContain('最佳化');
  });

  it('should return detailed information for each issue', () => {
    const matcher = new Matcher(db);
    const issues = matcher.findMatches('視頻');

    expect(issues[0]).toHaveProperty('ruleId');
    expect(issues[0]).toHaveProperty('level');
    expect(issues[0]).toHaveProperty('term');
    expect(issues[0]).toHaveProperty('message');
    expect(issues[0]).toHaveProperty('suggestions');
    expect(issues[0]).toHaveProperty('location');
  });

  it('should handle empty text', () => {
    const matcher = new Matcher(db);
    const issues = matcher.findMatches('');

    expect(issues).toHaveLength(0);
  });

  it('should handle text with no issues', () => {
    const matcher = new Matcher(db);
    const issues = matcher.findMatches('這段文字很正常，沒有任何問題');

    // 可能會找到一些詞，但不應該 crash
    expect(Array.isArray(issues)).toBe(true);
  });
});
