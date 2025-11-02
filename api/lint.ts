import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

type Level = 'hazard' | 'error' | 'warning' | 'info' | 'depends';

const LEVEL_ORDER: Record<Level, number> = {
  hazard: 0,
  error: 1,
  warning: 2,
  info: 3,
  depends: 4
};

function getDatabase() {
  const dbPath = join(process.cwd(), 'data/terms-db.json');
  return JSON.parse(readFileSync(dbPath, 'utf-8'));
}

function indexToPosition(text: string, index: number) {
  const lines = text.substring(0, index).split('\n');
  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1
  };
}

function findMatches(text: string, minLevel: Level = 'error') {
  const db = getDatabase();
  const issues: any[] = [];
  const terms = Object.keys(db.termToRulesMap);
  const sortedTerms = terms.sort((a, b) => b.length - a.length);
  const matchedRanges: Array<[number, number]> = [];

  for (const term of sortedTerms) {
    let index = 0;
    while ((index = text.indexOf(term, index)) !== -1) {
      const endIndex = index + term.length;
      const isOverlapping = matchedRanges.some(
        ([start, end]) => (index >= start && index < end) || (endIndex > start && endIndex <= end)
      );

      if (!isOverlapping) {
        const mappings = db.termToRulesMap[term];
        for (const mapping of mappings) {
          const rule = db.rules[mapping.ruleId];
          if (LEVEL_ORDER[rule.level as Level] <= LEVEL_ORDER[minLevel]) {
            issues.push({
              ruleId: mapping.ruleId,
              level: rule.level,
              term,
              message: rule.message,
              suggestions: mapping.taiwanAlternatives,
              location: {
                start: indexToPosition(text, index),
                end: indexToPosition(text, endIndex)
              }
            });
          }
        }
        matchedRanges.push([index, endIndex]);
      }
      index++;
    }
  }

  return issues;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, minLevel } = req.body as { text?: string; minLevel?: Level };

    if (!text) {
      return res.status(400).json({ error: 'Missing required field: text' });
    }

    const issues = findMatches(text, minLevel);

    return res.status(200).json({
      issues,
      summary: {
        total: issues.length,
        byLevel: issues.reduce((acc: any, issue: any) => {
          acc[issue.level] = (acc[issue.level] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Error in lint handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
