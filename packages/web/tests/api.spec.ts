import { test, expect } from '@playwright/test';

const API_BASE = 'http://localhost:3000';

test.describe('API Endpoints', () => {
  test('POST /api/lint - should check text and return issues', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/lint`, {
      data: {
        text: '我需要優化數據庫的性能',
        minLevel: 'error'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('issues');
    expect(data).toHaveProperty('summary');
    expect(Array.isArray(data.issues)).toBe(true);
    expect(data.issues.length).toBeGreaterThan(0);
    expect(data.summary.total).toBeGreaterThan(0);

    // Check issue structure
    const issue = data.issues[0];
    expect(issue).toHaveProperty('ruleId');
    expect(issue).toHaveProperty('level');
    expect(issue).toHaveProperty('term');
    expect(issue).toHaveProperty('message');
    expect(issue).toHaveProperty('suggestions');
    expect(issue).toHaveProperty('location');
  });

  test('POST /api/lint - should return empty issues for clean text', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/lint`, {
      data: {
        text: '這段文字很正常',
        minLevel: 'error'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.summary.total).toBe(0);
  });

  test('POST /api/lint - should respect minLevel filter', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/lint`, {
      data: {
        text: '優化性能',
        minLevel: 'hazard' // error level should be filtered
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.summary.total).toBe(0);
  });

  test('POST /api/lint - should return 400 for missing text', async ({ request }) => {
    const response = await request.post(`${API_BASE}/api/lint`, {
      data: {}
    });

    expect(response.status()).toBe(400);
  });

  test('GET /api/lookup - should lookup term', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/lookup?term=視頻`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('term');
    expect(data.term).toBe('視頻');
    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);

    const result = data.results[0];
    expect(result).toHaveProperty('ruleId');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('taiwanAlternatives');
  });

  test('GET /api/lookup - should lookup rule by id', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/lookup?rule=00001`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('ruleId');
    expect(data).toHaveProperty('rule');
    expect(data.rule).toHaveProperty('level');
    expect(data.rule).toHaveProperty('message');
  });

  test('GET /api/lookup - should return 400 without params', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/lookup`);
    expect(response.status()).toBe(400);
  });

  test('GET /api/rules - should list all rules', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rules`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('total');
    expect(data).toHaveProperty('rules');
    expect(Array.isArray(data.rules)).toBe(true);
    expect(data.total).toBeGreaterThan(0);
  });

  test('GET /api/rules - should filter by level', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rules?level=hazard`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    data.rules.forEach((r: any) => {
      expect(r.rule.level).toBe('hazard');
    });
  });

  test('GET /api/rules - should support pagination', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/rules?limit=10&offset=0`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data.limit).toBe(10);
    expect(data.offset).toBe(0);
    expect(data.rules.length).toBeLessThanOrEqual(10);
  });

  test('GET /api/stats - should return database statistics', async ({ request }) => {
    const response = await request.get(`${API_BASE}/api/stats`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('lastUpdated');
    expect(data).toHaveProperty('totalRules');
    expect(data).toHaveProperty('totalTerms');
    expect(data).toHaveProperty('byLevel');
    expect(data).toHaveProperty('byCategory');

    expect(data.totalRules).toBeGreaterThan(0);
    expect(data.totalTerms).toBeGreaterThan(0);
  });

  test('GET /health - should return ok', async ({ request }) => {
    const response = await request.get(`${API_BASE}/health`);

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('ok');
  });
});
