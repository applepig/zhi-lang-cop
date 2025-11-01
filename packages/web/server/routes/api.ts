import type { FastifyInstance } from 'fastify';
import { LinterService } from '../services/linter.js';
import type { Level } from 'zhi-lang-cop-core';

export async function apiRoutes(fastify: FastifyInstance) {
  const linter = new LinterService();

  // POST /api/lint - Check text and return issues
  fastify.post<{
    Body: { text: string; minLevel?: Level };
  }>('/api/lint', async (request, reply) => {
    const { text, minLevel } = request.body;

    if (!text) {
      return reply.code(400).send({ error: 'Missing required field: text' });
    }

    const issues = linter.lint(text, minLevel);

    return {
      issues,
      summary: {
        total: issues.length,
        byLevel: issues.reduce((acc, issue) => {
          acc[issue.level] = (acc[issue.level] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      }
    };
  });

  // GET /api/lookup - Query term or rule
  fastify.get<{
    Querystring: { term?: string; rule?: string };
  }>('/api/lookup', async (request, reply) => {
    const { term, rule } = request.query;

    if (!term && !rule) {
      return reply.code(400).send({ error: 'Must provide either term or rule parameter' });
    }

    if (term) {
      const results = linter.lookupTerm(term);
      return { term, results };
    }

    if (rule) {
      const result = linter.lookupRule(rule);
      if (!result) {
        return reply.code(404).send({ error: 'Rule not found' });
      }
      return { ruleId: rule, rule: result };
    }
  });

  // GET /api/rules - List rules with filters
  fastify.get<{
    Querystring: { level?: Level; category?: string; limit?: string; offset?: string };
  }>('/api/rules', async (request, reply) => {
    const { level, category, limit, offset } = request.query;

    const params = {
      level,
      category,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    };

    return linter.getRules(params);
  });

  // GET /api/stats - Database statistics
  fastify.get('/api/stats', async (request, reply) => {
    return linter.getStats();
  });
}
