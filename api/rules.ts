import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Database } from '../packages/core/dist/index.js';
import type { Level } from '../packages/core/dist/types.js';

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
    const { level, category, limit, offset } = req.query as {
      level?: Level;
      category?: string;
      limit?: string;
      offset?: string;
    };

    const db = new Database();
    const allRules = db.getAllRules();

    let filtered = allRules;

    // Filter by level
    if (level) {
      filtered = filtered.filter(r => r.rule.level === level);
    }

    // Filter by category
    if (category) {
      filtered = filtered.filter(r => r.rule.category === category);
    }

    // Pagination
    const offsetNum = offset ? parseInt(offset) : 0;
    const limitNum = limit ? parseInt(limit) : 50;

    return res.status(200).json({
      total: filtered.length,
      offset: offsetNum,
      limit: limitNum,
      rules: filtered.slice(offsetNum, offsetNum + limitNum)
    });
  } catch (error) {
    console.error('Error in rules handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
