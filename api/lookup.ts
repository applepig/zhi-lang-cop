import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from '../packages/core/dist/index.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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

    const db = new Database();

    if (term) {
      const results = db.getRulesByTerm(term as string);
      const formattedResults = results.map(r => ({
        ruleId: r.ruleId,
        term: term as string,
        level: r.rule.level,
        message: r.rule.message,
        category: r.rule.category,
        taiwanAlternatives: r.taiwanAlternatives,
        concepts: r.rule.concepts
      }));
      return res.status(200).json({ term, results: formattedResults });
    }

    if (rule) {
      const result = db.getRule(rule as string);
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
