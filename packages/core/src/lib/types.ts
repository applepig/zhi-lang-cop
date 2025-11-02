export type Level = 'hazard' | 'error' | 'warning' | 'info' | 'depends';
export type Category = 'tech' | 'general' | 'programming' | 'hardware';
export type RuleId = string;

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

export interface MatcherOptions {
  minLevel?: Level;
}
