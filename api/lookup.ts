import type { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync } from 'fs';
import { join } from 'path';

function getDatabase() {
  const dbPath = join(process.cwd(), 'data/terms-db.json');
  return JSON.parse(readFileSync(dbPath, 'utf-8'));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { term, rule } = req.query as { term?: string; rule?: string };

    if (!term && !rule) {
      return res.status(400).json({ error: 'Must provide either term or rule parameter' });
    }

    const db = getDatabase();

    if (term) {
      const mappings = db.termToRulesMap[term] || [];
      const results = mappings.map((mapping: any) => ({
        ruleId: mapping.ruleId,
        term,
        level: db.rules[mapping.ruleId].level,
        message: db.rules[mapping.ruleId].message,
        category: db.rules[mapping.ruleId].category,
        taiwanAlternatives: mapping.taiwanAlternatives,
        concepts: db.rules[mapping.ruleId].concepts
      }));
      return res.status(200).json({ term, results });
    }

    if (rule) {
      const result = db.rules[rule];
      if (!result) {
        return res.status(404).json({ error: 'Rule not found' });
      }
      return res.status(200).json({ ruleId: rule, rule: result });
    }
  } catch (error) {
    console.error('Error in lookup handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
