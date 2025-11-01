import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Database, Matcher } from '../packages/core/dist/index.js';
import type { Level } from '../packages/core/dist/types.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
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

    const db = new Database();
    const matcher = new Matcher(db, { minLevel });
    const issues = matcher.findMatches(text);

    return res.status(200).json({
      issues,
      summary: {
        total: issues.length,
        byLevel: issues.reduce((acc, issue) => {
          acc[issue.level] = (acc[issue.level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    });
  } catch (error) {
    console.error('Error in lint handler:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
