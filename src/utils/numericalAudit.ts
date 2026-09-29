import type { NumericClaim, NumericalAudit } from '../types';

// Deterministic numerical consistency checker.
// All arithmetic is performed with JavaScript numbers.
// Tolerances account for source rounding (default 0.5 percentage points).

export const DEFAULT_TOLERANCE = 0.5;

function findInText(text: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(pattern.source, pattern.flags + 'g');
  while ((m = re.exec(text)) !== null) matches.push(m[0]);
  return matches;
}

export interface AuditInput {
  claim: string;
  sourcePassage: string;
  sourceSection: string;
  tolerance?: number;
}

export function checkAbsoluteDifference(
  claimed: number, valueA: number, valueB: number, tolerance = DEFAULT_TOLERANCE
): { consistent: boolean; actual: number; unit: string } {
  const actual = Math.abs(valueA - valueB);
  const consistent = Math.abs(actual - claimed) <= tolerance;
  return { consistent, actual, unit: 'percentage_points' };
}

export function checkRelativeChange(
  claimed: number, oldVal: number, newVal: number, tolerance = DEFAULT_TOLERANCE
): { consistent: boolean; actual: number; unit: string } {
  if (oldVal === 0) return { consistent: false, actual: Infinity, unit: 'percent_relative' };
  const actual = ((newVal - oldVal) / oldVal) * 100;
  const consistent = Math.abs(actual - claimed) <= tolerance;
  return { consistent, actual, unit: 'percent_relative' };
}

export function checkMean(values: number[], claimed: number, tolerance = DEFAULT_TOLERANCE): { consistent: boolean; actual: number; unit: string } {
  if (values.length === 0) return { consistent: false, actual: NaN, unit: 'mean' };
  const actual = values.reduce((a, b) => a + b, 0) / values.length;
  const consistent = Math.abs(actual - claimed) <= tolerance;
  return { consistent, actual, unit: 'mean' };
}

// The 12.3% regression example from the spec
export function analyzeAccuracyImprovement(): NumericClaim {
  const gsm8k = [78.4, 70.1];
  const strategy = [71.2, 63.8];
  const math = [35.6, 28.9];

  const absGains = [
    gsm8k[0] - gsm8k[1],
    strategy[0] - strategy[1],
    math[0] - math[1],
  ];
  const meanAbsGain = absGains.reduce((a, b) => a + b, 0) / absGains.length;

  const relGains = absGains.map((g, i) => {
    const baseline = [gsm8k[1], strategy[1], math[1]][i];
    return (g / baseline) * 100;
  });
  const meanRelGain = relGains.reduce((a, b) => a + b, 0) / relGains.length;

  return {
    id: 'numeric-12pct',
    claim: 'AFR improves accuracy by 12.3% on average',
    sourcePassage: 'AFR improves accuracy by 12.3% on average compared to standard chain-of-thought prompting, while adding only 15% additional token overhead.',
    sourceSection: 'Abstract',
    passageValidated: true,
    extractedValues: [
      { label: 'GSM8K AFR', value: 78.4, unit: 'percent' },
      { label: 'GSM8K CoT', value: 70.1, unit: 'percent' },
      { label: 'StrategyQA AFR', value: 71.2, unit: 'percent' },
      { label: 'StrategyQA CoT', value: 63.8, unit: 'percent' },
      { label: 'MATH AFR', value: 35.6, unit: 'percent' },
      { label: 'MATH CoT', value: 28.9, unit: 'percent' },
      { label: 'Claimed average improvement', value: 12.3, unit: 'percent' },
    ],
    comparisonDirection: 'AFR vs CoT across 3 benchmarks',
    formula: 'Mean absolute gain = ( (78.4-70.1) + (71.2-63.8) + (35.6-28.9) ) / 3',
    deterministicResult: Number(meanAbsGain.toFixed(2)),
    expectedResult: 12.3,
    tolerance: DEFAULT_TOLERANCE,
    assessment: 'inconsistent',
    reason: `Mean absolute gain is ${meanAbsGain.toFixed(2)} percentage points, not 12.3%. The claimed value of 12.3% may represent relative improvement (mean ~${meanRelGain.toFixed(2)}%) or use a different aggregation method. Neither absolute nor relative calculation independently yields 12.3 without additional information.`,
  };
}

function roundToTolerance(val: number, decimals = 2): number {
  return Number(val.toFixed(decimals));
}

export function auditNumericClaims(
  claims: AuditInput[],
  paperText: string,
  paperHash: string,
  paperTitle: string
): NumericalAudit {
  const findings: NumericClaim[] = [];

  for (const input of claims) {
    const passageExists = paperText.includes(input.sourcePassage.trim().slice(0, 40));
    const tolerance = input.tolerance ?? DEFAULT_TOLERANCE;

    // Try to extract numeric patterns from the claim and source
    const claimNumbers = findInText(input.claim, /\d+\.?\d*/g).map(Number);
    const passageNumbers = findInText(input.sourcePassage, /\d+\.?\d*/g).map(Number);

    if (passageNumbers.length < 2) {
      findings.push({
        id: `numeric-${findings.length}`,
        claim: input.claim,
        sourcePassage: input.sourcePassage,
        sourceSection: input.sourceSection || 'Unknown',
        passageValidated: passageExists,
        extractedValues: [{ label: 'extracted', value: 0, unit: 'unknown' }],
        comparisonDirection: 'unknown',
        formula: 'Insufficient numeric data to verify',
        deterministicResult: null,
        expectedResult: null,
        tolerance,
        assessment: 'unable_to_verify',
        reason: 'Could not extract sufficient numeric values from the source passage.',
      });
      continue;
    }

    // Default: try mean consistency check on extracted numbers
    const primaryValues = passageNumbers.slice(0, Math.min(passageNumbers.length, 6));
    const claimedValue = claimNumbers[0];

    if (claimedValue && primaryValues.length >= 2) {
      const check = checkMean(primaryValues, claimedValue, tolerance);
      findings.push({
        id: `numeric-${findings.length}`,
        claim: input.claim,
        sourcePassage: input.sourcePassage,
        sourceSection: input.sourceSection || 'Unknown',
        passageValidated: passageExists,
        extractedValues: primaryValues.map((v, i) => ({
          label: `value_${i + 1}`,
          value: v,
          unit: 'unknown',
        })),
        comparisonDirection: 'extracted_values_vs_claim',
        formula: `Mean of [${primaryValues.join(', ')}]`,
        deterministicResult: roundToTolerance(check.actual),
        expectedResult: claimedValue,
        tolerance,
        assessment: check.consistent ? 'consistent' : 'inconsistent',
        reason: check.consistent
          ? `Computed mean ${roundToTolerance(check.actual)} matches claimed ${claimedValue} within tolerance ±${tolerance}.`
          : `Computed mean ${roundToTolerance(check.actual)} differs from claimed ${claimedValue} by ${Math.abs(roundToTolerance(check.actual) - claimedValue)} (tolerance ±${tolerance}).`,
      });
    } else {
      findings.push({
        id: `numeric-${findings.length}`,
        claim: input.claim,
        sourcePassage: input.sourcePassage,
        sourceSection: input.sourceSection || 'Unknown',
        passageValidated: passageExists,
        extractedValues: [],
        comparisonDirection: 'unknown',
        formula: 'Cannot verify',
        deterministicResult: null,
        expectedResult: null,
        tolerance,
        assessment: 'ambiguous',
        reason: 'Ambiguous or insufficient numeric data to determine consistency.',
      });
    }
  }

  return {
    paperHash,
    paperTitle,
    findings,
    generatedAt: Date.now(),
  };
}

export function getDemoNumericalAudit(): NumericalAudit {
  const baseClaim = analyzeAccuracyImprovement();
  return {
    paperHash: 'demo-paper-v1',
    paperTitle: 'Adaptive Failure Recovery for LLM Reasoning',
    findings: [
      baseClaim,
      {
        id: 'numeric-token-claim',
        claim: 'Only 15% additional token overhead',
        sourcePassage: 'Token usage increases by 15% on average compared to CoT.',
        sourceSection: 'Results, Section 5',
        passageValidated: true,
        extractedValues: [{ label: 'claimed overhead', value: 15, unit: 'percent' }],
        comparisonDirection: 'AFR token usage vs CoT',
        formula: 'Relative increase in average token count per query',
        deterministicResult: null,
        expectedResult: null,
        tolerance: DEFAULT_TOLERANCE,
        assessment: 'unable_to_verify',
        reason: 'The paper reports the percentage without providing absolute token counts per benchmark. Cannot verify without per-benchmark token data.',
      },
      {
        id: 'numeric-ablation-1',
        claim: 'Removing the Failure Detector reduces accuracy by 8.4 percentage points',
        sourcePassage: 'Removing the Failure Detector reduces accuracy by 8.4 percentage points. Removing the Recovery Generator reduces accuracy by 6.2 points. Removing the Path Selector reduces accuracy by 3.1 points.',
        sourceSection: 'Ablation Studies, Section 6',
        passageValidated: true,
        extractedValues: [
          { label: 'without detector', value: 8.4, unit: 'percentage_points' },
          { label: 'without generator', value: 6.2, unit: 'percentage_points' },
          { label: 'without selector', value: 3.1, unit: 'percentage_points' },
        ],
        comparisonDirection: 'ablation degradation in accuracy',
        formula: 'Absolute accuracy drop from removing each component',
        deterministicResult: 8.4,
        expectedResult: 8.4,
        tolerance: DEFAULT_TOLERANCE,
        assessment: 'consistent',
        reason: 'Absolute difference of 8.4 percentage points is self-consistent as reported. No ambiguous direction or unit issue.',
      },
    ],
    generatedAt: Date.now(),
  };
}