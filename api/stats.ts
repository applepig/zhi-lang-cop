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
    const db = getDatabase();

    const byLevel: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const rule of Object.values(db.rules)) {
      byLevel[rule.level] = (byLevel[rule.level] || 0) + 1;
      byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
    }

    const stats = {
      version: db.version,
      lastUpdated: db.lastUpdated,
      totalRules: Object.keys(db.rules).length,
      totalTerms: Object.keys(db.termToRulesMap).length,
      byLevel,
      byCategory
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error in stats handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
