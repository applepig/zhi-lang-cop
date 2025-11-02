import type { Database } from './database.js';
import type { Level, LintIssue, MatcherOptions } from './types.js';

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
