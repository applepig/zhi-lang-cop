export class Database {
    db;
    constructor(db) {
        this.db = db;
    }
    getRule(ruleId) {
        return this.db.rules[ruleId];
    }
    getRulesByTerm(term) {
        const mappings = this.db.termToRulesMap[term];
        if (!mappings)
            return [];
        return mappings.map(mapping => ({
            rule: this.db.rules[mapping.ruleId],
            ruleId: mapping.ruleId,
            taiwanAlternatives: mapping.taiwanAlternatives
        }));
    }
    getAllTerms() {
        return Object.keys(this.db.termToRulesMap);
    }
    getAllRules() {
        return Object.entries(this.db.rules).map(([ruleId, rule]) => ({
            ruleId: ruleId,
            rule
        }));
    }
    getStatistics() {
        const byLevel = {};
        const byCategory = {};
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
//# sourceMappingURL=database.js.map