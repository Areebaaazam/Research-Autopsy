import { describe, it, expect } from 'vitest';
import { checkAbsoluteDifference, checkRelativeChange, checkMean, analyzeAccuracyImprovement, DEFAULT_TOLERANCE } from '../numericalAudit';

describe('Percentage vs Percentage Points', () => {
  it('treats absolute differences as percentage points', () => {
    const result = checkAbsoluteDifference(8.3, 78.4, 70.1);
    expect(result.actual).toBeCloseTo(8.3, 1);
    expect(result.unit).toBe('percentage_points');
  });

  it('detects inconsistent absolute difference', () => {
    const result = checkAbsoluteDifference(12.3, 78.4, 70.1);
    expect(result.consistent).toBe(false);
    expect(result.actual).toBeCloseTo(8.3, 1);
  });
});

describe('Relative Change', () => {
  it('computes relative percentage correctly', () => {
    const result = checkRelativeChange(18.4, 70.1, 83.0);
    expect(result.actual).toBeCloseTo(18.4, 1);
  });

  it('handles zero baseline', () => {
    const result = checkRelativeChange(10, 0, 10);
    expect(result.consistent).toBe(false);
    expect(result.actual).toBe(Infinity);
  });

  it('detects inconsistent relative change', () => {
    const result = checkRelativeChange(15, 70.1, 78.4);
    expect(result.consistent).toBe(false);
  });
});

describe('Mean Calculation', () => {
  it('computes arithmetic mean correctly', () => {
    const result = checkMean([10, 20, 30], 20);
    expect(result.consistent).toBe(true);
    expect(result.actual).toBe(20);
  });

  it('handles empty array', () => {
    const result = checkMean([], 0);
    expect(result.consistent).toBe(false);
    expect(result.actual).toBeNaN();
  });

  it('matches within tolerance', () => {
    const result = checkMean([78.4, 71.2, 35.6], 61.73, 1);
    expect(result.consistent).toBe(true);
    expect(result.actual).toBeCloseTo(61.73, 1);
  });
});

describe('Rounding Tolerance', () => {
  it('accepts values within tolerance', () => {
    const result = checkAbsoluteDifference(8.4, 78.4, 70.0, 0.5);
    expect(result.consistent).toBe(true);
  });

  it('rejects values outside tolerance', () => {
    const result = checkAbsoluteDifference(9.0, 78.4, 70.0, 0.5);
    expect(result.consistent).toBe(false);
  });
});

describe('12.3% Regression Example', () => {
  it('shows the 12.3% claim is inconsistent with absolute mean', () => {
    const result = analyzeAccuracyImprovement();
    expect(result.assessment).toBe('inconsistent');
    expect(result.deterministicResult).toBeLessThan(12);
    expect(result.reason).toContain('percentage points');
  });

  it('distinguishes direction support from exact magnitude', () => {
    const result = analyzeAccuracyImprovement();
    // The direction is supported (AFR > CoT on all benchmarks)
    expect(result.claim).toContain('improves accuracy');
    // But the exact magnitude of 12.3% is inconsistent
    expect(result.expectedResult).toBe(12.3);
    expect(result.deterministicResult).not.toBe(12.3);
  });

  it('provides formula and extracted values', () => {
    const result = analyzeAccuracyImprovement();
    expect(result.formula).toContain('78.4');
    expect(result.extractedValues.length).toBeGreaterThanOrEqual(6);
    expect(result.extractedValues.some(v => v.label === 'Claimed average improvement')).toBe(true);
  });
});

describe('Unsupported Values', () => {
  it('returns unable_to_verify for missing source data', () => {
    const result = checkMean([], 10);
    expect(result.consistent).toBe(false);
    expect(result.actual).toBeNaN();
  });
});

describe('Default Tolerance', () => {
  it('has reasonable default', () => {
    expect(DEFAULT_TOLERANCE).toBe(0.5);
  });
});