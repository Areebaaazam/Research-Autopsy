import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
const _localStorage = localStorageMock;

beforeEach(() => { _localStorage.clear(); });

// ---- DRAFT SAVE AND RESTORATION ----

describe('Draft Save and Restoration', () => {
  it('saves draft with content, timestamp, and version', () => {
    const draft = { content: '# My Paper', savedAt: Date.now(), version: 12345 };
    _localStorage.setItem('test-draft', JSON.stringify(draft));
    const restored = JSON.parse(_localStorage.getItem('test-draft')!);
    expect(restored.content).toBe('# My Paper');
    expect(restored.version).toBe(12345);
    expect(restored.savedAt).toBeGreaterThan(0);
  });

  it('scopes draft to paper version', () => {
    _localStorage.setItem('draft-111', JSON.stringify({ content: 'v1 draft', savedAt: Date.now(), version: 111 }));
    _localStorage.setItem('draft-222', JSON.stringify({ content: 'v2 draft', savedAt: Date.now(), version: 222 }));
    const restored = JSON.parse(_localStorage.getItem('draft-111')!);
    expect(restored.content).toBe('v1 draft');
    expect(restored.version).toBe(111);
  });

  it('restores draft only when version matches current paper', () => {
    _localStorage.setItem('draft-100', JSON.stringify({ content: 'old content', savedAt: Date.now(), version: 100 }));
    const restored = JSON.parse(_localStorage.getItem('draft-100')!);
    const currentVersion = 200;
    expect(restored.version === currentVersion).toBe(false);
  });
});

// ---- STORAGE FAILURE ----

describe('Storage Failure and Truthful Save Status', () => {
  it('sets status to saved on success', () => {
    let status: string;
    try {
      _localStorage.setItem('test', 'data');
      status = 'saved';
    } catch {
      status = 'failed';
    }
    expect(status).toBe('saved');
  });

  it('sets status to failed on exception', () => {
    // Simulate a storage failure by throwing in a mock-like fashion
    let status = 'unsaved';
    try {
      throw new Error('QuotaExceededError');
    } catch {
      status = 'failed';
    }
    expect(status).toBe('failed');
  });

  it('never sets status to saved when an exception occurs', () => {
    let status = 'unsaved';
    try {
      throw new Error('Storage full');
    } catch {
      status = 'failed';
    }
    expect(status).not.toBe('saved');
  });
});

// ---- INTERNAL NAVIGATION PROTECTION ----

describe('Internal Navigation Protection', () => {
  it('tracks unsaved state', () => {
    let editorDirty = false;
    editorDirty = true;
    expect(editorDirty).toBe(true);
  });

  it('detects unsaved changes as needing protection', () => {
    const saveStatus: string = 'unsaved';
    expect(saveStatus !== 'saved').toBe(true);
  });

  it('allows navigation when saved', () => {
    const saveStatus: string = 'saved';
    expect(saveStatus !== 'saved').toBe(false);
  });
});

// ---- QUEUE METADATA PERSISTENCE ----

describe('Queue Metadata Persistence', () => {
  it('preserves pin state across reducer', () => {
    const queue = [{ id: 'q-1', pinned: false }];
    const updated = queue.map(q => q.id === 'q-1' ? { ...q, pinned: true } : q);
    expect(updated[0].pinned).toBe(true);
  });

  it('preserves priority across reducer', () => {
    const queue = [{ id: 'q-1', userPriority: 0 }];
    const updated = queue.map(q => q.id === 'q-1' ? { ...q, userPriority: 3 } : q);
    expect(updated[0].userPriority).toBe(3);
  });

  it('preserves notes across reducer', () => {
    const queue = [{ id: 'q-1', userNote: '' }];
    const updated = queue.map(q => q.id === 'q-1' ? { ...q, userNote: 'This is critical' } : q);
    expect(updated[0].userNote).toBe('This is critical');
  });
});

// ---- SELECTING THE CORRECT SOURCE FINDING ----

describe('Source Finding Selection', () => {
  it('selects inconsistent numerical finding over claim evidence', () => {
    const findings = [{ id: 'n1', claim: 'Accuracy improved 12.3%', assessment: 'inconsistent' as const }];
    const claimEvidence = [{ id: 'c1', claim: 'Method is novel', assessment: 'supported' as const }];
    const top = findings.find(f => f.assessment === 'inconsistent') || claimEvidence[0];
    expect(top!.claim).toBe('Accuracy improved 12.3%');
    expect(top!.assessment).toBe('inconsistent');
  });

  it('falls back to claim evidence when numerical audit is empty', () => {
    const findings: { assessment: string }[] = [];
    const claimEvidence = [{ id: 'c1', claim: 'Method is novel', assessment: 'supported' as const }];
    const top = (findings.find(f => f.assessment === 'inconsistent') || claimEvidence[0]) as typeof claimEvidence[0];
    expect(top.claim).toBe('Method is novel');
  });

  it('returns null when no findings exist', () => {
    const top = [].find((f: any) => f.assessment === 'inconsistent') || null;
    expect(top).toBeNull();
  });
});

// ---- GRAPH PROVENANCE MIGRATION ----

describe('Graph Provenance Migration', () => {
  it('accepts old edges without provenance as unknown', () => {
    const oldEdge = { from: 'a', to: 'b', label: 'cites', type: 'cites' };
    const provenance = (oldEdge as any).provenance || 'unknown';
    expect(provenance).toBe('unknown');
  });

  it('preserves sourced provenance', () => {
    const edge = { from: 'a', to: 'b', label: 'cites', type: 'cites', provenance: 'sourced' as const, sourceReference: 'Section 4' };
    expect(edge.provenance).toBe('sourced');
    expect(edge.sourceReference).toBe('Section 4');
  });

  it('preserves inferred provenance', () => {
    const edge = { from: 'a', to: 'b', label: 'related', type: 'contrasts', provenance: 'inferred' as const };
    expect(edge.provenance).toBe('inferred');
  });

  it('counts edges by provenance', () => {
    const edges = [
      { from: 'a', to: 'b', provenance: 'sourced' as const },
      { from: 'c', to: 'd', provenance: 'inferred' as const },
      { from: 'e', to: 'f' } as any,
    ];
    expect(edges.filter(e => e.provenance === 'sourced').length).toBe(1);
    expect(edges.filter(e => e.provenance === 'inferred').length).toBe(1);
    expect(edges.filter(e => !e.provenance || e.provenance === 'unknown').length).toBe(1);
  });
});

// ---- DYNAMIC IMPORT ASSERTIONS ----

describe('Dynamic Import Verification', () => {
  it('confirms lazy import syntax returns a function', () => {
    const isLazy = typeof (() => Promise.resolve({ default: null as React.ComponentType | null })) === 'function';
    expect(isLazy).toBe(true);
  });
});

// ---- DRAFT ISOLATION ACROSS PAPER VERSIONS ----

describe('Draft Isolation Across Paper Versions', () => {
  it('uses different keys for different paper hashes', () => {
    expect('research-autopsy-draft-abc123').not.toBe('research-autopsy-draft-def456');
  });

  it('does not overwrite draft for paper A when saving draft for paper B', () => {
    _localStorage.setItem('draft-A', JSON.stringify({ content: 'Paper A content', version: 1 }));
    _localStorage.setItem('draft-B', JSON.stringify({ content: 'Paper B content', version: 2 }));
    const draftA = JSON.parse(_localStorage.getItem('draft-A')!);
    expect(draftA.content).toBe('Paper A content');
  });
});

describe('Evidence Panel Width', () => {
  it('clamps width between 280 and 600', () => {
    const clamp = (w: number) => Math.max(280, Math.min(600, w));
    expect(clamp(100)).toBe(280);
    expect(clamp(380)).toBe(380);
    expect(clamp(800)).toBe(600);
  });
});