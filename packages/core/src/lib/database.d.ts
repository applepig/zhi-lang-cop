import type { TermsDatabase, RuleId, Rule } from './types';
export declare class Database {
    private db;
    constructor(db: TermsDatabase);
    getRule(ruleId: RuleId): Rule | undefined;
    getRulesByTerm(term: string): Array<{
        rule: Rule;
        ruleId: RuleId;
        taiwanAlternatives: string[];
    }>;
    getAllTerms(): string[];
    getAllRules(): Array<{
        ruleId: RuleId;
        rule: Rule;
    }>;
    getStatistics(): {
        version: string;
        lastUpdated: string;
        totalRules: number;
        totalTerms: number;
        byLevel: Record<string, number>;
        byCategory: Record<string, number>;
    };
}
//# sourceMappingURL=database.d.ts.map