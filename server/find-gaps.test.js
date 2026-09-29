import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

// Mock globalThis.fetch. Set once in beforeAll; each test overrides via mockResolvedValue/mockRejectedValue.
// Use mockClear ONLY for the concurrency describe block (needs to reset between sub-tests).
let fetchMock;
beforeAll(() => {
  fetchMock = vi.fn().mockResolvedValue(openAiResponse({ id: 'default', choices: [], usage: {} }));
  globalThis.fetch = fetchMock;
});

process.env.GROQ_API_KEY = 'gsk_test_key_mocked_tests_only';

import fs from 'fs';
import path from 'path';

const sampleText = 'This paper presents a study on multimodal generation. Research Gap 1: self-correction and dynamic guidance during inference are missing from current approaches.';

/** Build a fetch Response that mimics the OpenAI API response */
function openAiResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Map([['content-type', 'application/json']]),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  };
}

const aiGapsPayload = {
  gaps: [{
    id: 'gap-1', sourceId: 'gap_1', title: 'Lack of self-correction',
    description: 'Models cannot dynamically self-correct during inference.',
    evidence: 'Research Gap 1: self-correction',
    evidenceValidated: true, gapType: 'author_stated',
    whyItMatters: 'Limits real-time adaptability.',
    explicitlyAcknowledged: true, potentialDirection: 'Add self-correction modules.',
    confidenceLevel: 'High',
  }],
  finishReason: 'stop',
  usage: { total_tokens: 120, completion_tokens: 100 },
};

const aiGapsBody = {
  id: 'chatcmpl-mock',
  object: 'chat.completion',
  created: Date.now(),
  model: 'qwen/qwen3.8-27b',
  choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(aiGapsPayload) }, finish_reason: 'stop' }],
  usage: { total_tokens: 120, completion_tokens: 100, prompt_tokens: 500 },
};

const sparseGapsPayload = {
  gaps: [{
    id: 'gap-1', sourceId: 'gap_1', title: 'Lack of self-correction',
    description: 'Models cannot dynamically self-correct during inference.',
    evidence: 'Research Gap 1: self-correction',
    evidenceValidated: true, gapType: 'author_stated',
    whyItMatters: 'Limits real-time adaptability.',
    explicitlyAcknowledged: true, potentialDirection: 'Add self-correction modules.',
    confidenceLevel: 'High',
  }],
  finishReason: 'stop',
  usage: { total_tokens: 80, completion_tokens: 60 },
};

const sparseGapsBody = {
  id: 'chatcmpl-mock2',
  object: 'chat.completion',
  created: Date.now(),
  model: 'qwen/qwen3.8-27b',
  choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify(sparseGapsPayload) }, finish_reason: 'stop' }],
  usage: { total_tokens: 80, completion_tokens: 60, prompt_tokens: 300 },
};

const malformedBody = {
  id: 'chatcmpl-mock3',
  object: 'chat.completion',
  created: Date.now(),
  model: 'qwen/qwen3.8-27b',
  choices: [{ index: 0, message: { role: 'assistant', content: JSON.stringify({ notGaps: [] }) }, finish_reason: 'stop' }],
  usage: { total_tokens: 50, completion_tokens: 30, prompt_tokens: 200 },
};

const invalidJsonBody = {
  id: 'chatcmpl-mock4',
  object: 'chat.completion',
  created: Date.now(),
  model: 'qwen/qwen3.8-27b',
  choices: [{ index: 0, message: { role: 'assistant', content: 'not valid json' }, finish_reason: 'stop' }],
  usage: { total_tokens: 20, completion_tokens: 10, prompt_tokens: 100 },
};

const rateLimitBody = { error: { message: 'rate_limit: try again in 1s', type: 'rate_limit' } };

let request;
let app;
let buildLlmError;
let extractGapRelevantSections;
let extractNumberedGaps;

beforeAll(async () => {
  const mod = await import('./index.js');
  request = (await import('supertest')).default;
  app = mod.default;
  buildLlmError = mod.buildLlmError;
  extractGapRelevantSections = mod.extractGapRelevantSections;
  extractNumberedGaps = mod.extractNumberedGaps;
});

// ─────────────────────────────────────────────
// extractNumberedGaps
// ─────────────────────────────────────────────
describe('extractNumberedGaps', () => {
  it('returns source IDs and passages for numbered gaps', () => {
    const text = 'Some text. Research Gap 1: The first gap, longer than the threshold so it passes filtering. Research Gap 2: The second gap passage for testing. Research Gap 3: The third gap passage for testing.';
    const gaps = extractNumberedGaps(text);
    expect(gaps).toHaveLength(3);
    expect(gaps[0].sourceId).toBe('gap_1');
    expect(gaps[1].sourceId).toBe('gap_2');
    expect(gaps[2].sourceId).toBe('gap_3');
    gaps.forEach(g => {
      expect(g.passage.length).toBeGreaterThan(10);
    });
  });
});

// ─────────────────────────────────────────────
// Concurrency
// ─────────────────────────────────────────────
describe('concurrency — no shared error state', () => {
  beforeEach(() => { fetchMock.mockClear(); });

  it('overlapping requests each return their own correct response', async () => {
    // First request hits AI (fails with rate limit then retry, both fail)
    fetchMock.mockRejectedValue(new Error('rate_limit: try again in 1s'));
    // Second request uses forceHeuristic — no AI call needed

    const r1 = request(app).post('/api/find-gaps').send({ text: sampleText });
    const r2 = request(app).post('/api/find-gaps').send({ text: sampleText, forceHeuristic: true });

    const [res1, res2] = await Promise.all([r1, r2]);

    expect(res1.status).toBe(502);
    expect(res1.body.mode).toBe('ai_error');

    expect(res2.status).toBe(200);
    expect(res2.body.mode).toBe('heuristic');
  });
});

// ─────────────────────────────────────────────
// buildLlmError() — error classification
// ─────────────────────────────────────────────
describe('buildLlmError() — error classification', () => {
  it('classifies rate_limited from 429 error', () => {
    const err = new Error('rate_limit: try again in 5s');
    err.status = 429;
    const r = buildLlmError(err);
    expect(r.kind).toBe('rate_limited');
    expect(r.status).toBe(429);
    expect(r.retryAfterSec).toBe(5);
  });

  it('classifies auth from 401 error', () => {
    const err = new Error('Invalid API Key');
    err.status = 401;
    const r = buildLlmError(err);
    expect(r.kind).toBe('auth');
    expect(r.message).toContain('API key');
  });

  it('classifies timeout from 408 error', () => {
    const err = new Error('Request timed out');
    err.status = 408;
    expect(buildLlmError(err).kind).toBe('timeout');
  });

  it('classifies network from connection error', () => {
    const r = buildLlmError(new Error('ECONNREFUSED'));
    expect(r.kind).toBe('network');
    expect(r.status).toBe(0);
    expect(r.message).toContain('Network error');
  });

  it('classifies network from fetch failed', () => {
    expect(buildLlmError(new Error('fetch failed: something')).kind).toBe('network');
  });

  it('classifies json_parse from invalid JSON', () => {
    const r = buildLlmError(new Error('Unexpected token o'));
    expect(r.kind).toBe('json_parse');
    expect(r.status).toBe(502);
    expect(r.message).toContain('valid JSON');
  });

  it('classifies schema_validation when gaps key is missing', () => {
    const err = new Error('AI response missing required fields');
    err.status = 502;
    const r = buildLlmError(err);
    expect(r.kind).toBe('schema_validation');
    expect(r.status).toBe(502);
    expect(r.message).toContain('missing required fields');
  });

  it('classifies server_error from 503 error', () => {
    const err = new Error('Service Unavailable');
    err.status = 503;
    expect(buildLlmError(err).kind).toBe('server_error');
  });

  it('extracts retryAfterSec from rate limit message', () => {
    const err = new Error('rate_limit: try again in 12.5s');
    err.status = 429;
    expect(buildLlmError(err).retryAfterSec).toBe(13);
  });
});

// ─────────────────────────────────────────────
// extractGapRelevantSections — regression using survey text
// ─────────────────────────────────────────────
describe('extractGapRelevantSections — survey regressions', () => {
  let surveyText;

  beforeAll(() => {
    surveyText = fs.readFileSync(path.resolve(__dirname, 'uploads', 'survey-extracted.txt'), 'utf8');
  });

  it('Section V contains all three research gap passages', () => {
    const vSection = surveyText.match(/V\.\s+D\s*I\s*S\s*C\s*U\s*S\s*S\s*I\s*O\s*N[\s\S]*?(?=VI\.)/i);
    expect(vSection).not.toBeNull();
    const collapsed = vSection[0].replace(/\s+/g, ' ').trim();
    expect(collapsed).toMatch(/R\s*e\s*s\s*e\s*a\s*r\s*c\s*h\s+Gap\s+1[\s\S]{0,50}distinct lack[\s\S]*?single[\s\S]*?stage/i);
    expect(collapsed).toMatch(/R\s*e\s*s\s*e\s*a\s*r\s*c\s*h\s+Gap\s+2[\s\S]*?text[\s\S]*?visual embedding adapters lack/i);
    expect(collapsed).toMatch(/R\s*e\s*s\s*e\s*a\s*r\s*c\s*h\s+Gap\s+3[\s\S]*?community lacks[\s\S]*?multi[\s\S]*?turn conversational/i);
  });

  it('extractGapRelevantSections output contains all three gap labels and fits 8000 limit', () => {
    const result = extractGapRelevantSections(surveyText);
    expect(result.length).toBeGreaterThan(500);
    expect(result.length).toBeLessThanOrEqual(8000);
    expect(result).toMatch(/R\s*e\s*s\s*e\s*a\s*r\s*c\s*h\s+Gap\s+[123]/i);
    expect(result).toMatch(/Key Challenges/);
  });

  it('extractNumberedGaps returns all three from survey text', () => {
    const gaps = extractNumberedGaps(surveyText);
    expect(gaps).toHaveLength(3);
    expect(gaps.map(g => g.sourceId)).toEqual(['gap_1', 'gap_2', 'gap_3']);
    gaps.forEach(g => {
      expect(g.passage.length).toBeGreaterThan(50);
      expect(g.passage.length).toBeLessThanOrEqual(1200);
    });
  });
});

// ─────────────────────────────────────────────
// Route integration — uses globalThis.fetch mock
// ─────────────────────────────────────────────
describe('POST /api/find-gaps — route integration', () => {
  beforeEach(() => { fetchMock.mockClear(); });

  it('returns AI gaps when LLM succeeds', async () => {
    fetchMock.mockResolvedValue(openAiResponse(aiGapsBody));
    const res = await request(app)
      .post('/api/find-gaps')
      .send({ text: sampleText, analysis: { paperType: 'survey' } });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('ai');
    expect(res.body.gaps).toHaveLength(1);
    expect(res.body.gaps[0].title).toBe('Lack of self-correction');
    expect(res.body.gaps[0].sourceId).toBe('gap_1');
  });

  it('returns 502 when LLM returns invalid JSON', async () => {
    fetchMock.mockResolvedValue(openAiResponse(invalidJsonBody));
    const res = await request(app).post('/api/find-gaps').send({ text: sampleText });
    expect(res.status).toBe(502);
    expect(res.body.mode).toBe('ai_error');
    expect(res.body.errorKind).toBe('json_parse');
  });

  it('returns 502 when LLM response lacks gaps key', async () => {
    fetchMock.mockResolvedValue(openAiResponse(malformedBody));
    const res = await request(app).post('/api/find-gaps').send({ text: sampleText });
    expect(res.status).toBe(502);
    expect(res.body.mode).toBe('ai_error');
    expect(res.body.errorKind).toBe('schema_validation');
  });

  it('fills omitted source ID with fallback entry preserving source passage', async () => {
    // AI returns only gap_1 — gap_2 and gap_3 are missing
    const textWithThree = 'intro. Research Gap 1: First gap passage. Research Gap 2: Second gap passage here. Research Gap 3: Third gap passage here.';
    fetchMock.mockResolvedValue(openAiResponse(aiGapsBody));
    const res = await request(app)
      .post('/api/find-gaps')
      .send({ text: textWithThree, analysis: { paperType: 'survey' } });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('ai');

    // Should have 3 gaps: 1 AI + 2 fallback
    expect(res.body.gaps).toHaveLength(3);

    // gap_1 from AI
    const gap1 = res.body.gaps.find(g => g.sourceId === 'gap_1');
    expect(gap1).toBeTruthy();
    expect(gap1._fallback).toBeFalsy();
    expect(gap1.title).toBe('Lack of self-correction');

    // gap_2 and gap_3 are fallback entries
    const gap2 = res.body.gaps.find(g => g.sourceId === 'gap_2');
    expect(gap2).toBeTruthy();
    expect(gap2._fallback).toBe(true);
    expect(gap2.title).toBe('Research Gap 2:');
    expect(gap2.description).toBe('Author-stated gap — AI interpretation unavailable.');
    expect(gap2.evidence).toContain('Second gap passage');
    expect(gap2.confidenceLevel).toBeNull();
    expect(gap2.whyItMatters).toBeNull();
    expect(gap2.potentialDirection).toBeNull();
    expect(gap2.gapType).toBe('author_stated');
    expect(gap2.evidenceValidated).toBe(true);

    const gap3 = res.body.gaps.find(g => g.sourceId === 'gap_3');
    expect(gap3).toBeTruthy();
    expect(gap3._fallback).toBe(true);
    expect(gap3.title).toBe('Research Gap 3:');
    expect(gap3.evidence).toContain('Third gap passage');
  });

  it('returns finishReason and usage metadata', async () => {
    fetchMock.mockResolvedValue(openAiResponse(aiGapsBody));
    const res = await request(app)
      .post('/api/find-gaps')
      .send({ text: sampleText, analysis: { paperType: 'survey' } });
    expect(res.status).toBe(200);
    expect(res.body.finishReason).toBe('stop');
    expect(res.body.usage).toBeTruthy();
    expect(res.body.usage.total_tokens).toBe(120);
  });

  it('returns heuristic mode only when forceHeuristic: true', async () => {
    // No fetch mock needed — route skips AI
    const res = await request(app).post('/api/find-gaps').send({ text: sampleText, forceHeuristic: true });
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('heuristic');
  });

  it('returns 400 for missing text', async () => {
    const res = await request(app).post('/api/find-gaps').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Paper text required');
  });
});
