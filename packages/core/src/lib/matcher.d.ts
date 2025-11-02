import type { Database } from './database.js';
import type { LintIssue, MatcherOptions } from './types.js';
export declare class Matcher {
    private db;
    private options;
    constructor(db: Database, options?: MatcherOptions);
    findMatches(text: string): LintIssue[];
    private shouldInclude;
    private indexToPosition;
}
//# sourceMappingURL=matcher.d.ts.map