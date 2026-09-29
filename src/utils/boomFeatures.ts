import type { ResearchGraphData, PCMeeting, PCReviewer, Roadmap, PaperAlignment, AlignmentIssue } from '../types';

// ===== 1. RESEARCH GRAPH INTELLIGENCE =====
export const DEMO_RESEARCH_GRAPH: ResearchGraphData = {
  nodes: [
    { id: 'paper-afr', label: 'Adaptive Failure Recovery (AFR)', type: 'paper', connections: ['method-cot', 'method-sc', 'method-refine', 'concept-ed', 'concept-rg', 'dataset-gsm', 'dataset-strat', 'dataset-math'] },
    { id: 'method-cot', label: 'Chain-of-Thought', type: 'method', connections: ['paper-afr', 'paper-cot'] },
    { id: 'paper-cot', label: 'Wei et al. 2022 — CoT', type: 'paper', connections: ['method-cot'] },
    { id: 'method-sc', label: 'Self-Consistency', type: 'method', connections: ['paper-afr', 'paper-sc'] },
    { id: 'paper-sc', label: 'Wang et al. 2022 — Self-Consistency', type: 'paper', connections: ['method-sc'] },
    { id: 'method-refine', label: 'Self-Refine', type: 'method', connections: ['paper-afr', 'paper-refine'] },
    { id: 'paper-refine', label: 'Madaan et al. 2023 — Self-Refine', type: 'paper', connections: ['method-refine'] },
    { id: 'concept-ed', label: 'Error Detection', type: 'concept', connections: ['paper-afr', 'method-prm'] },
    { id: 'method-prm', label: 'Process Reward Models', type: 'method', connections: ['concept-ed', 'paper-prm'] },
    { id: 'paper-prm', label: 'Lightman et al. 2023 — PRM', type: 'paper', connections: ['method-prm'] },
    { id: 'concept-rg', label: 'Recovery Generation', type: 'concept', connections: ['paper-afr'] },
    { id: 'dataset-gsm', label: 'GSM8K', type: 'dataset', connections: ['paper-afr'] },
    { id: 'dataset-strat', label: 'StrategyQA', type: 'dataset', connections: ['paper-afr'] },
    { id: 'dataset-math', label: 'MATH', type: 'dataset', connections: ['paper-afr', 'paper-prm'] },
  ],
  edges: [
    { from: 'paper-afr', to: 'method-cot', label: 'improves upon', type: 'extends', provenance: 'sourced', sourceReference: 'Results Section 5 — AFR improves over CoT by 8.3pp on GSM8K' },
    { from: 'paper-afr', to: 'method-sc', label: 'more efficient than', type: 'contrasts', provenance: 'sourced', sourceReference: 'Results Section 5 — AFR uses 15% overhead vs 4.8x for Self-Consistency' },
    { from: 'paper-afr', to: 'method-refine', label: 'related approach', type: 'cites', provenance: 'sourced', sourceReference: 'Related Work Section 2 — discusses Self-Refine' },
    { from: 'paper-afr', to: 'method-prm', label: 'different paradigm', type: 'contrasts', provenance: 'inferred', sourceReference: 'Not explicitly compared in supplied text — inferred from methodology difference' },
    { from: 'method-cot', to: 'paper-cot', label: 'introduced by', type: 'cites', provenance: 'sourced', sourceReference: 'Citation in paper' },
    { from: 'method-sc', to: 'paper-sc', label: 'introduced by', type: 'cites', provenance: 'sourced', sourceReference: 'Citation in paper' },
    { from: 'method-refine', to: 'paper-refine', label: 'introduced by', type: 'cites', provenance: 'sourced', sourceReference: 'Citation in paper' },
    { from: 'method-prm', to: 'paper-prm', label: 'introduced by', type: 'cites', provenance: 'unknown' },
    { from: 'paper-afr', to: 'dataset-gsm', label: 'evaluated on', type: 'uses', provenance: 'sourced', sourceReference: 'Experiments Section 4 — GSM8K listed' },
    { from: 'paper-afr', to: 'dataset-strat', label: 'evaluated on', type: 'uses', provenance: 'sourced', sourceReference: 'Experiments Section 4 — StrategyQA listed' },
    { from: 'paper-afr', to: 'dataset-math', label: 'evaluated on', type: 'uses', provenance: 'sourced', sourceReference: 'Experiments Section 4 — MATH listed' },
  ],
  insights: [
    'AFR sits at the intersection of error detection and recovery generation — a space only partially explored by prior work',
    'Self-Refine (Madaan 2023) is the closest methodological neighbor — both use self-feedback, but AFR adds targeted step-level recovery',
    'Process Reward Models (Lightman 2023) represent an orthogonal approach: external supervision vs. self-supervised detection',
    'The paper connects three previously separate threads: prompting methods, verification methods, and self-improvement',
    'GSM8K and MATH form a difficulty gradient — AFR improves more on harder problems (MATH: +6.7% vs GSM8K: +8.3%)',
  ],
  methodologyClusters: [
    'Prompting-based reasoning enhancement (CoT, Zero-shot CoT, Self-Consistency)',
    'Verification and error detection (PRM, VERIFY, Self-Check)',
    'Iterative self-improvement (Self-Refine, Reflexion, CRISP)',
    'Adaptive computation (Budget forcing, Early exiting, Dynamic inference)',
  ],
  missingLinks: [
    'No direct comparison to Reflexion (Shinn et al. 2023) — both use self-feedback for improvement',
    'No connection to verification-only methods (VERIFY, Self-Check) — these could complement the Failure Detector',
    'No evaluation on open-domain QA datasets (NaturalQuestions, TriviaQA) — domain gap is uncharacterized',
    'Recent work on process-supervised reward models (OpenAI o1 technical report) not discussed',
  ],
};

// ===== 2. VIRTUAL PC MEETING =====
const reviewer1: PCReviewer = {
  id: 'reviewer-alpha',
  name: 'Reviewer α (Area Chair Material)',
  expertise: 'LLM reasoning, prompt engineering',
  personality: 'Rigorous methodologist. Demands statistical rigor. Has rejected papers for insufficient seeds before.',
  stance: 'mixed',
  score: 6,
  concerns: ['Only 3 random seeds — fundamentally inadequate', 'No comparison to perplexity baseline', 'Single model evaluation'],
  strengths: ['Well-motivated problem', 'Clean ablation study', 'Modest token overhead is practical'],
  finalVerdict: 'weak_accept',
};

const reviewer2: PCReviewer = {
  id: 'reviewer-beta',
  name: 'Reviewer β (NLP Veteran)',
  expertise: 'NLP evaluation, benchmark design, reproducibility',
  personality: 'Pragmatic empiricist. Cares about real-world impact. Skeptical of benchmark-only evaluations.',
  stance: 'negative',
  score: 4,
  concerns: ['Benchmarks are saturated — need harder tests', 'No human evaluation of recovery quality', 'Only GPT-3.5-turbo tested'],
  strengths: ['AFR could be impactful for deployment', 'Ablation study is thorough', 'Token efficiency is a real advantage'],
  finalVerdict: 'weak_reject',
};

const reviewer3: PCReviewer = {
  id: 'reviewer-gamma',
  name: 'Reviewer γ (Early-Career Rising Star)',
  expertise: 'Self-supervised learning, meta-learning',
  personality: 'Excited by novel ideas. Tolerant of experimental gaps if the idea is strong. Gives constructive feedback.',
  stance: 'positive',
  score: 7,
  concerns: ['Failure detector analysis is incomplete', 'Need to show benefit over confidence thresholding'],
  strengths: ['Self-supervised detection is a genuine contribution', 'Three-component architecture is elegant', 'Paper is well-written'],
  finalVerdict: 'weak_accept',
};

export const DEMO_PC_MEETING: PCMeeting = {
  reviewers: [reviewer1, reviewer2, reviewer3],
  discussionLog: [
    { reviewerId: 'reviewer-alpha', message: 'I\'m leaning weak accept. The idea is solid and the ablation is clean, but the statistical rigor is not there. 3 seeds in 2025 is unacceptable.', turn: 1 },
    { reviewerId: 'reviewer-beta', message: 'I disagree. I\'m at weak reject. GSM8K and StrategyQA are saturated benchmarks. Without harder evaluations or real-world tasks, the contributions are incremental. Also, one model? Come on.', turn: 2 },
    { reviewerId: 'reviewer-gamma', message: 'I\'m at weak accept but I see both sides. The self-supervised detection is genuinely novel. But β is right about benchmarks — they should add MATH hard mode or a new challenge set.', turn: 3 },
    { reviewerId: 'reviewer-alpha', message: 'β, what would it take to get you to accept? If they added multi-model results and 10+ seeds?', turn: 4 },
    { reviewerId: 'reviewer-beta', message: 'Multi-model + statistical tests + one non-benchmark evaluation (e.g., medical QA). That\'s a major revision ask, not a quick fix.', turn: 5 },
    { reviewerId: 'reviewer-gamma', message: 'I think the multi-model and seeds are doable in a revision. The real-world task could be future work. I\'d support conditional accept with those as mandatory revisions.', turn: 6 },
    { reviewerId: 'reviewer-alpha', message: 'I could get behind that. Conditional accept — require multi-model eval, statistical tests, and clearly mark real-world eval as future work. β?', turn: 7 },
    { reviewerId: 'reviewer-beta', message: 'Fine. Conditional accept with those conditions. But if the authors don\'t deliver on the statistical tests, I want the paper rejected at the revision stage.', turn: 8 },
  ],
  finalOutcome: 'major_revision',
  metaReview: 'The reviewers agree that AFR addresses a genuine problem with a well-motivated approach. However, significant concerns about experimental rigor prevent acceptance at this stage. The authors must: (1) evaluate on at least 3 model families, (2) run 10+ random seeds with statistical significance tests, (3) add a perplexity-based baseline comparison. These are mandatory for resubmission.',
  consensus: 'Split decision: 2 weak accept, 1 weak reject. Outcome: Major revision required. The strength of the core idea carries the paper through, but the experimental validation must be substantially strengthened.',
};

// ===== 3. PHD PROJECT ROADMAP =====
export const DEMO_ROADMAP: Roadmap = {
  title: 'Adaptive Failure Recovery for LLM Reasoning — Publication Roadmap',
  targetVenue: 'NeurIPS 2025',
  deadline: 'May 15, 2025',
  weeksUntilDeadline: 34,
  phases: [
    {
      id: 'phase-1', name: 'Statistical Strengthening', startWeek: 1, durationWeeks: 4,
      tasks: ['Increase from 3 to 20 random seeds', 'Compute bootstrap confidence intervals', 'Add effect size reporting', 'Create reproducibility appendix'],
      milestone: 'Statistical audit completed. Power > 80% for medium effects.',
      status: 'pending', dependsOn: [],
    },
    {
      id: 'phase-2', name: 'Multi-Model Replication', startWeek: 3, durationWeeks: 6,
      tasks: ['Set up Llama-2-70B experiments', 'Set up Claude-3 experiments', 'Set up Gemini Pro experiments', 'Analyze cross-model consistency', 'Write Section 5.2'],
      milestone: 'AFR tested on 4 model families across 3 benchmarks.',
      status: 'pending', dependsOn: ['phase-1'],
    },
    {
      id: 'phase-3', name: 'Baseline Comparison', startWeek: 5, durationWeeks: 3,
      tasks: ['Implement perplexity-based confidence thresholding', 'Compare detection metrics (precision, recall, F1)', 'Add Process Reward Model comparison on MATH', 'Create Figure 3 (accuracy vs token budget)'],
      milestone: 'Three new baselines added: perplexity, PRM, and operating-point curves.',
      status: 'pending', dependsOn: ['phase-1'],
    },
    {
      id: 'phase-4', name: 'Detection Analysis', startWeek: 7, durationWeeks: 4,
      tasks: ['Annotate 500 reasoning steps for ground truth', 'Compute detector precision, recall, F1', 'Analyze false positive rate by failure type', 'Write Section 6.2'],
      milestone: 'First-ever detection-level metrics for LLM reasoning step quality.',
      status: 'pending', dependsOn: ['phase-3'],
    },
    {
      id: 'phase-5', name: 'Failure Case Analysis', startWeek: 9, durationWeeks: 3,
      tasks: ['Identify problems where AFR hurts performance', 'Categorize failure types by dataset', 'Qualitative analysis of recovery quality', 'Write Section 7 (Limitations)'],
      milestone: 'Honest characterization of when AFR fails.',
      status: 'pending', dependsOn: ['phase-2', 'phase-4'],
    },
    {
      id: 'phase-6', name: 'Paper Revision & Writing', startWeek: 11, durationWeeks: 6,
      tasks: ['Rewrite experiments section', 'Add new figures and tables', 'Update related work', 'Write rebuttal preparation section', 'Format for NeurIPS template'],
      milestone: 'Complete manuscript ready for submission.',
      status: 'pending', dependsOn: ['phase-5'],
    },
    {
      id: 'phase-7', name: 'Internal Review & Submission', startWeek: 17, durationWeeks: 3,
      tasks: ['Lab internal review', 'Collaborator feedback pass', 'Final proofreading', 'Abstract and checklist submission', 'Full paper upload'],
      milestone: 'Paper submitted to NeurIPS 2025.',
      status: 'pending', dependsOn: ['phase-6'],
    },
  ],
  criticalPath: ['Statistical Strengthening', 'Baseline Comparison', 'Detection Analysis', 'Failure Case Analysis', 'Paper Revision & Writing', 'Internal Review & Submission'],
  riskFactors: [
    'Claude-3 API access may be limited — have fallback experiments planned',
    'Human annotation for detection ground truth is time-consuming — consider crowd-sourcing',
    'NeurIPS deadline is fixed — cannot slip past week 20',
    'Statistical tests may reveal non-significance — prepare a contingency plan',
  ],
};

// ===== 4. PAPER ALIGNMENT SYSTEM =====
export function analyzePaperAlignment(text: string, venue?: string): PaperAlignment {
  const sections = text.match(/\\(section|chapter|part)\{([^}]+)\}/g) || [];
  const sectionNames = sections.map(s => s.replace(/\\(section|chapter|part)\{([^}]+)\}/, '$2'));
  const words = text.split(/\s+/).length;

  const issues: AlignmentIssue[] = [];
  let missingSections: string[] = [];

  // Structural checks
  const requiredSections = ['introduction', 'related work', 'method', 'experiment', 'result', 'conclusion'];
  const hasBib = text.toLowerCase().includes('\\bibliography') || text.toLowerCase().includes('\\begin{thebibliography}');
  const hasAbstract = text.toLowerCase().includes('\\begin{abstract}') || text.toLowerCase().includes('abstract');

  if (!hasAbstract) issues.push({ id: 'align-1', section: 'preamble', type: 'missing', description: 'No abstract section found', severity: 'error', suggestion: 'Add \\begin{abstract}...\\end{abstract} after the title.', lineNumber: 1 });
  if (!hasBib) issues.push({ id: 'align-2', section: 'endmatter', type: 'missing', description: 'No bibliography found', severity: 'error', suggestion: 'Add \\bibliography{refs} or \\begin{thebibliography} at the end.', lineNumber: undefined });

  for (const req of requiredSections) {
    if (!sectionNames.some(s => s.toLowerCase().includes(req))) {
      missingSections.push(req.charAt(0).toUpperCase() + req.slice(1));
      issues.push({ id: `align-miss-${req}`, section: req, type: 'missing', description: `Required section "${req}" not found`, severity: 'warning', suggestion: `Add \\section{${req.charAt(0).toUpperCase() + req.slice(1)}}`, lineNumber: undefined });
    }
  }

  // Consistency checks
  if (text.includes('\\citep{') && text.includes('\\citet{') === false) {
    issues.push({ id: 'align-3', section: 'references', type: 'consistency', description: 'Only using \\citep — consider using \\citet for narrative citations', severity: 'info', suggestion: 'Use \\citet{author2023} for in-text citations: "Author et al. (2023) showed..."', lineNumber: undefined });
  }

  const refCommands = (text.match(/\\cite[pt]?\{[^}]+\}/g) || []).length;
  if (refCommands < 5) {
    issues.push({ id: 'align-4', section: 'references', type: 'structure', description: 'Very few citations found', severity: 'warning', suggestion: 'A research paper typically has 20-50 citations. Consider expanding related work.', lineNumber: undefined });
  }

  // Formatting checks
  const formatIssues = checkFormatting(text);
  issues.push(...formatIssues);

  const structuralScore = Math.max(0, 100 - missingSections.length * 20 - (hasBib ? 0 : 15) - (hasAbstract ? 0 : 15));
  const consistencyScore = Math.max(0, 100 - issues.filter(i => i.type === 'consistency').length * 10);
  const formatScore = Math.max(0, 100 - issues.filter(i => i.type === 'formatting').length * 8);

  return {
    title: sectionNames[0] || 'Untitled',
    sectionCount: sectionNames.length,
    wordCount: words,
    issues,
    structuralScore,
    consistencyScore,
    formatScore,
    overallHealth: Math.round((structuralScore + consistencyScore + formatScore) / 3),
    targetVenue: venue || 'Unknown',
    missingSections,
  };
}

function checkFormatting(text: string): AlignmentIssue[] {
  const issues: AlignmentIssue[] = [];

  // Check for common LaTeX errors
  if ((text.match(/\\\(/g) || []).length !== (text.match(/\\\)/g) || []).length) {
    issues.push({ id: 'fmt-1', section: 'general', type: 'formatting', description: 'Mismatched inline math delimiters', severity: 'error', suggestion: 'Ensure every \\( has a matching \\)', lineNumber: undefined });
  }
  if ((text.match(/\\\[/g) || []).length !== (text.match(/\\\]/g) || []).length) {
    issues.push({ id: 'fmt-2', section: 'general', type: 'formatting', description: 'Mismatched display math delimiters', severity: 'error', suggestion: 'Ensure every \\[ has a matching \\]', lineNumber: undefined });
  }

  // Figure formatting
  const figs = text.match(/\\includegraphics/g) || [];
  if (figs.length > 0 && !text.includes('\\caption')) {
    issues.push({ id: 'fmt-3', section: 'figures', type: 'formatting', description: 'Figures found without captions', severity: 'warning', suggestion: 'Add \\caption{} inside each figure environment.', lineNumber: undefined });
  }

  // Table formatting
  const tables = text.match(/\\begin\{table\}/g) || [];
  if (tables.length > 0 && !text.includes('\\toprule')) {
    issues.push({ id: 'fmt-4', section: 'tables', type: 'formatting', description: 'Tables should use booktabs rules (\\toprule, \\midrule, \\bottomrule)', severity: 'info', suggestion: 'Use the booktabs package for professional-quality tables.', lineNumber: undefined });
  }

  return issues;
}

export function getDemoAlignment(): PaperAlignment {
  return analyzePaperAlignment(`\\section{Introduction}
Large Language Models have demonstrated impressive reasoning capabilities.
\\section{Related Work}
Previous work has explored self-consistency decoding.
\\section{Method}
We propose Adaptive Failure Recovery (AFR).
\\section{Experiments}
We evaluate AFR on GSM8K, StrategyQA, and MATH.
\\section{Results}
AFR achieves 78.4\\% accuracy on GSM8K.
\\section{Conclusion}
We presented AFR, a framework for adaptive failure recovery.
\\bibliography{refs}`, 'NeurIPS 2025');
}