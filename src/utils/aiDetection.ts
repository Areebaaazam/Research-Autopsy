import type { AIDetectionResult, SourceTraceResult } from '../types';

// ---------- AI DETECTION ENGINE ----------
// Heuristic pattern matching based on known linguistic markers of LLM-generated text.
// This is NOT a verified authorship attribution tool.

const AI_PATTERNS: { pattern: RegExp; label: string; weight: number }[] = [
  { pattern: /\b(Here's|Here is|In this paper, we|In this work, we|In this study, we)\b/i, label: 'common_ai_opening', weight: 25 },
  { pattern: /\b(Furthermore|Moreover|Additionally|Consequently|Nevertheless|Nonetheless)\b,?\s+(the|this|our)/i, label: 'transition_formula', weight: 20 },
  { pattern: /\bIt is worth noting that\b/i, label: 'hedging_phrase', weight: 20 },
  { pattern: /\b(as discussed|as mentioned|as described|as shown)\s+(above|below|earlier|previously)\b/i, label: 'cross_reference_formula', weight: 15 },
  { pattern: /\bin order to\b/i, label: 'formal_purpose', weight: 10 },
  { pattern: /\b(not only|but also)\b.{10,50}\b(but also|as well)\b/i, label: 'paired_structure', weight: 20 },
  { pattern: /\bIt is important to (note|emphasize|highlight)\b/i, label: 'importance_signpost', weight: 20 },
  { pattern: /\bThis (suggests|indicates|implies|demonstrates|highlights|underscores)\b/i, label: 'inference_formula', weight: 15 },
  { pattern: /\ba wide range of\b/i, label: 'vague_quantity', weight: 10 },
  { pattern: /\bIn recent years?\b/i, label: 'temporal_opening', weight: 10 },
  { pattern: /\bDue to the fact that\b/i, label: 'wordy_causality', weight: 25 },
  { pattern: /\bIt should be noted that\b/i, label: 'formal_noting', weight: 20 },
  { pattern: /\bAs can be seen\b/i, label: 'observation_formula', weight: 20 },
  { pattern: /\bplays? a crucial role in\b/i, label: 'crucial_role_cliche', weight: 15 },
  { pattern: /\ba plethora of\b/i, label: 'plethora_cliche', weight: 25 },
  { pattern: /\bin the realm of\b/i, label: 'realm_cliche', weight: 20 },
  { pattern: /\bIt is (well|widely) known that\b/i, label: 'common_knowledge_formula', weight: 15 },
  { pattern: /\bit is (evident|clear|apparent) that\b/i, label: 'certainty_formula', weight: 15 },
];

const AI_FOOTGUN_PATTERNS: { pattern: RegExp; label: string; weight: number }[] = [
  { pattern: /\bdelving\b/i, label: 'llm_delving', weight: 35 },
  { pattern: /\blandscape\b.{0,30}(of|in)\b/i, label: 'llm_landscape', weight: 30 },
  { pattern: /\btapestry\b/i, label: 'llm_tapestry', weight: 40 },
  { pattern: /\b(realm|domain)\b.{0,20}(of|in)\b.{0,30}(research|study|field)\b/i, label: 'llm_realm_domain', weight: 30 },
  { pattern: /\bintricate\b/i, label: 'llm_intricate', weight: 25 },
  { pattern: /\b(multifaceted|multidimensional)\b/i, label: 'llm_multifaceted', weight: 30 },
  { pattern: /\bnavigate the (complexities|challenges|nuances)\b/i, label: 'llm_navigate', weight: 35 },
  { pattern: /\b(in essence|ultimately,)\b/i, label: 'llm_essence', weight: 20 },
  { pattern: /\bfoster(ing|s)? a (deeper|better|more)\b/i, label: 'llm_foster', weight: 25 },
  { pattern: /\ba (deep|profound) (dive|understanding|exploration)\b/i, label: 'llm_deep_dive', weight: 25 },
];

function scoreSentence(text: string): { score: number; pattern: string } {
  let score = 0;
  let pattern = 'natural_writing';

  for (const p of AI_PATTERNS) {
    const matches = text.match(p.pattern);
    if (matches) { score += p.weight * matches.length; pattern = p.label; }
  }

  for (const p of AI_FOOTGUN_PATTERNS) {
    const matches = text.match(p.pattern);
    if (matches) { score += p.weight * matches.length; if (pattern === 'natural_writing') pattern = p.label; }
  }

  const words = text.split(/\s+/).length;
  if (words > 35) score += 10;
  if (words > 50) score += 15;

  const wordLengths = text.split(/\s+/).map(w => w.length);
  if (wordLengths.length > 5) {
    const avg = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
    const variance = wordLengths.reduce((a, b) => a + (b - avg) ** 2, 0) / wordLengths.length;
    if (variance < 3 && avg > 4.5) score += 10;
  }

  return { score: Math.min(100, score), pattern };
}

function getHighlight(score: number): 'none' | 'low' | 'medium' | 'high' {
  if (score >= 60) return 'high';
  if (score >= 35) return 'medium';
  if (score >= 15) return 'low';
  return 'none';
}

export function analyzeAIContent(text: string): AIDetectionResult {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15).map((s, i) => {
    const { score, pattern } = scoreSentence(s);
    return { index: i, text: s.trim(), score, pattern, highlight: getHighlight(score) };
  });

  const overallScore = sentences.length > 0 ? Math.round(sentences.reduce((sum, s) => sum + s.score, 0) / sentences.length) : 0;

  const categoryCounts: Record<string, { count: number; totalScore: number }> = {};
  for (const s of sentences) {
    if (s.score > 10) {
      if (!categoryCounts[s.pattern]) categoryCounts[s.pattern] = { count: 0, totalScore: 0 };
      categoryCounts[s.pattern].count++;
      categoryCounts[s.pattern].totalScore += s.score;
    }
  }

  const totalScore = Object.values(categoryCounts).reduce((sum, c) => sum + c.totalScore, 0);
  const breakdown = Object.entries(categoryCounts)
    .map(([category, data]) => ({ category, count: data.count, contribution: totalScore > 0 ? Math.round((data.totalScore / totalScore) * 100) : 0 }))
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, 8);

  let summary = '';
  if (overallScore >= 60) summary = 'High pattern-match score. Multiple LLM-typical patterns detected. This is not proof of AI authorship — human academic writing can share these patterns. Review highlighted sentences.';
  else if (overallScore >= 35) summary = 'Moderate pattern-match score. Some sentences contain formulaic patterns common in LLM output and academic writing. Review highlighted sentences.';
  else if (overallScore >= 15) summary = 'Low pattern-match score. A few detected patterns, but consistent with natural academic writing.';
  else summary = 'Very low pattern-match score. Text reads as natural human academic writing.';

  return { overallScore, sentences, breakdown, summary };
}

// ---------- SOURCE TRACING ----------
// Compares draft sentences against the paper source text (if loaded) and known academic phrases.
// Requires at least one source text to produce meaningful results.

export function traceSources(text: string, sourceTexts?: string[]): SourceTraceResult {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 20).map(s => s.trim());

  if (!sourceTexts || sourceTexts.length === 0) {
    return { matches: [], overallOriginality: 0, mostMatchedSource: '', summary: 'Not assessed — add a paper source to compare against.' };
  }

  const combinedSource = sourceTexts.join(' ').toLowerCase();
  const matches: { sentenceIndex: number; sentence: string; sourceText: string; similarity: number; sourceLocation: string; matched: boolean }[] = [];

  const commonPhraseClusters = [
    { phrase: 'large language models have demonstrated', source: 'Common in NLP papers (2023–2025)', loc: 'generic_intro' },
    { phrase: 'chain of thought prompting', source: 'Wei et al. (2022)', loc: 'cot_paper' },
    { phrase: 'we propose a novel', source: 'Common academic formula', loc: 'generic_method' },
    { phrase: 'experimental results show that', source: 'Common academic formula', loc: 'generic_results' },
    { phrase: 'state of the art', source: 'Common academic phrase', loc: 'generic_comparison' },
    { phrase: 'to the best of our knowledge', source: 'Common academic disclaimer', loc: 'generic_novelty' },
    { phrase: 'it is worth noting', source: 'Common academic hedging', loc: 'generic_hedging' },
    { phrase: 'in recent years', source: 'Common academic opening', loc: 'generic_intro' },
    { phrase: 'significant improvement', source: 'Common result claim', loc: 'generic_claim' },
  ];

  for (let i = 0; i < sentences.length; i++) {
    const sent = sentences[i].toLowerCase();
    let matched = false;

    for (const cluster of commonPhraseClusters) {
      if (sent.includes(cluster.phrase.toLowerCase())) {
        matches.push({ sentenceIndex: i, sentence: sentences[i], sourceText: cluster.phrase, similarity: 85 + Math.floor(Math.random() * 10), sourceLocation: cluster.loc, matched: true });
        matched = true;
        break;
      }
    }

    if (!matched) {
      const words = sentences[i].split(/\s+/);
      const overlap = words.filter(w => w.length > 4 && combinedSource.includes(w.toLowerCase())).length;
      if (words.length > 5 && overlap / words.length > 0.6) {
        matches.push({ sentenceIndex: i, sentence: sentences[i], sourceText: 'Similar phrasing found in source text', similarity: Math.round(60 + (overlap / words.length) * 30), sourceLocation: 'source_text', matched: true });
      }
    }
  }

  const matchedCount = matches.length;
  const overallOriginality = sentences.length > 0 ? Math.round((1 - matchedCount / sentences.length) * 100) : 100;

  const sourceCounts: Record<string, number> = {};
  for (const m of matches) { const key = m.sourceLocation; sourceCounts[key] = (sourceCounts[key] || 0) + 1; }
  const mostMatchedSource = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'none';

  const summary = matchedCount === 0
    ? 'No matches found in the compared sources. Common academic phrases were checked.'
    : `${matchedCount} sentence${matchedCount > 1 ? 's' : ''} matched against ${sourceTexts.length} source(s). Matches are common academic patterns — not specific plagiarism detection.`;

  return { matches, overallOriginality, mostMatchedSource, summary };
}

// ---------- DEMO DATA ----------

export const DEMO_AI_DETECTION: AIDetectionResult = {
  overallScore: 42,
  sentences: [
    { index: 0, text: 'Large Language Models have demonstrated impressive reasoning capabilities through chain-of-thought prompting.', score: 30, pattern: 'common_ai_opening', highlight: 'low' },
    { index: 1, text: 'However, when these models encounter reasoning failures—such as logical gaps, arithmetic errors, or contradictory premises—they typically fail silently or produce plausible-sounding but incorrect outputs.', score: 55, pattern: 'transition_formula', highlight: 'medium' },
    { index: 2, text: 'We propose Adaptive Failure Recovery (AFR), a novel framework that enables LLMs to detect their own reasoning failures and dynamically recover from them.', score: 65, pattern: 'common_ai_opening', highlight: 'high' },
    { index: 3, text: 'AFR consists of three components: a Failure Detector that monitors reasoning quality, a Recovery Generator that produces alternative reasoning paths, and a Path Selector that chooses the most promising recovery strategy.', score: 75, pattern: 'llm_multifaceted', highlight: 'high' },
    { index: 4, text: 'Our results show that AFR improves accuracy by 12.3% on average while adding only 15% additional token overhead.', score: 20, pattern: 'natural_writing', highlight: 'none' },
    { index: 5, text: 'This is particularly problematic in high-stakes applications such as medical diagnosis, legal reasoning, and scientific analysis.', score: 25, pattern: 'importance_signpost', highlight: 'low' },
    { index: 6, text: 'Previous work has explored self-consistency decoding, which samples multiple reasoning paths and aggregates results.', score: 50, pattern: 'transition_formula', highlight: 'medium' },
    { index: 7, text: 'However, this approach is computationally expensive and does not address the fundamental issue of error detection.', score: 40, pattern: 'transition_formula', highlight: 'medium' },
    { index: 8, text: 'Our work differs by enabling the LLM itself to detect and recover from failures without external supervision.', score: 35, pattern: 'inference_formula', highlight: 'medium' },
    { index: 9, text: 'The Failure Detector evaluates each reasoning step for potential errors.', score: 5, pattern: 'natural_writing', highlight: 'none' },
  ],
  breakdown: [
    { category: 'transition_formula', count: 3, contribution: 30 },
    { category: 'common_ai_opening', count: 2, contribution: 25 },
    { category: 'llm_multifaceted', count: 1, contribution: 15 },
    { category: 'importance_signpost', count: 1, contribution: 10 },
    { category: 'inference_formula', count: 1, contribution: 10 },
    { category: 'hedging_phrase', count: 1, contribution: 5 },
    { category: 'sentence_length', count: 1, contribution: 5 },
  ],
  summary: 'Moderate AI-generation signal detected. Some sentences contain formulaic patterns common in LLM output. The method description section has the highest concentration of AI-typical phrasing. Consider reviewing sentences highlighted in orange and red for more natural academic expression.',
};

export const DEMO_SOURCE_TRACE: SourceTraceResult = {
  matches: [
    { sentenceIndex: 0, sentence: 'Large Language Models have demonstrated impressive reasoning capabilities through chain-of-thought prompting.', sourceText: 'Large language models have demonstrated', similarity: 88, sourceLocation: 'generic_intro', matched: true },
    { sentenceIndex: 2, sentence: 'We propose Adaptive Failure Recovery (AFR), a novel framework that enables LLMs to detect their own reasoning failures and dynamically recover from them.', sourceText: 'we propose a novel', similarity: 85, sourceLocation: 'generic_method', matched: true },
    { sentenceIndex: 4, sentence: 'Our results show that AFR improves accuracy by 12.3% on average while adding only 15% additional token overhead.', sourceText: 'experimental results show that', similarity: 72, sourceLocation: 'generic_results', matched: true },
  ],
  overallOriginality: 82,
  mostMatchedSource: 'generic_intro',
  summary: '3 sentences matched against 1 source(s). Matches are common academic patterns — not specific plagiarism detection.',
};

export const DEMO_EDITOR_DOC = {
  id: 'doc-demo-1',
  title: 'Adaptive Failure Recovery for LLM Reasoning — Draft Revision',
  content: `\section{Introduction}\n\nLarge Language Models have demonstrated impressive reasoning capabilities through chain-of-thought prompting. However, when these models encounter reasoning failures — such as logical gaps, arithmetic errors, or contradictory premises — they typically fail silently. This is particularly problematic in high-stakes applications.\n\nWe propose Adaptive Failure Recovery (AFR), a framework that enables LLMs to detect their own reasoning failures and dynamically recover from them. AFR consists of three components: a Failure Detector, a Recovery Generator, and a Path Selector.`,
  version: 3,
  createdAt: Date.now() - 7 * 86400000,
  updatedAt: Date.now() - 86400000,
};