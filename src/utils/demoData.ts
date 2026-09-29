import type { PaperAnalysis, ResearchGap, ExperimentPlan, AutopsyResult, ClaimEvidence, ExperimentBrief, ReviewerResponse, TimelineAnalysis, AdversarialAnalysis, StatisticalPowerAnalysis, RelatedWorkMatrix, ProfessorAnalysis, RebuttalLetter } from '../types';

const DEMO_HASH = 'demo-paper-v1';

export const DEMO_PAPER_TEXT = `Adaptive Failure Recovery for LLM Reasoning

Abstract: Large Language Models (LLMs) have demonstrated impressive reasoning capabilities through chain-of-thought prompting. However, when these models encounter reasoning failures - such as logical gaps, arithmetic errors, or contradictory premises - they typically fail silently or produce plausible-sounding but incorrect outputs. We propose Adaptive Failure Recovery (AFR), a novel framework that enables LLMs to detect their own reasoning failures and dynamically recover from them. AFR consists of three components: a Failure Detector that monitors reasoning quality, a Recovery Generator that produces alternative reasoning paths, and a Path Selector that chooses the most promising recovery strategy. We evaluate AFR on three reasoning benchmarks: GSM8K, StrategyQA, and MATH. Our results show that AFR improves accuracy by 12.3% on average compared to standard chain-of-thought prompting, while adding only 15% additional token overhead. We also conduct ablation studies showing that each component contributes meaningfully to overall performance.

1. Introduction

Large Language Models have achieved remarkable performance on a wide range of natural language reasoning tasks. Chain-of-thought (CoT) prompting has emerged as an effective technique for eliciting step-by-step reasoning from LLMs. However, a critical limitation remains: when LLMs make reasoning errors, they rarely detect or correct them. This is particularly problematic in high-stakes applications such as medical diagnosis, legal reasoning, and scientific analysis.

2. Related Work

Previous work has explored self-consistency decoding, which samples multiple reasoning paths and aggregates results. However, this approach is computationally expensive and does not address the fundamental issue of error detection. Verification-based methods have been proposed but typically require training separate verifier models. Our work differs by enabling the LLM itself to detect and recover from failures without external supervision.

3. Method

3.1 Failure Detector
The Failure Detector evaluates each reasoning step for potential errors. It checks for: (1) arithmetic inconsistencies, (2) logical contradictions, (3) information loss between steps, and (4) unfounded assumptions. Each step receives a confidence score, and steps below a threshold trigger recovery.

3.2 Recovery Generator
When a failure is detected, the Recovery Generator produces alternative reasoning paths from the last validated step. It uses constrained decoding to ensure the recovery path maintains consistency with previously established facts.

3.3 Path Selector
The Path Selector evaluates all available reasoning paths (original and recovered) and selects the one with the highest composite score based on coherence, completeness, and internal consistency.

4. Experimental Setup

We evaluate AFR on three datasets: GSM8K (math word problems), StrategyQA (binary questions requiring multi-step reasoning), and MATH (competition-level mathematics). We use GPT-3.5-turbo as our base model. We compare against: (1) Standard CoT, (2) Self-Consistency (k=5), (3) Self-Refine, and (4) our proposed AFR. Each experiment is run 3 times with different random seeds. We report accuracy and average token usage.

5. Results

AFR achieves 78.4% accuracy on GSM8K (vs 70.1% for CoT), 71.2% on StrategyQA (vs 63.8% for CoT), and 35.6% on MATH (vs 28.9% for CoT). Token usage increases by 15% on average compared to CoT. Self-Consistency achieves 74.2% on GSM8K but uses 4.8x more tokens. Self-Refine achieves 72.8% on GSM8K with 2.1x token overhead.

6. Ablation Studies

Removing the Failure Detector reduces accuracy by 8.4 percentage points. Removing the Recovery Generator reduces accuracy by 6.2 points. Removing the Path Selector reduces accuracy by 3.1 points. All components contribute to the overall performance.

7. Limitations

Our evaluation is limited to three reasoning benchmarks. The method has only been tested on GPT-3.5-turbo. The failure detector's threshold requires manual tuning. We have not evaluated on open-domain or multi-turn reasoning tasks. The additional 15% token overhead may be significant in cost-sensitive applications.

8. Conclusion and Future Work

We presented AFR, a framework for adaptive failure recovery in LLM reasoning. Future work includes extending to multi-modal reasoning, reducing token overhead through adaptive triggering, and evaluating on a wider range of models and tasks.`;

export const DEMO_ANALYSIS: PaperAnalysis = {
  mode: 'demo',
  paperVersion: {
    textHash: DEMO_HASH,
    analyzedAt: Date.now(),
    title: 'Adaptive Failure Recovery for LLM Reasoning'
  },
  title: 'Adaptive Failure Recovery for LLM Reasoning',
  abstract: 'Large Language Models (LLMs) have demonstrated impressive reasoning capabilities through chain-of-thought prompting. However, when these models encounter reasoning failures, they typically fail silently. We propose Adaptive Failure Recovery (AFR), a framework that enables LLMs to detect their own reasoning failures and dynamically recover from them.',
  researchProblem: 'LLMs fail silently when making reasoning errors, producing plausible-sounding but incorrect outputs without detection or correction.',
  researchQuestion: 'Can LLMs be enabled to detect their own reasoning failures and dynamically recover from them without external supervision?',
  hypothesis: 'A framework combining failure detection, recovery generation, and path selection will enable LLMs to improve reasoning accuracy by detecting and recovering from their own errors.',
  methodology: 'Proposed three-component framework (Failure Detector, Recovery Generator, Path Selector) evaluated on three reasoning benchmarks with comparative baselines and ablation studies.',
  datasets: ['GSM8K', 'StrategyQA', 'MATH'],
  models: ['GPT-3.5-turbo'],
  experimentalSetup: 'Evaluation on three reasoning benchmarks with 3 random seeds. Compared against Standard CoT, Self-Consistency (k=5), and Self-Refine.',
  evaluationMetrics: ['Accuracy', 'Token usage'],
  mainResults: 'AFR improves accuracy by 12.3% on average over CoT with only 15% token overhead. Ablations confirm each component contributes meaningfully.',
  claimedContributions: [
    'A novel framework for adaptive failure recovery in LLM reasoning',
    'Failure Detector that identifies reasoning errors without external supervision',
    'Recovery Generator that produces alternative reasoning paths',
    'Path Selector that chooses optimal recovery strategies',
    'Empirical demonstration of 12.3% average accuracy improvement'
  ],
  limitations: [
    'Limited to three reasoning benchmarks',
    'Only tested on GPT-3.5-turbo',
    'Failure detector threshold requires manual tuning',
    'Not evaluated on open-domain or multi-turn reasoning',
    '15% token overhead may impact cost-sensitive applications'
  ],
  futureWork: [
    'Extension to multi-modal reasoning',
    'Reducing token overhead through adaptive triggering',
    'Evaluation on wider range of models and tasks'
  ],
  importantCitations: [
    'Chain-of-Thought Prompting Elicits Reasoning in Large Language Models (Wei et al., 2022)',
    'Self-Consistency Improves Chain of Thought Reasoning in Language Models (Wang et al., 2022)',
    'Self-Refine: Iterative Refinement with Self-Feedback (Madaan et al., 2023)'
  ],
  evidenceBreakdown: [
    { claim: 'AFR improves accuracy by 12.3% on average', evidence: 'Section 5 reports 78.4% vs 70.1% on GSM8K, 71.2% vs 63.8% on StrategyQA, 35.6% vs 28.9% on MATH', sourceSection: 'Results, Section 5' },
    { claim: 'Only 15% additional token overhead', evidence: 'Section 5 states "Token usage increases by 15% on average compared to CoT"', sourceSection: 'Results, Section 5' },
    { claim: 'Each component contributes meaningfully', evidence: 'Section 6 ablation shows: -8.4% without detector, -6.2% without generator, -3.1% without selector', sourceSection: 'Ablation Studies, Section 6' }
  ]
};

export const DEMO_CLAIM_EVIDENCE: ClaimEvidence[] = [
  {
    id: 'ce-1',
    claim: 'AFR improves accuracy by 12.3% on average across benchmarks',
    supportingPassage: 'AFR achieves 78.4% accuracy on GSM8K (vs 70.1% for CoT), 71.2% on StrategyQA (vs 63.8% for CoT), and 35.6% on MATH (vs 28.9% for CoT).',
    passageValidated: true,
    evidenceType: 'numerical_result',
    assessment: 'supported',
    assessmentReason: 'Direct numerical comparison reported in Section 5 across all three benchmarks.',
    whatWouldHelp: 'Confidence intervals or significance tests would strengthen the claim.'
  },
  {
    id: 'ce-2',
    claim: 'Token overhead is only 15%',
    supportingPassage: 'Token usage increases by 15% on average compared to CoT.',
    passageValidated: true,
    evidenceType: 'direct_quotation',
    assessment: 'supported',
    assessmentReason: 'Directly stated in Section 5 with explicit percentage.',
    whatWouldHelp: 'Detailed token accounting per benchmark.'
  },
  {
    id: 'ce-3',
    claim: 'Failure Detector identifies reasoning errors without external supervision',
    supportingPassage: 'The Failure Detector evaluates each reasoning step for potential errors. It checks for: (1) arithmetic inconsistencies, (2) logical contradictions, (3) information loss between steps, and (4) unfounded assumptions.',
    passageValidated: true,
    evidenceType: 'method_description',
    assessment: 'partially_supported',
    assessmentReason: 'The detector design is described in Section 3.1, but no precision/recall metrics are reported. Ablation (-8.4% without detector) provides indirect evidence of utility.',
    whatWouldHelp: 'Precision, recall, and F1 scores for the detector against human-annotated reasoning steps.'
  },
  {
    id: 'ce-4',
    claim: 'Each component contributes meaningfully',
    supportingPassage: 'Removing the Failure Detector reduces accuracy by 8.4 percentage points. Removing the Recovery Generator reduces accuracy by 6.2 points. Removing the Path Selector reduces accuracy by 3.1 points.',
    passageValidated: true,
    evidenceType: 'numerical_result',
    assessment: 'supported',
    assessmentReason: 'Ablation study in Section 6 shows clear per-component contributions.',
    whatWouldHelp: 'Whether component interactions exist is not tested. A full factorial ablation would be more informative.'
  },
  {
    id: 'ce-5',
    claim: 'The method works without external supervision for failure detection',
    supportingPassage: 'Our work differs by enabling the LLM itself to detect and recover from failures without external supervision.',
    passageValidated: true,
    evidenceType: 'direct_quotation',
    assessment: 'unclear',
    assessmentReason: 'The claim is stated but the paper does not compare against external verifiers or show that the detector outperforms off-the-shelf confidence estimation.',
    whatWouldHelp: 'Comparison against perplexity-based thresholding or a trained verifier model.'
  }
];

export const DEMO_GAPS: ResearchGap[] = [
  {
    id: 'gap-1',
    title: 'Limited model generalization',
    description: 'The method is only evaluated on GPT-3.5-turbo, making it unclear whether the approach generalizes to other LLM architectures or sizes.',
    evidence: 'Section 4 states "We use GPT-3.5-turbo as our base model." No experiments on other models are reported.',
    evidenceValidated: true,
    gapType: 'paper_limitation',
    whyItMatters: 'The effectiveness of failure detection and recovery may depend on model-specific properties such as training data, architecture, or scale.',
    explicitlyAcknowledged: true,
    potentialDirection: 'Evaluate AFR across multiple model families (e.g., Llama, Claude, Gemini) and scales (7B to 70B+ parameters).',
    confidenceLevel: 'High'
  },
  {
    id: 'gap-2',
    title: 'No evaluation on open-domain reasoning',
    description: 'The paper evaluates only on closed-form reasoning benchmarks and does not test open-domain or multi-turn conversational reasoning.',
    evidence: 'Section 7 acknowledges: "We have not evaluated on open-domain or multi-turn reasoning tasks."',
    evidenceValidated: true,
    gapType: 'paper_limitation',
    whyItMatters: 'Open-domain reasoning introduces additional challenges including information retrieval, source credibility assessment, and maintaining context over long interactions.',
    explicitlyAcknowledged: true,
    potentialDirection: 'Extend AFR to retrieval-augmented generation (RAG) scenarios and multi-turn conversational reasoning.',
    confidenceLevel: 'High'
  },
  {
    id: 'gap-3',
    title: 'Manual threshold tuning',
    description: 'The Failure Detector relies on a manually tuned threshold for triggering recovery, but the paper does not analyze sensitivity to this parameter.',
    evidence: 'Section 7 notes: "The failure detector\'s threshold requires manual tuning." No ablation on threshold values is provided in Section 6.',
    evidenceValidated: true,
    gapType: 'paper_limitation',
    whyItMatters: 'Manual tuning limits practical deployment and raises questions about robustness: small threshold changes could significantly impact performance.',
    explicitlyAcknowledged: true,
    potentialDirection: 'Develop adaptive thresholding or learn the confidence threshold from validation data.',
    confidenceLevel: 'Moderate'
  },
  {
    id: 'gap-4',
    title: 'Unclear failure type distribution',
    description: 'The paper does not analyze what types of failures are most commonly detected or which types the method recovers from most successfully.',
    evidence: 'Section 3.1 lists four failure types (arithmetic, logical, information loss, unfounded assumptions) but Section 5 provides no breakdown by failure category.',
    evidenceValidated: true,
    gapType: 'paper_limitation',
    whyItMatters: 'Understanding which failures are detected and recoverable would guide future improvements and help identify systematic weaknesses.',
    explicitlyAcknowledged: false,
    potentialDirection: 'Perform categorical failure analysis across datasets to identify failure type distributions and recovery success rates.',
    confidenceLevel: 'Moderate'
  },
  {
    id: 'gap-5',
    title: 'No analysis of false positives in failure detection',
    description: 'The Failure Detector may flag correct reasoning as erroneous (false positives), but the paper does not report precision, recall, or false positive rates.',
    evidence: 'The paper reports overall accuracy improvements but does not include detection-level metrics.',
    evidenceValidated: true,
    gapType: 'paper_limitation',
    whyItMatters: 'High false positive rates would waste token budget on unnecessary recoveries and could degrade performance if correct reasoning is replaced.',
    explicitlyAcknowledged: false,
    potentialDirection: 'Measure and report failure detector precision, recall, and F1 against human-annotated reasoning step correctness.',
    confidenceLevel: 'Moderate'
  }
];

export const DEMO_EXPERIMENT_PLAN: ExperimentPlan = {
  description: 'Compare baseline Chain-of-Thought against adaptive intervention across GSM8K and SVAMP. Measure accuracy and token usage.',
  healthScore: 58,
  healthScoreLabel: 'Qualitative estimate. 58/100 indicates several moderate concerns that should be addressed.',
  criticalIssues: [
    { severity: 'critical', description: 'Only one base model tested (GPT-3.5-turbo) - cannot assess model independence' },
    { severity: 'critical', description: 'No control condition that isolates the adaptive mechanism from the base model improvement' },
    { severity: 'warning', description: 'Token efficiency is not normalized - 15% overhead reported without considering accuracy gain per token' },
    { severity: 'warning', description: 'Only 3 random seeds - insufficient for statistical significance testing' },
    { severity: 'warning', description: 'No confidence intervals or statistical significance tests reported' },
    { severity: 'info', description: 'Dataset size and difficulty distribution not characterized' },
    { severity: 'info', description: 'No human evaluation of recovery quality' }
  ],
  recommendedExperiments: [
    { id: 'EXP-01', name: 'Standard CoT Baseline', description: 'Standard chain-of-thought prompting without any failure recovery' },
    { id: 'EXP-02', name: 'Remove Adaptive Component', description: 'AFR without the adaptive triggering - always recover from every step' },
    { id: 'EXP-03', name: 'Random Intervention Control', description: 'Replace learned detector with random triggering at same frequency' },
    { id: 'EXP-04', name: 'Full AFR', description: 'Complete adaptive failure recovery framework' },
    { id: 'EXP-05', name: 'Multi-Model Replication', description: 'Repeat all experiments on Llama-2-70B, Claude-3, and Gemini-Pro' },
    { id: 'EXP-06', name: 'Statistical Power Analysis', description: 'Run 10+ seeds with bootstrap confidence intervals' }
  ],
  experimentMatrix: [
    ['Experiment', 'Model', 'Dataset', 'Metric', 'Seeds', 'Control'],
    ['EXP-01', 'GPT-3.5-turbo', 'GSM8K', 'Accuracy', '10', 'N/A'],
    ['EXP-02', 'GPT-3.5-turbo', 'GSM8K', 'Accuracy + Tokens', '10', 'Fixed recovery rate'],
    ['EXP-03', 'GPT-3.5-turbo', 'GSM8K', 'Accuracy + Tokens', '10', 'Random trigger'],
    ['EXP-04', 'GPT-3.5-turbo', 'GSM8K', 'Accuracy + Tokens', '10', 'Full AFR'],
    ['EXP-05', 'Llama-2-70B', 'GSM8K', 'Accuracy + Tokens', '10', 'All conditions'],
  ]
};

export const DEMO_EXPERIMENT_BRIEFS: ExperimentBrief[] = [
  {
    id: 'eb-1',
    concernReference: 'Limited model generalization (GAP-01)',
    hypothesis: 'AFR may not generalize to other model families (Llama, Claude) beyond GPT-3.5-turbo.',
    proposedTest: 'Run identical AFR experiments on Llama-2-70B, Claude-3 Sonnet, and Gemini Pro using the GSM8K and MATH datasets.',
    baselineComparison: 'Standard CoT on each model + Self-Consistency (k=5) on each model.',
    controls: 'Same prompts, same temperature (0), same random seeds across models.',
    confounders: 'API versions, tokenizer differences, and decoding parameters may vary across model providers.',
    measurementCriteria: 'Accuracy per model, token usage per model, relative improvement over CoT baseline.',
    outcomesWouldSupport: 'Consistent accuracy improvement (>=5%) across all three model families.',
    outcomesWouldWeaken: 'Improvement on only one model family, or degradation on any model family.',
    estimatedEffort: 'Approximately 2-3 weeks for API integration, experiment execution, and analysis.',
    assumptions: 'Claims that the public API versions of these models are comparable to the version used in the paper.',
    unknownDetails: 'Exact API costs, rate limits, and whether all models support the required prompt formats.',
    status: 'planned',
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now()
  }
];

export const DEMO_REVIEWER_RESPONSES: ReviewerResponse[] = [
  {
    id: 'rr-1',
    concern: 'Only one model evaluated (GPT-3.5-turbo) — no evidence of generalization.',
    relevantEvidence: 'Section 4 states "We use GPT-3.5-turbo as our base model." No multi-model experiments in supplied text.',
    proposedResponse: 'We will run experiments on Llama-2-70B, Claude-3, and Gemini Pro to demonstrate generalization.',
    requiredExperimentOrRevision: 'Multi-model replication study as described in Experiment Brief EB-01.',
    status: 'planned',
    workCompleted: false,
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now()
  },
  {
    id: 'rr-2',
    concern: 'Failure Detector not compared against simple baselines (e.g., perplexity thresholding).',
    relevantEvidence: 'The paper claims the detector identifies reasoning errors but provides no detection-level metrics or baseline comparisons.',
    proposedResponse: 'We will add a perplexity-based confidence thresholding baseline and report precision/recall for the Failure Detector.',
    requiredExperimentOrRevision: 'Add detection-level evaluation with human-annotated reasoning step quality as ground truth.',
    status: 'planned',
    workCompleted: false,
    createdAt: Date.now() - 43200000,
    updatedAt: Date.now()
  }
];

export const DEMO_AUTOPSY: AutopsyResult = {
  failureRisks: [
    {
      severity: 'HIGH',
      title: 'Potential dataset artifact exploitation',
      explanation: 'GSM8K and StrategyQA may contain artifacts that the Failure Detector learns to exploit rather than genuinely detecting reasoning failures.',
      couldInvalidate: 'If AFR exploits dataset artifacts rather than performing genuine failure detection, the method would not generalize to new problem distributions.',
      rulingOutExperiment: 'Run AFR on adversarially constructed problems designed to eliminate surface-level patterns. Test on out-of-distribution problems.'
    },
    {
      severity: 'HIGH',
      title: 'Failure detector may be a proxy for confidence',
      explanation: 'The Failure Detector may simply be measuring the model\'s confidence or perplexity rather than genuinely detecting reasoning failures.',
      couldInvalidate: 'The claimed novelty would be significantly reduced if it reduces to confidence estimation.',
      rulingOutExperiment: 'Compare against a simple perplexity-based baseline. If similar performance, the detector adds no value beyond confidence estimation.'
    },
    {
      severity: 'MEDIUM',
      title: 'Token overhead comparison is misleading',
      explanation: 'Self-Consistency uses 4.8x more tokens but achieves 74.2% vs AFR\'s 78.4% on GSM8K. The paper does not explore the accuracy/token trade-off at multiple operating points.',
      couldInvalidate: 'If Self-Consistency with fewer samples achieves similar accuracy at comparable token cost, the advantage diminishes.',
      rulingOutExperiment: 'Plot accuracy vs token budget curves for all methods at k=2,3,5,10.'
    },
    {
      severity: 'MEDIUM',
      title: 'Recovery may degrade correct reasoning',
      explanation: 'If the Failure Detector has false positives, recovery may replace correct reasoning with incorrect alternatives.',
      couldInvalidate: 'Net accuracy improvement could mask cases where recovery actively harms performance.',
      rulingOutExperiment: 'Measure accuracy on the subset of problems where recovery was triggered vs not triggered.'
    },
    {
      severity: 'LOW',
      title: 'Limited external validity',
      explanation: 'Evaluation on three benchmarks may not reflect real-world performance.',
      couldInvalidate: 'Benchmark performance may overestimate real-world utility.',
      rulingOutExperiment: 'Create a fresh evaluation set of novel reasoning problems.'
    }
  ],
  reviewerReport: {
    overallScore: 5.5,
    scoreLabel: 'Qualitative estimate: 5.5/10 — moderate concerns. The research addresses a genuine problem but has significant methodological gaps.',
    majorConcerns: [
      'The paper evaluates on only one model (GPT-3.5-turbo). There is no evidence the approach generalizes.',
      'The Failure Detector is not compared against simple baselines (e.g., perplexity thresholding).',
      'Only 3 random seeds are used, which is insufficient for reliable conclusions.',
      'The paper claims "detection" but provides no precision/recall metrics for the detector.',
      'Token overhead comparisons against Self-Consistency use only k=5, which may not be a fair comparison point.'
    ],
    minorConcerns: [
      'The ablation study (Section 6) is brief and does not report statistical significance.',
      'Manual threshold tuning limits reproducibility and practical deployment.',
      'No analysis of which problem types benefit most from the approach.',
      'Related work discussion omits several relevant verification-based approaches.'
    ],
    questions: [
      'How do you know the Failure Detector is detecting reasoning failures rather than problem difficulty?',
      'What is the per-problem variance in recovery success? Are some problems systematically unrecoverable?',
      'How was the detection threshold tuned? Was it optimized on the test set?',
      'Does the method work equally well for arithmetic, logical, and commonsense reasoning?'
    ],
    convincingEvidence: [
      'A multi-model replication across 3+ model families showing consistent improvements.',
      'Precision and recall metrics for the Failure Detector against human-annotated reasoning step quality.',
      'Statistical significance tests (e.g., bootstrap or paired t-test) with effect sizes.',
      'Analysis of per-problem outcomes showing net benefit over a range of detection thresholds.',
      'Comparison against a confidence-thresholding baseline that matches token budget.'
    ],
    strengtheningAdvice: [
      'Run experiments on at least 3 model families (open-source and API-based).',
      'Add a simple baseline: thresholding on token-level log probabilities.',
      'Increase to 10+ random seeds and report confidence intervals.',
      'Report precision, recall, and F1 for the Failure Detector component.',
      'Include a cost-benefit analysis: accuracy gain per additional token.',
      'Add an analysis of failure modes: when does AFR help vs hurt?',
      'Make the detection threshold adaptive or show robustness across threshold values.'
    ]
  }
};

export const DEMO_NEXT_STEPS = {
  fixFirst: [
    'Add multi-model evaluation (Llama, Claude, Gemini) to establish generalizability',
    'Include perplexity-based thresholding as a baseline for the Failure Detector',
    'Increase random seeds from 3 to at least 10 with statistical significance testing',
    'Report precision and recall of the Failure Detector component'
  ],
  investigate: [
    'Analyze failure type distribution across datasets and models',
    'Measure false positive rate of the Failure Detector and its impact on overall accuracy',
    'Characterize problems where AFR degrades performance',
    'Compare accuracy per token across all methods at multiple operating points'
  ],
  strongAreas: [
    'The three-component architecture (detector, generator, selector) is well-motivated',
    'Ablation study clearly shows each component contributes',
    'Token overhead (15%) is modest compared to Self-Consistency (4.8x)',
    'The research addresses a genuine problem in LLM reasoning'
  ],
  experimentsToRun: [
    'EXP-01: Standard CoT baseline with 10 seeds',
    'EXP-02: Perplexity-based threshold baseline',
    'EXP-03: AFR on Llama-2-70B and Claude-3',
    'EXP-04: False positive rate analysis with human annotation',
    'EXP-05: Cost-benefit curves across token budgets'
  ],
  literatureToInvestigate: [
    'Self-Consistency and ensemble methods for LLM reasoning',
    'Verification-based approaches (e.g., VERIFY, Self-Check)',
    'Confidence estimation and calibration in LLMs',
    'Recent work on process reward models and step-level verification',
    'Out-of-distribution detection methods applied to model generations'
  ]
};

export const DEMO_TIMELINE: TimelineAnalysis = {
  events: [
    { id: 'tl-1', date: '2024-09', type: 'submission', label: 'Initial submission to NeurIPS 2024', description: 'AFR paper submitted to NeurIPS main conference track.', confidence: 100 },
    { id: 'tl-2', date: '2024-10', type: 'rejection', label: 'Desk reject — scope concerns', description: 'Paper rejected without review. Editor cited scope concerns about contribution to general ML methods.' },
    { id: 'tl-3', date: '2024-11', type: 'insight', label: 'Added ablation on detection threshold', description: 'Authors added sensitivity analysis for the failure detector threshold parameter.', confidence: 85 },
    { id: 'tl-4', date: '2025-01', type: 'experiment', label: 'Multi-model replication launched', description: 'Expanded evaluation to Llama-2-70B, Claude-3, and Gemini-Pro.' },
    { id: 'tl-5', date: '2025-02', type: 'submission', label: 'Resubmission to ICLR 2025', description: 'Revised paper with multi-model experiments and threshold analysis.' },
    { id: 'tl-6', date: '2025-03', type: 'rebuttal', label: 'Reviewer rebuttal phase', description: 'Three reviewers raised concerns about baseline comparisons and statistical significance.' },
    { id: 'tl-7', date: '2025-04', type: 'revision', label: 'Major revision requested', description: 'AE recommended major revisions: add statistical tests, human evaluation, and more baselines.' },
    { id: 'tl-8', date: '2025-05', type: 'insight', label: 'False positive analysis completed', description: 'Authors completed precision/recall analysis of failure detector against human annotations.', confidence: 75 },
  ],
  rebuttalPredictions: [
    {
      concern: 'Only one model evaluated in original submission',
      strength: 'strong',
      predictedOutcome: 'needs_revision',
      reasoning: 'Multi-model experiments partially address this, but reviewers may want broader coverage (open-source + API models).',
      suggestedApproach: 'Present the multi-model data prominently. Acknowledge remaining gaps and propose as future work.'
    },
    {
      concern: 'Statistical significance not established',
      strength: 'strong',
      predictedOutcome: 'needs_revision',
      reasoning: 'Without confidence intervals or p-values, reviewers will remain skeptical about the 12.3% improvement claim.',
      suggestedApproach: 'Run bootstrapped statistical tests. Report 95% confidence intervals for all main results.'
    },
    {
      concern: 'Failure detector may be measuring confidence, not reasoning failures',
      strength: 'moderate',
      predictedOutcome: 'likely_accepted',
      reasoning: 'The ablation study provides indirect evidence that the detector adds value, but a direct comparison against perplexity thresholding would address this fully.',
      suggestedApproach: 'Add the perplexity baseline experiment and include a discussion of what the detector captures vs. confidence.'
    },
    {
      concern: 'Limited real-world evaluation',
      strength: 'weak',
      predictedOutcome: 'likely_accepted',
      reasoning: 'Benchmark evaluations are standard for this area. Reviewers may request one additional realistic task but will likely accept the current scope.',
      suggestedApproach: 'Propose one additional evaluation on a realistic task (e.g., medical QA with known failure modes).'
    }
  ],
  overallOutlook: 'The paper addresses a genuine problem with a well-motivated approach. The multi-model replication significantly strengthens the claims. The main risk is statistical rigor — reviewers in this area increasingly expect confidence intervals and effect sizes. With those additions, acceptance probability is approximately 65-70%.'
};

export const DEMO_ADVERSARIAL: AdversarialAnalysis = {
  cases: [
    {
      id: 'adv-1',
      category: 'Adversarial perturbation',
      attack: 'Introduce systematic arithmetic errors in the first reasoning step, then provide correct subsequent steps. The failure detector must catch the initial error despite the coherent continuation.',
      paperDefense: 'The Failure Detector checks each step independently for arithmetic inconsistencies (Section 3.1). A single-step error should be flagged even if subsequent steps are consistent.',
      vulnerability: 'medium',
      explanation: 'If the detector only checks pairwise consistency between adjacent steps, a single early error with consistent later steps may evade detection.'
    },
    {
      id: 'adv-2',
      category: 'Distribution shift',
      attack: 'Present problems with unfamiliar notation or formatting (e.g., reverse Polish notation for math, or questions written in passive voice with multiple negations).',
      paperDefense: 'The method uses the same LLM for detection and generation, so it should handle varied surface forms.',
      vulnerability: 'high',
      explanation: 'The paper evaluates only on standard benchmarks (GSM8K, StrategyQA, MATH) with typical formatting. Unfamiliar notation could trigger different failure patterns.'
    },
    {
      id: 'adv-3',
      category: 'Confusing recovery',
      attack: 'Provide a plausible but incorrect reasoning path that the generator might select during recovery. The path should be internally consistent but lead to a wrong answer.',
      paperDefense: 'The Path Selector evaluates coherence, completeness, and internal consistency. An incorrect but internally consistent path could still be selected.',
      vulnerability: 'medium',
      explanation: 'The Path Selector does not have access to ground-truth answers. It can only evaluate relative quality of available paths.'
    },
    {
      id: 'adv-4',
      category: 'Token budget exploitation',
      attack: 'Generate reasoning paths that deliberately use more tokens than necessary to consume the token budget allocated for recovery.',
      paperDefense: 'The 15% token overhead is an average; individual cases may vary. No explicit defense against adversarial token usage.',
      vulnerability: 'low',
      explanation: 'This is a practical concern but unlikely to affect correctness. The method still produces answers; it just costs more tokens.'
    },
    {
      id: 'adv-5',
      category: 'Calibration attack',
      attack: 'Create problems where the model is confidently wrong (high token probabilities for incorrect reasoning). The detector relies on confidence scores below a threshold.',
      paperDefense: 'The detector checks for arithmetic inconsistencies, logical contradictions, information loss, and unfounded assumptions — not just confidence.',
      vulnerability: 'high',
      explanation: 'If the model is confidently wrong, all four detection criteria may pass because the incorrect reasoning is internally self-consistent. This is the most serious vulnerability.'
    },
  ],
  overallResilience: 'moderate',
  weakestAreas: ['Calibration attack (confidently wrong reasoning)', 'Distribution shift (unfamiliar notation)'],
  strongestAreas: ['Token budget exploitation', 'Simple arithmetic errors']
};

export const DEMO_POWER: StatisticalPowerAnalysis = {
  analysis: [
    { parameter: 'Number of seeds', value: '3 (current)', result: 'Power: 0.32 — only 32% chance of detecting a medium effect (d=0.5)', interpretation: 'Severely underpowered. High risk of false negatives and unreliable estimates.' },
    { parameter: 'Number of seeds', value: '10', result: 'Power: 0.68 — 68% chance of detecting medium effect', interpretation: 'Minimum acceptable. Provides reasonable protection against Type II errors.' },
    { parameter: 'Number of seeds', value: '20', result: 'Power: 0.88 — 88% chance of detecting medium effect', interpretation: 'Recommended. Balances computational cost with statistical rigor.' },
    { parameter: 'Effect size (d)', value: '0.8 (large)', result: 'Power: 0.95 with n=10 seeds', interpretation: 'Large effects are well-powered even with modest seeds.' },
    { parameter: 'Effect size (d)', value: '0.3 (small)', result: 'Power: 0.21 with n=10 seeds', interpretation: 'The experiment cannot reliably detect small effects.' },
    { parameter: 'Alpha (significance)', value: '0.05 → 0.005', result: 'Power drops from 0.68 to 0.31 with n=10', interpretation: 'Stricter alpha (recommended by Nature) requires larger n.' },
  ],
  recommendation: 'Run experiments with at least 20 random seeds. Report both 95% confidence intervals and effect sizes. Consider using bootstrap resampling for robustness. If computational cost is prohibitive, run 10 seeds but explicitly report the power limitations.',
  simulationParams: { nSeeds: 20, effectSize: 0.5, power: 0.88, alpha: 0.05 }
};

export const DEMO_RELATED_WORK: RelatedWorkMatrix = {
  entries: [
    { citation: 'Wei et al. (2022) — Chain-of-Thought Prompting', method: 'Step-by-step reasoning prompts', task: 'Math, commonsense, symbolic reasoning', keyDifference: 'Single-path reasoning, no failure detection or recovery', performance: 'Baseline (70.1% on GSM8K)' },
    { citation: 'Wang et al. (2022) — Self-Consistency', method: 'Sample multiple reasoning paths, majority vote', task: 'Math, commonsense reasoning', keyDifference: 'Computationally expensive (4.8x tokens). No failure detection.', performance: '74.2% on GSM8K (k=5)' },
    { citation: 'Madaan et al. (2023) — Self-Refine', method: 'Iterative refinement with self-feedback', task: 'Dialogue, code generation, math', keyDifference: 'Refines entire output iteratively; no targeted recovery from specific failure steps', performance: '72.8% on GSM8K (2.1x tokens)' },
    { citation: 'Kojima et al. (2022) — Zero-shot CoT', method: '"Let\'s think step by step" prompt', task: 'Math, reasoning', keyDifference: 'No mechanism for error detection or recovery', performance: '~65% on GSM8K' },
    { citation: 'Lightman et al. (2023) — Process Reward Models', method: 'Train separate verifier on step-level correctness', task: 'Math reasoning', keyDifference: 'Requires training data of step-level correctness. External verifier.', performance: 'State-of-the-art on MATH' },
  ],
  summary: 'The paper positions itself between self-consistency (which is expensive but doesn\'t detect errors) and process reward models (which detect errors but require separate training). The key differentiator is self-supervised failure detection without external training.',
  suggestedComparisons: [
    'Compare against a simple perplexity-based confidence thresholding baseline',
    'Compare against a process reward model baseline (e.g., Lightman et al.) on the same benchmarks',
    'Compare token efficiency at iso-accuracy points across all methods'
  ]
};

export const DEMO_PROFESSOR: ProfessorAnalysis = {
  executiveSummary: 'This paper proposes Adaptive Failure Recovery (AFR), a framework that enables LLMs to detect their own reasoning errors and recover without external supervision. The core idea is timely and well-motivated, but the experimental validation has significant statistical weaknesses that would concern any rigorous reviewer.',
  whyThisMatters: 'LLMs are increasingly deployed in high-stakes applications (medical diagnosis, legal reasoning). The ability to self-detect and recover from errors is critical for trustworthy AI. Current methods either cannot detect errors or require expensive external verification.',
  fatalFlaws: [
    'Statistical power: only 3 random seeds is fundamentally inadequate for reliable conclusions',
    'Single model evaluation: claims about a general-purpose framework tested on only one model are unsubstantiated',
    'No comparison against the simplest baseline: perplexity-based thresholding would establish whether the failure detector adds value beyond confidence estimation'
  ],
  citabilityScores: [
    { dimension: 'Problem Significance', score: 9, maxScore: 10, explanation: 'Self-detection of reasoning errors is widely recognized as a critical open problem.' },
    { dimension: 'Methodological Soundness', score: 5, maxScore: 10, explanation: 'The architecture is well-designed but the evaluation protocol is statistically weak.' },
    { dimension: 'Experimental Rigor', score: 4, maxScore: 10, explanation: 'Insufficient seeds, no confidence intervals, no power analysis, single model.' },
    { dimension: 'Novelty', score: 7, maxScore: 10, explanation: 'Self-supervised failure detection without external training is genuinely novel, though the components themselves are not individually new.' },
    { dimension: 'Reproducibility', score: 6, maxScore: 10, explanation: 'Method is clearly described but threshold details and model version are underspecified.' },
    { dimension: 'Clarity of Writing', score: 8, maxScore: 10, explanation: 'Well-structured, clear motivation, appropriate level of detail.' },
    { dimension: 'Related Work Coverage', score: 6, maxScore: 10, explanation: 'Covers CoT, self-consistency, and self-refine. Omits process reward models and verification-based methods.' },
    { dimension: 'Broader Impact', score: 8, maxScore: 10, explanation: 'High potential impact for safe deployment of LLMs in critical applications.' },
  ],
  overallVerdict: 'Publishable at a good venue AFTER major revisions addressing statistical rigor and baseline comparisons. The core idea is strong and timely; the current evaluation does not yet do it justice.',
  howToMakeItPublishable: [
    'Run experiments on at least 3 model families with 20+ random seeds each',
    'Report 95% confidence intervals and effect sizes for all main results',
    'Add perplexity-based thresholding as a baseline',
    'Include a failure case analysis — when does AFR hurt performance?',
    'Add a comparison against process reward models on the MATH benchmark',
    'Make the detection threshold adaptive or provide a sensitivity analysis'
  ]
};

export const DEMO_REBUTTAL: RebuttalLetter = {
  editorSalutation: 'Dear Area Editor and Reviewers,',
  opening: 'We thank the reviewers for their constructive feedback, which has substantially strengthened this work. Below we address each concern point by point and describe the changes made in the revised manuscript.',
  pointByPoint: [
    {
      concern: 'R1: The paper evaluates on only one model (GPT-3.5-turbo). There is no evidence the approach generalizes.',
      response: 'We agree this was a significant limitation. In the revised manuscript, we have added comprehensive experiments on Llama-2-70B, Claude-3 Sonnet, and Gemini Pro across all three benchmarks. AFR consistently improves accuracy over CoT by 8-14% across all models (see Table 2). While the magnitude varies, the pattern holds.',
      changesMade: 'Added Section 5.2: Multi-Model Generalization. Added Table 2 with results across 4 model families.',
      confidence: 'high'
    },
    {
      concern: 'R2: The Failure Detector is not compared against simple baselines such as perplexity thresholding.',
      response: 'We have added a perplexity-based confidence thresholding baseline. At matched token budgets, AFR outperforms perplexity thresholding by 4.2 percentage points on GSM8K. Furthermore, we now report precision, recall, and F1 for the Failure Detector against human-annotated step correctness (Section 6.2).',
      changesMade: 'Added Section 6.2: Comparison with Confidence Baselines. Added detection-level metrics (precision, recall, F1).',
      confidence: 'high'
    },
    {
      concern: 'R3: Only 3 random seeds are insufficient for statistical conclusions.',
      response: 'We have increased to 20 random seeds for all experiments and now report 95% bootstrap confidence intervals. All reported improvements are statistically significant at p < 0.01 (paired bootstrap test). Full results are in Appendix A.',
      changesMade: 'Added bootstrap confidence intervals to all results. Added Appendix A with per-seed breakdown.',
      confidence: 'high'
    },
    {
      concern: 'R1: Token overhead comparison against Self-Consistency uses only k=5.',
      response: 'We have added comparisons at k=2,3,5,10 for Self-Consistency. Figure 3 shows accuracy vs token budget curves. AFR dominates Self-Consistency at all token budgets up to 5x overhead.',
      changesMade: 'Added Figure 3: Accuracy vs Token Budget comparison across operating points.',
      confidence: 'moderate'
    },
  ],
  closing: 'We believe these revisions comprehensively address the reviewers\' concerns and significantly strengthen the paper. We respectfully request the AE\'s consideration for acceptance.',
};