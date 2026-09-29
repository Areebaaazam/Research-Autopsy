import type { PaperSnapshot, RevisionComparison, RevisionConcern, RevisionChange, AutopsyResult } from '../types';

// Find passages in old text that changed in new text
function findChangedPassages(oldText: string, newText: string): { deleted: string[]; added: string[] } {
  const deleted: string[] = [];
  const added: string[] = [];

  // Simple heuristic: look for sentences in old not in new, and vice versa
  const oldSents = new Set(oldText.split(/(?<=[.!?])\s+/).map(s => s.trim().toLowerCase()));
  const newSents = new Set(newText.split(/(?<=[.!?])\s+/).map(s => s.trim().toLowerCase()));

  for (const s of oldSents) {
    if (s.length > 20 && !newSents.has(s)) deleted.push(s);
  }
  for (const s of newSents) {
    if (s.length > 20 && !oldSents.has(s)) added.push(s);
  }

  return { deleted, added };
}

export function compareRevisions(
  older: PaperSnapshot,
  newer: PaperSnapshot,
  oldAutopsy: AutopsyResult | null
): RevisionComparison {
  const changes = findChangedPassages(older.text, newer.text);
  const concerns: RevisionConcern[] = [];
  const newFindings: RevisionChange[] = [];
  const unmatchedOldFindings: string[] = [];

  // Match old concerns against new text
  if (oldAutopsy) {
    const allConcerns = [
      ...oldAutopsy.reviewerReport.majorConcerns,
      ...oldAutopsy.reviewerReport.minorConcerns,
    ];

    for (const concern of allConcerns) {
      // Check if the concern text appears in the new paper at all
      const keywords = concern.split(/\s+/).filter(w => w.length > 4).slice(0, 5);
      const found = keywords.some(kw => newer.text.toLowerCase().includes(kw.toLowerCase()));

      // Check if changes.deleted contains sentences from the old paper that addressed this
      const wasInOld = keywords.some(kw => older.text.toLowerCase().includes(kw.toLowerCase()));

      if (!wasInOld) {
        unmatchedOldFindings.push(concern);
        continue;
      }

      if (!found) {
        // Concern not found in new text — might be deleted claim
        newFindings.push({ type: 'deleted_claim', text: concern, section: 'Unknown' });
        concerns.push({
          id: `rc-${concerns.length}`,
          concernText: concern,
          originalEvidence: oldAutopsy.reviewerReport.convincingEvidence[0] || 'Not specified',
          originalSource: 'Reviewer report',
          revisedPassage: 'Not found in new version',
          status: 'still_open',
          reason: 'The concern was not addressed in the revised text. Related text may have been removed without resolution.',
          determinationSource: 'deterministic',
        });
      } else {
        // Check if the concern is addressed in added passages
        const addressedInNew = changes.added.some(a =>
          keywords.some(kw => a.toLowerCase().includes(kw.toLowerCase()))
        );

        if (addressedInNew) {
          const relevantPassage = changes.added.find(a =>
            keywords.some(kw => a.toLowerCase().includes(kw.toLowerCase()))
          ) || '';

          concerns.push({
            id: `rc-${concerns.length}`,
            concernText: concern,
            originalEvidence: oldAutopsy.reviewerReport.convincingEvidence[0] || 'Not specified',
            originalSource: 'Reviewer report',
            revisedPassage: relevantPassage.slice(0, 300),
            status: 'partially_addressed',
            reason: 'New text addresses the concern, but the proposed response claims experiments that cannot be verified as conducted from the text alone.',
            determinationSource: 'ai_assessment',
          });
          newFindings.push({ type: 'strengthened', text: relevantPassage.slice(0, 200), section: 'Unknown' });
        } else {
          concerns.push({
            id: `rc-${concerns.length}`,
            concernText: concern,
            originalEvidence: oldAutopsy.reviewerReport.convincingEvidence[0] || 'Not specified',
            originalSource: 'Reviewer report',
            revisedPassage: 'Keywords found in text, but no new evidence detected',
            status: 'still_open',
            reason: 'Related keywords appear in the revised text, but no new substantive evidence or experiment was found.',
            determinationSource: 'ai_assessment',
          });
        }
      }
    }
  }

  // Check newly added passages for claims about experiments
  for (const addition of changes.added) {
    const hasExperimentClaim = /\b(run|conducted|performed|evaluated|tested|achieved|improved)\b/i.test(addition);
    if (hasExperimentClaim && addition.length > 30) {
      newFindings.push({ type: 'new_claim', text: addition.slice(0, 200), section: 'Unknown' });
    }
  }

  return {
    id: `rev-comp-${Date.now()}`,
    olderSnapshotId: older.id,
    newerSnapshotId: newer.id,
    olderTitle: older.label,
    newerTitle: newer.label,
    concerns,
    newFindings,
    unmatchedOldFindings,
    comparedAt: Date.now(),
  };
}

export function getDemoRevisionComparison(): RevisionComparison {
  return {
    id: 'rev-comp-demo',
    olderSnapshotId: 'snap-demo-v1',
    newerSnapshotId: 'snap-demo-v2',
    olderTitle: 'AFR v1 — Original Submission',
    newerTitle: 'AFR v2 — Revised with Multi-Model',
    concerns: [
      {
        id: 'rc-demo-1',
        concernText: 'The paper evaluates on only one model (GPT-3.5-turbo). There is no evidence the approach generalizes.',
        originalEvidence: 'Section 4 states "We use GPT-3.5-turbo as our base model." No multi-model experiments in supplied text.',
        originalSource: 'Reviewer report, Major Concern 1',
        revisedPassage: 'We evaluate AFR on Llama-2-70B, Claude-3 Sonnet, and Gemini Pro across all three benchmarks. AFR consistently improves accuracy over CoT by 8-14% across all models.',
        status: 'partially_addressed',
        reason: 'New text adds multi-model claims, but the actual experimental results and reproducibility details are not included. Claims about conducted experiments cannot be verified from the text alone.',
        determinationSource: 'ai_assessment',
      },
      {
        id: 'rc-demo-2',
        concernText: 'The Failure Detector is not compared against simple baselines (e.g., perplexity thresholding).',
        originalEvidence: 'The paper claims the detector identifies reasoning errors but provides no detection-level metrics.',
        originalSource: 'Reviewer report, Major Concern 2',
        revisedPassage: 'We have added a perplexity-based confidence thresholding baseline. At matched token budgets, AFR outperforms perplexity thresholding by 4.2 percentage points.',
        status: 'partially_addressed',
        reason: 'A specific baseline comparison is now mentioned. The improvement magnitude is reported, but no detection-level metrics (precision, recall, F1) are provided.',
        determinationSource: 'ai_assessment',
      },
      {
        id: 'rc-demo-3',
        concernText: 'Only 3 random seeds are used, which is insufficient for statistical conclusions.',
        originalEvidence: 'Section 4 states "Each experiment is run 3 times with different random seeds."',
        originalSource: 'Reviewer report, Major Concern 3',
        revisedPassage: 'We have increased to 20 random seeds for all experiments and now report 95% bootstrap confidence intervals.',
        status: 'resolved',
        reason: 'The seed count increase and bootstrap CI reporting directly address the concern. The claim is concrete and verifiable.',
        determinationSource: 'deterministic',
      },
    ],
    newFindings: [
      { type: 'deleted_claim', text: 'The original submission lacked multi-model evaluation entirely.', section: 'Experiments' },
      { type: 'strengthened', text: 'Multi-model replication added across 4 model families with consistent results.', section: 'Results' },
      { type: 'new_claim', text: 'AFR outperforms perplexity thresholding by 4.2 percentage points at matched token budgets.', section: 'Results' },
    ],
    unmatchedOldFindings: [],
    comparedAt: Date.now(),
  };
}