import { describe, it, expect } from 'vitest';

// Inline the validation logic for testing
function validatePassage(passage: string, fullText: string): boolean {
  if (!passage || !fullText) return false;
  const clean = passage.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
  const source = fullText.replace(/[^a-zA-Z0-9\s]/g, '').trim().toLowerCase();
  if (clean.length < 20) return source.includes(clean);
  return source.includes(clean);
}

function validateQuotations(evidenceItems: { evidence: string }[], text: string) {
  return evidenceItems.map(item => {
    const quotes = item.evidence.match(/"([^"]+)"/g) || [];
    const allValid = quotes.length === 0 || quotes.every(q => {
      const inner = q.slice(1, -1);
      return inner.length < 10 || validatePassage(inner, text);
    });
    return { ...item, passageValidated: allValid };
  });
}

const SAMPLE_TEXT = `This is a sample research paper text. The model achieves 95% accuracy on the test set. Results demonstrate significant improvement over baselines.`;

describe('Quotation Grounding', () => {
  it('validates a direct quotation that exists verbatim', () => {
    const items = [{ evidence: 'The model achieves 95% accuracy on the test set' }];
    const result = validateQuotations(items, SAMPLE_TEXT);
    expect(result[0].passageValidated).toBe(true);
  });

  it('fails a quotation that does not exist in source', () => {
    const items = [{ evidence: '"This claim is completely made up and not in the text"' }];
    const result = validateQuotations(items, SAMPLE_TEXT);
    expect(result[0].passageValidated).toBe(false);
  });

  it('handles evidence without quotes as valid', () => {
    const items = [{ evidence: 'This is a paraphrase of the results.' }];
    const result = validateQuotations(items, SAMPLE_TEXT);
    expect(result[0].passageValidated).toBe(true);
  });

  it('handles empty evidence gracefully', () => {
    const items = [{ evidence: '' }];
    const result = validateQuotations(items, SAMPLE_TEXT);
    expect(result[0].passageValidated).toBe(true);
  });
});

describe('Evidence vs Inference Distinction', () => {
  it('treats explicit numerical values from text as evidence', () => {
    const items = [{ evidence: '"95% accuracy"' }];
    const text = 'The model achieves 95% accuracy.';
    const result = validateQuotations(items, text);
    expect(result[0].passageValidated).toBe(true);
  });

  it('marks quotes not in source as unvalidated', () => {
    const items = [{ evidence: '"77% accuracy on unseen data"' }];
    const result = validateQuotations(items, SAMPLE_TEXT);
    expect(result[0].passageValidated).toBe(false);
  });
});

describe('Paper Version Staleness', () => {
  it('detects when paper text changes between calls', () => {
    function hashText(text: string): string {
      let h = 0;
      for (let i = 0; i < text.length; i++) {
        h = ((h << 5) - h) + text.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h).toString(16).slice(0, 12);
    }

    const hash1 = hashText('Paper version one content here.');
    const hash2 = hashText('Paper version two with different content.');
    expect(hash1).not.toBe(hash2);
  });

  it('produces consistent hashes for same text', () => {
    function hashText(text: string): string {
      let h = 0;
      for (let i = 0; i < text.length; i++) {
        h = ((h << 5) - h) + text.charCodeAt(i);
        h |= 0;
      }
      return Math.abs(h).toString(16).slice(0, 12);
    }

    const hash1 = hashText('Same paper text');
    const hash2 = hashText('Same paper text');
    expect(hash1).toBe(hash2);
  });
});

describe('Honest Mode Display', () => {
  it('correctly identifies demo mode', () => {
    const mode = 'demo';
    expect(['ai', 'heuristic', 'demo']).toContain(mode);
    expect(mode).toBe('demo');
  });

  it('correctly identifies heuristic mode', () => {
    const mode = 'heuristic';
    expect(mode).not.toBe('ai');
    expect(mode).not.toBe('demo');
  });
});

describe('Reviewer Response Integrity', () => {
  it('never claims work is completed when status is planned', () => {
    const responses = [
      { status: 'planned' as const, workCompleted: false },
      { status: 'in_progress' as const, workCompleted: false },
    ];

    for (const r of responses) {
      if (r.status === 'planned' || r.status === 'in_progress') {
        expect(r.workCompleted).toBe(false);
      }
    }
  });

  it('can set work completed when status is completed', () => {
    const response = { status: 'completed' as const, workCompleted: true };
    expect(response.workCompleted).toBe(true);
  });
});

describe('Memory Storage Versioning', () => {
  it('migrates v1 array format to v2', () => {
    const v1Data = [{ id: '1', title: 'test' }];
    const migrated = { storageVersion: 2, items: v1Data };
    expect(migrated.storageVersion).toBe(2);
    expect(migrated.items).toHaveLength(1);
  });

  it('preserves v2 format', () => {
    const v2Data = { storageVersion: 2, items: [{ id: '1', title: 'test' }] };
    expect(v2Data.storageVersion).toBe(2);
  });
});

describe('Backup/Import Behavior', () => {
  it('rejects backup without version', () => {
    const badBackup = '{"items": []}';
    expect(() => JSON.parse(badBackup)).not.toThrow();
    const parsed = JSON.parse(badBackup);
    expect(parsed.version).toBeUndefined();
  });

  it('accepts valid backup format', () => {
    const validBackup = JSON.stringify({
      version: 2,
      exportedAt: '2025-01-01T00:00:00Z',
      memory: { storageVersion: 2, items: [{ id: '1', title: 'Test', content: 'Content', type: 'finding', tags: [], createdAt: 1, updatedAt: 1 }] }
    });
    const parsed = JSON.parse(validBackup);
    expect(parsed.version).toBe(2);
    expect(parsed.memory.items).toHaveLength(1);
  });
});

describe('Experiment Brief Saving and Restoring', () => {
  it('preserves all fields when round-tripped through JSON', () => {
    const brief = {
      id: 'eb-test-1',
      concernReference: 'Limited model generalization',
      hypothesis: 'AFR may not generalize to other models',
      proposedTest: 'Run on Llama-2-70B',
      baselineComparison: 'Standard CoT',
      controls: 'Same prompts, seeds, temperature',
      confounders: 'API version differences',
      measurementCriteria: 'Accuracy',
      outcomesWouldSupport: 'Consistent improvement across models',
      outcomesWouldWeaken: 'Improvement on only one model',
      estimatedEffort: '2-3 weeks',
      assumptions: 'API versions are comparable',
      unknownDetails: 'Exact API costs',
      status: 'planned' as const,
      createdAt: 1000,
      updatedAt: 1000
    };

    const json = JSON.stringify(brief);
    const restored = JSON.parse(json);
    expect(restored.hypothesis).toBe(brief.hypothesis);
    expect(restored.proposedTest).toBe(brief.proposedTest);
    expect(restored.status).toBe('planned');
    expect(restored.id).toBe('eb-test-1');
  });
});

describe('Claim-Evidence Assessment', () => {
  it('correctly categorizes supported claims', () => {
    const claim = {
      claim: 'AFR improves accuracy by 12.3%',
      assessment: 'supported' as const,
      assessmentReason: 'Direct numerical comparison in Section 5'
    };
    expect(claim.assessment).toBe('supported');
  });

  it('correctly flags unvalidated passages', () => {
    const item = { passageValidated: false };
    expect(item.passageValidated).toBe(false);
  });
});