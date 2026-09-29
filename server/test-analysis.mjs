import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const BASE = 'http://localhost:3002';

async function post(path, data) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, forceHeuristic: true }),
  });
  return { status: res.status, body: await res.json() };
}

// === FIXTURES ===

const FIXTURE_LONG_ABSTRACT =
  'Large Language Models for Multimedia: A Survey\n' +
  'John Smith, Jane Doe\n' +
  'University of Technology\n' +
  'john.smith@university.edu\n' +
  'Abstract\u2014This survey provides a comprehensive review of LLMs in multimedia.\n' +
  'We analyze 200 papers from 2020 to 2025. For correspondence, email lead@example.com.\n' +
  'Our taxonomy covers text-to-image, text-to-video, and text-to-audio generation.\n' +
  'We find that text-to-image generation has matured significantly with FID scores\n' +
  'ranging from 7.23 to 27.5 on MS-COCO. Text-to-video and text-to-audio remain\n' +
  'less explored. Key challenges include temporal consistency and evaluation metrics.\n' +
  'This survey aims to provide a useful reference for researchers entering the field.\n'.repeat(20).trim() + '\n' +
  '1. Introduction\nLLMs have revolutionized NLP.\n' +
  '2. Methods\nWe review key approaches.\n' +
  '3. Results\nWe compare methods.\n';

const FIXTURE_AUTHOR_META =
  'A Survey of Neural Network Architectures\n' +
  'Alice Wonderland, Bob Builder\n' +
  'CS Department, MIT\n' +
  '{alice, bob}@mit.edu\n' +
  'Abstract: This survey covers neural network architectures from 2018 to 2024.\n' +
  'We analyze over 150 papers. Contact lead@example.com for details.\n' +
  'Our taxonomy organizes approaches by architectural family.\n' +
  '1. Introduction\nNeural networks have evolved.\n';

const FIXTURE_SINGLE_LINE =
  'Code Generation Survey Alice Smith bob@cs.edu Abstract\u2014This survey examines LLM applications in code generation. We review 80 papers. Contact author@example.com. 1. Introduction Code generation is a growing field. 2. Methods We categorize approaches. 3. Comparison Key results are compared. 4. Conclusion We identify future directions. References [1] Chen et al. 2021. Codex.';

const FIXTURE_NO_CONTRIB =
  'A Systematic Review\n' +
  'Author\n' +
  'University\n' +
  'author@uni.edu\n' +
  'Abstract: This systematic review examines RL algorithms.\n' +
  'We searched three databases.\n' +
  '1. Introduction\nRL has seen rapid progress.\n' +
  '2. Search Methodology\nWe searched Scopus and Web of Science using PRISMA guidelines.\n' +
  '3. Results\nWe identified 45 relevant studies.\n' +
  '4. Discussion\nOur analysis reveals trends.\n' +
  '5. Conclusion\nWe summarize the state of the art.\n';

const FIXTURE_CITED_PRISMA =
  'A Review\n' +
  'Author\n' +
  'Inst.\n' +
  'a@b.com\n' +
  'Abstract: We review relevant literature.\n' +
  '1. Introduction\nPrevious reviews (Smith et al., 2023) used PRISMA guidelines.\n' +
  '2. Discussion\nWe discuss their findings.\n' +
  '3. Conclusion\nSummary.\n';

const FIXTURE_CITED_EXPERIMENTS =
  'A Survey\n' +
  'Author\n' +
  'Inst.\n' +
  'a@b.com\n' +
  'Abstract: We survey vision models.\n' +
  '1. Introduction\nSeveral papers report experimental results. Chen et al. evaluated their model on ImageNet.\n' +
  '2. Discussion\nWe compare methods from the literature.\n' +
  '3. Conclusion\nSummary.\n';

const FIXTURE_EXPLICIT_NO_EXPERIMENTS =
  'A Survey\n' +
  'Author\n' +
  'Inst.\n' +
  'a@b.com\n' +
  'Abstract: We survey the field. We did not conduct any original experiments.\n' +
  '1. Introduction\nThis is a pure literature review.\n' +
  '2. Discussion\nWe discuss findings from the literature.\n' +
  '3. Conclusion\nSummary.\n';

const FIXTURE_EMAIL_IN_ABSTRACT =
  'A Survey\n' +
  'Author\n' +
  'Inst.\n' +
  'a@b.com\n' +
  'Abstract: This survey covers LLM evaluation. For correspondence, contact eval@benchmark.org.\n' +
  'We review 50 papers. Email the authors at survey@paper.edu for questions.\n' +
  '1. Introduction\nBackground.\n' +
  '2. Methods\nReviewed.\n';

describe('Survey Analysis Regression Tests', { timeout: 15000 }, () => {

  it('extracts abstract longer than 2000 chars without truncation, preserves email inside content, final sentence survives', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_LONG_ABSTRACT });
    assert.equal(status, 200);
    const abs = body.abstract || '';
    assert.ok(abs.length > 2000, `Abstract should be >2000 chars but was ${abs.length}`);
    // The final sentence should survive
    assert.ok(abs.includes('researchers entering the field'), 'Final sentence should survive');
    // An email embedded inside legitimate abstract content should be preserved
    assert.ok(abs.includes('lead@example.com'), 'Email inside abstract text should be preserved');
    // But the leading metadata email line should NOT appear
    assert.ok(!abs.startsWith('John Smith'), 'Abstract should not start with author name');
    assert.ok(!abs.startsWith('University'), 'Abstract should not start with affiliation');
    assert.ok(body.paperType === 'survey', 'Should detect survey');
  });

  it('strips author metadata before abstract but preserves email inside abstract', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_AUTHOR_META });
    assert.equal(status, 200);
    const abs = body.abstract || '';
    assert.ok(!abs.includes('{alice, bob}@mit.edu'), 'Leading metadata email should be removed');
    assert.ok(abs.includes('lead@example.com'), 'Email inside abstract body should be preserved');
    assert.ok(abs.includes('covers neural network architectures'), 'Abstract content should survive');
  });

  it('handles flattened single-line PDF text', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_SINGLE_LINE });
    assert.equal(status, 200);
    const abs = body.abstract || '';
    assert.ok(abs.includes('examines LLM applications'), 'Abstract should contain meaningful content');
    // Email that's part of metadata line (short line) should not appear
    assert.ok(!abs.includes('bob@cs.edu'), 'Metadata email should not be in abstract');
    // Email inside content (long line context) should be preserved
  });

  it('returns empty contributions for survey without explicit contributions section', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_NO_CONTRIB });
    assert.equal(status, 200);
    assert.ok(Array.isArray(body.claimedContributions));
    assert.equal(body.claimedContributions.length, 0, 'Should have empty contributions');
    assert.ok(body.methodology?.includes('documented'), 'Should mention search strategy since PRISMA is in method section');
  });

  it('does not detect PRISMA when it appears only in a cited study', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_CITED_PRISMA });
    assert.equal(status, 200);
    // PRISMA appears only in "Smith et al. (2023) used PRISMA" — a citation, not this paper's method
    assert.ok(body.methodology?.includes('Not reported'), 'Should not claim documented search strategy');
  });

  it('does not claim original experiments when experimental language describes cited studies', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_CITED_EXPERIMENTS });
    assert.equal(status, 200);
    // "evaluated their model on ImageNet" refers to Chen et al., not this paper
    assert.ok(!body.experimentalSetup?.includes('contains original'), 'Should not claim original experiments');
  });

  it('respects explicit denial of original experiments', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_EXPLICIT_NO_EXPERIMENTS });
    assert.equal(status, 200);
    // The setup should say "Not reported" not "contains original experiments"
    assert.ok(!body.experimentalSetup?.includes('contains original'), 'Should not claim original experiments when paper explicitly denies them');
  });

  it('preserves email inside legitimate abstract text while stripping leading metadata', async () => {
    const { status, body } = await post('/api/analyze-paper', { text: FIXTURE_EMAIL_IN_ABSTRACT });
    assert.equal(status, 200);
    const abs = body.abstract || '';
    assert.ok(abs.includes('eval@benchmark.org'), 'Email inside abstract content should be preserved');
    assert.ok(abs.includes('survey@paper.edu'), 'Second email inside content should be preserved');
    assert.ok(!abs.startsWith('Author'), 'Should not start with author name');
  });
});

describe('Gap Category Tests', { timeout: 10000 }, () => {
  it('uses three distinct gap categories', async () => {
    // Test with a survey that has acknowledged limitations
    const text = 'A Survey\na@b.com\nAbstract: Survey.\n1. Intro\nIntro text.\n2. Limitations\nWe acknowledge limited coverage.\n3. Future Work\nMore research needed.\n';
    const { body } = await post('/api/find-gaps', {
      text,
      analysis: { paperType: 'survey', datasets: ['d1'], models: [], limitations: ['Limited coverage'], futureWork: ['More research'] },
    });
    for (const gap of body.gaps || []) {
      assert.ok(['paper_limitation', 'author_reported_open_question', 'unverified_field_gap_candidate'].includes(gap.gapType),
        `Unknown gapType: ${gap.gapType} in "${gap.title}"`);
    }
  });
});

describe('Gap Type Distribution', { timeout: 10000 }, () => {
  it('assigns author_reported_open_question when authors acknowledge limitation', async () => {
    const text = 'A Survey\na@b.com\nAbstract: Survey.\n1. Intro\nIntro.\n2. Limitations\nOur search has limited scope.\n3. Future Work\nWe need broader coverage.\n';
    const { body } = await post('/api/find-gaps', {
      text,
      analysis: { paperType: 'survey', datasets: ['d1'], models: [], limitations: ['limited scope'], futureWork: ['broader coverage'] },
    });
    const coverageGap = (body.gaps || []).find(g => g.title.includes('Coverage'));
    assert.ok(coverageGap, 'Coverage gap should exist');
    assert.equal(coverageGap.gapType, 'author_reported_open_question', 'Acknowledged survey limitation should be author_reported_open_question');
  });

  it('assigns paper_limitation for empirical papers', async () => {
    const text = 'Method Paper\na@b.com\nAbstract: New method.\n1. Intro\nProblem.\n2. Method\nOur method.\n3. Experiments\nWe evaluate.\n';
    const { body } = await post('/api/find-gaps', {
      text,
      analysis: { paperType: 'empirical', datasets: ['d1'], models: ['model1'] },
    });
    for (const gap of body.gaps || []) {
      assert.equal(gap.gapType, 'paper_limitation', `Empirical gap should be paper_limitation: ${gap.title}`);
    }
  });
});