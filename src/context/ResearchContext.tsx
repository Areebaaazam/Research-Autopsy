import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type {
  ResearchState, ResearchMemoryItem, PaperAnalysis, ClaimEvidence, ResearchGap, NoveltyCheck,
  ExperimentPlan, ExperimentBrief, ReviewerResponse, AutopsyResult, NextSteps, AnalysisMode,
  NumericalAudit, RevisionComparison, PaperSnapshot, LayoutState, QueueItem, DraftState,
} from '../types';
import {
  DEMO_ANALYSIS, DEMO_GAPS, DEMO_AUTOPSY, DEMO_EXPERIMENT_PLAN,
  DEMO_NEXT_STEPS, DEMO_PAPER_TEXT, DEMO_CLAIM_EVIDENCE,
  DEMO_EXPERIMENT_BRIEFS, DEMO_REVIEWER_RESPONSES,
  DEMO_TIMELINE, DEMO_ADVERSARIAL, DEMO_POWER,
  DEMO_RELATED_WORK, DEMO_PROFESSOR, DEMO_REBUTTAL,
} from '../utils/demoData';
import { DEMO_AI_DETECTION, DEMO_SOURCE_TRACE, DEMO_EDITOR_DOC } from '../utils/aiDetection';
import { DEMO_AI_ENGINE, getInitialAIEngineState } from '../utils/aiEngine';
import { DEMO_SUBMISSIONS } from '../utils/conferenceData';
import { DEMO_RESEARCH_GRAPH, DEMO_PC_MEETING, DEMO_ROADMAP, getDemoAlignment } from '../utils/boomFeatures';
import { getDemoNumericalAudit } from '../utils/numericalAudit';
import { getDemoRevisionComparison } from '../utils/revisionCompare';

const STORAGE_KEY = 'research-autopsy-v3';
const THEME_KEY = 'research-autopsy-theme';

function hashText(text: string): string {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h) + text.charCodeAt(i); h |= 0;
  }
  return Math.abs(h).toString(16).slice(0, 12);
}

const initialState: ResearchState = {
  currentModule: 'dashboard',
  paperText: '', paperTextHash: '',
  paperAnalysis: null, paperAnalysisHash: '',
  paperSnapshots: [],
  claimEvidence: [], numericalAudit: null, revisionComparison: null,
  researchGaps: [], noveltyCheck: null, experimentPlan: null,
  experimentBriefs: [], reviewerResponses: [],
  autopsyResult: null, nextSteps: null,
  timeline: null, adversarial: null, statisticalPower: null,
  relatedWork: null, professorAnalysis: null, rebuttalLetter: null,
  aiDetection: null, sourceTrace: null,
  editorDoc: null, trackChanges: [],
  conferences: [], submissions: [], aiEngine: getInitialAIEngineState(),
  researchGraph: null, pcMeeting: null, roadmap: null, paperAlignment: null,
  memory: { storageVersion: 3, items: [] },
  isLoading: false, loadingText: '', error: null,
  darkMode: true, demoMode: false, resultPaperHash: '',
  editorDirty: false, navigationTarget: null, backendStatus: 'unknown', requestGuard: 0,
  gapPaperHash: '', gapMode: '', gapError: null, gapErrorKind: null, gapErrorStatus: null, gapErrorRetryAfterSec: null,
  layout: { sidebarCollapsed: false, evidencePanelOpen: false, evidencePanelWidth: 380 },
  queue: [],
  draftState: null,
};

type Action =
  | { type: 'SET_MODULE'; module: string }
  | { type: 'SET_LOADING'; isLoading: boolean; loadingText?: string }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_BACKEND_STATUS'; status: 'unknown' | 'connected' | 'disconnected' }
  | { type: 'SET_PAPER_TEXT'; text: string }
  | { type: 'SET_PAPER_ANALYSIS'; analysis: PaperAnalysis }
  | { type: 'SET_CLAIM_EVIDENCE'; evidence: ClaimEvidence[] }
  | { type: 'SET_NUMERICAL_AUDIT'; audit: NumericalAudit }
  | { type: 'SET_REVISION_COMPARISON'; comparison: RevisionComparison }
  | { type: 'ADD_PAPER_SNAPSHOT'; snapshot: PaperSnapshot }
  | { type: 'LOAD_PAPER_SNAPSHOT'; textHash: string }
  | { type: 'SET_RESEARCH_GAPS'; gaps: ResearchGap[] }
  | { type: 'SET_NOVELTY_CHECK'; check: NoveltyCheck }
  | { type: 'SET_EXPERIMENT_PLAN'; plan: ExperimentPlan }
  | { type: 'SET_EXPERIMENT_BRIEFS'; briefs: ExperimentBrief[] }
  | { type: 'SET_REVIEWER_RESPONSES'; responses: ReviewerResponse[] }
  | { type: 'SET_AUTOPSY'; autopsy: AutopsyResult; nextSteps: NextSteps }
  | { type: 'SET_EDITOR_DIRTY'; dirty: boolean }
  | { type: 'SET_LAYOUT'; layout: LayoutState }
  | { type: 'SET_QUEUE'; queue: QueueItem[] }
  | { type: 'PIN_QUEUE_ITEM'; id: string; pinned: boolean }
  | { type: 'SET_QUEUE_PRIORITY'; id: string; priority: number }
  | { type: 'SET_QUEUE_NOTE'; id: string; note: string }
  | { type: 'SET_DRAFT'; draft: DraftState | null }
  | { type: 'SHOW_NAV_CONFIRM'; target: string | null }
  | { type: 'LOAD_DEMO' }
  | { type: 'CLEAR_ALL' }
  | { type: 'TOGGLE_THEME' }
  | { type: 'ADD_MEMORY_ITEM'; item: ResearchMemoryItem }
  | { type: 'REMOVE_MEMORY_ITEM'; id: string }
  | { type: 'UPDATE_MEMORY_ITEM'; item: ResearchMemoryItem }
  | { type: 'LOAD_MEMORY'; items: ResearchMemoryItem[] }
  | { type: 'SET_GAP_RESULT'; gaps: ResearchGap[]; gapPaperHash: string; gapMode: string; gapError: string | null; gapErrorKind?: string | null; gapErrorStatus?: number | null; gapErrorRetryAfterSec?: number | null };

function researchReducer(state: ResearchState, action: Action): ResearchState {
  switch (action.type) {
    case 'SET_MODULE': return { ...state, currentModule: action.module };
    case 'SET_LOADING': return { ...state, isLoading: action.isLoading, loadingText: action.loadingText || '' };
    case 'SET_ERROR': return { ...state, error: action.error };
    case 'SET_BACKEND_STATUS': return { ...state, backendStatus: action.status };
    case 'SET_PAPER_TEXT': return { ...state, paperText: action.text, paperTextHash: hashText(action.text) };
    case 'SET_PAPER_ANALYSIS':
      return { ...state, paperAnalysis: action.analysis, paperAnalysisHash: hashText(state.paperText), resultPaperHash: hashText(state.paperText), claimEvidence: [], researchGaps: [], noveltyCheck: null, experimentPlan: null, autopsyResult: null, nextSteps: null, numericalAudit: null, revisionComparison: null };
    case 'SET_CLAIM_EVIDENCE': return { ...state, claimEvidence: action.evidence };
    case 'SET_NUMERICAL_AUDIT': return { ...state, numericalAudit: action.audit };
    case 'SET_REVISION_COMPARISON': return { ...state, revisionComparison: action.comparison };
    case 'ADD_PAPER_SNAPSHOT': return { ...state, paperSnapshots: [...state.paperSnapshots, action.snapshot] };
    case 'LOAD_PAPER_SNAPSHOT': {
      const snap = state.paperSnapshots.find(s => s.textHash === action.textHash);
      if (!snap) return state;
      return {
        ...state,
        paperText: snap.text,
        paperTextHash: snap.textHash,
        paperAnalysis: snap.analysis || state.paperAnalysis,
        paperAnalysisHash: snap.textHash,
        resultPaperHash: snap.textHash,
      };
    }
    case 'SET_RESEARCH_GAPS': return { ...state, researchGaps: action.gaps };
    case 'SET_NOVELTY_CHECK': return { ...state, noveltyCheck: action.check };
    case 'SET_EXPERIMENT_PLAN': return { ...state, experimentPlan: action.plan };
    case 'SET_EXPERIMENT_BRIEFS': return { ...state, experimentBriefs: action.briefs };
    case 'SET_REVIEWER_RESPONSES': return { ...state, reviewerResponses: action.responses };
    case 'SET_AUTOPSY': return { ...state, autopsyResult: action.autopsy, nextSteps: action.nextSteps };
    case 'SET_EDITOR_DIRTY': return { ...state, editorDirty: action.dirty };
    case 'SET_LAYOUT': return { ...state, layout: action.layout };
    case 'SET_QUEUE': return { ...state, queue: action.queue };
    case 'PIN_QUEUE_ITEM': return { ...state, queue: state.queue.map(q => q.id === action.id ? { ...q, pinned: action.pinned } : q) };
    case 'SET_QUEUE_PRIORITY': return { ...state, queue: state.queue.map(q => q.id === action.id ? { ...q, userPriority: action.priority } : q) };
    case 'SET_QUEUE_NOTE': return { ...state, queue: state.queue.map(q => q.id === action.id ? { ...q, userNote: action.note } : q) };
    case 'SET_DRAFT': return { ...state, draftState: action.draft };
    case 'SHOW_NAV_CONFIRM': return { ...state, navigationTarget: action.target };
    case 'LOAD_DEMO':
      return {
        ...state, demoMode: true,
        paperText: DEMO_PAPER_TEXT, paperTextHash: hashText(DEMO_PAPER_TEXT),
        paperAnalysis: DEMO_ANALYSIS, paperAnalysisHash: hashText(DEMO_PAPER_TEXT),
        resultPaperHash: hashText(DEMO_PAPER_TEXT),
        claimEvidence: DEMO_CLAIM_EVIDENCE, researchGaps: DEMO_GAPS,
        experimentPlan: DEMO_EXPERIMENT_PLAN, experimentBriefs: DEMO_EXPERIMENT_BRIEFS,
        reviewerResponses: DEMO_REVIEWER_RESPONSES,
        autopsyResult: DEMO_AUTOPSY, nextSteps: DEMO_NEXT_STEPS,
        timeline: DEMO_TIMELINE, adversarial: DEMO_ADVERSARIAL,
        statisticalPower: DEMO_POWER, relatedWork: DEMO_RELATED_WORK,
        professorAnalysis: DEMO_PROFESSOR, rebuttalLetter: DEMO_REBUTTAL,
        aiDetection: DEMO_AI_DETECTION, sourceTrace: DEMO_SOURCE_TRACE,
        editorDoc: DEMO_EDITOR_DOC,
        submissions: DEMO_SUBMISSIONS, aiEngine: DEMO_AI_ENGINE,
        researchGraph: DEMO_RESEARCH_GRAPH, pcMeeting: DEMO_PC_MEETING,
        roadmap: DEMO_ROADMAP, paperAlignment: getDemoAlignment(),
        numericalAudit: getDemoNumericalAudit(),
        revisionComparison: getDemoRevisionComparison(),
      };
    case 'CLEAR_ALL':
      return { ...initialState, memory: state.memory, darkMode: state.darkMode, layout: state.layout };
    case 'TOGGLE_THEME': return { ...state, darkMode: !state.darkMode };
    case 'ADD_MEMORY_ITEM': return { ...state, memory: { ...state.memory, items: [...state.memory.items, action.item] } };
    case 'REMOVE_MEMORY_ITEM': return { ...state, memory: { ...state.memory, items: state.memory.items.filter(i => i.id !== action.id) } };
    case 'UPDATE_MEMORY_ITEM': return { ...state, memory: { ...state.memory, items: state.memory.items.map(i => i.id === action.item.id ? action.item : i) } };
    case 'LOAD_MEMORY': return { ...state, memory: { ...state.memory, items: action.items } };
    case 'SET_GAP_RESULT': return { ...state, researchGaps: action.gaps, gapPaperHash: action.gapPaperHash, gapMode: action.gapMode, gapError: action.gapError, gapErrorKind: action.gapErrorKind ?? null, gapErrorStatus: action.gapErrorStatus ?? null, gapErrorRetryAfterSec: action.gapErrorRetryAfterSec ?? null };
    default: return state;
  }
}

interface ResearchContextType {
  state: ResearchState;
  dispatch: React.Dispatch<Action>;
  analysisMode: AnalysisMode;
  setModule: (m: string) => void;
  confirmNavigation: () => void;
  cancelNavigation: () => void;
  uploadPaper: (text: string) => Promise<void>;
  findGaps: (analysis?: PaperAnalysis, text?: string, forceHeuristic?: boolean) => Promise<void>;
  checkOverlap: (idea: string) => Promise<void>;
  analyzeExperiment: (description: string) => Promise<void>;
  runAutopsy: () => Promise<void>;
  runReviewer: () => Promise<void>;
  extractClaimEvidence: () => Promise<void>;
  runNumericalAudit: () => Promise<void>;
  savePaperSnapshot: (label: string) => void;
  loadPaperSnapshot: (textHash: string) => void;
  compareRevisions: (oldId: string, newId: string) => Promise<void>;
  loadDemo: () => void;
  clearAll: () => void;
  toggleTheme: () => void;
  addMemoryItem: (item: Omit<ResearchMemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeMemoryItem: (id: string) => void;
  updateMemoryItem: (item: ResearchMemoryItem) => void;
  getBackup: () => string;
  importBackup: (json: string) => { success: boolean; count: number; errors: string[] };
  addExperimentBrief: (brief: Omit<ExperimentBrief, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateExperimentBrief: (brief: ExperimentBrief) => void;
  addReviewerResponse: (response: Omit<ReviewerResponse, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateReviewerResponse: (response: ReviewerResponse) => void;
  exportReviewPacket: () => string;
}

const ResearchContext = createContext<ResearchContextType | null>(null);
const API_BASE = '/api';

async function callAPI(endpoint: string, data: any) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = body.error || `HTTP ${res.status}`;
    const err = new Error(error);
    (err as any).status = res.status;
    (err as any).mode = body.mode;
    (err as any).errorKind = body.errorKind;
    (err as any).errorStatus = body.errorStatus;
    (err as any).errorRetryAfterSec = body.errorRetryAfterSec;
    throw err;
  }
  return body;
}

function migrateStorage(data: any): ResearchState['memory'] {
  if (!data) return { storageVersion: 3, items: [] };
  // v1: plain array, v2: { storageVersion: 2, items: [] }
  if (data.storageVersion === 3) return data;
  const items = Array.isArray(data) ? data : (Array.isArray(data.items) ? data.items : []);
  return { storageVersion: 3, items };
}

export function ResearchProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(researchReducer, initialState, (init) => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) init.memory = migrateStorage(JSON.parse(saved));
      const theme = localStorage.getItem(THEME_KEY);
      if (theme !== null) init.darkMode = theme === 'dark';
      const layout = localStorage.getItem('research-autopsy-layout');
      if (layout) { const parsed = JSON.parse(layout); if (parsed.evidencePanelWidth) init.layout = parsed; }
    } catch { /* ignore */ }
    return init;
  });

  const paperRef = useRef(state.paperText);
  React.useEffect(() => { paperRef.current = state.paperText; }, [state.paperText]);

  React.useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.memory)); } catch {}
  }, [state.memory]);

  React.useEffect(() => {
    localStorage.setItem(THEME_KEY, state.darkMode ? 'dark' : 'light');
    document.documentElement.className = state.darkMode ? 'dark' : 'light';
  }, [state.darkMode]);

  // Persist layout preferences
  React.useEffect(() => { try { localStorage.setItem('research-autopsy-layout', JSON.stringify(state.layout)); } catch { /* */ } }, [state.layout]);

  const guardRef = useRef(0);
  const makeGuard = useCallback(() => {
    const token = ++guardRef.current;
    const hashAtCall = hashText(paperRef.current);
    return () => {
      if (guardRef.current !== token) throw new Error('Request discarded: newer request in flight.');
      if (hashText(paperRef.current) !== hashAtCall) throw new Error('Paper changed since request started. Results discarded.');
    };
  }, []);

  const analysisMode: AnalysisMode = state.demoMode ? 'demo' : 'heuristic';

  const setModule = useCallback((m: string) => {
    // If there are unsaved changes, show confirmation instead of navigating directly
    if (state.editorDirty && state.currentModule !== m) {
      dispatch({ type: 'SHOW_NAV_CONFIRM', target: m });
      return;
    }
    dispatch({ type: 'SET_MODULE', module: m });
  }, [state.editorDirty, state.currentModule]);
  const confirmNavigation = useCallback(() => {
    if (state.navigationTarget) {
      dispatch({ type: 'SET_EDITOR_DIRTY', dirty: false });
      dispatch({ type: 'SET_MODULE', module: state.navigationTarget });
      dispatch({ type: 'SHOW_NAV_CONFIRM', target: null });
    }
  }, [state.navigationTarget]);
  const cancelNavigation = useCallback(() => {
    dispatch({ type: 'SHOW_NAV_CONFIRM', target: null });
  }, []);
  const toggleTheme = useCallback(() => dispatch({ type: 'TOGGLE_THEME' }), []);
  const clearAll = useCallback(() => dispatch({ type: 'CLEAR_ALL' }), []);

  const loadDemo = useCallback(() => dispatch({ type: 'LOAD_DEMO' }), []);

  const uploadPaper = useCallback(async (text: string) => {
    if (text.length < 50) { dispatch({ type: 'SET_ERROR', error: 'Paper text must be at least 50 characters.' }); return; }
    const guard = makeGuard();
    dispatch({ type: 'SET_PAPER_TEXT', text });
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Analyzing paper...' });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const result = await callAPI('/analyze-paper', { text });
      guard();
      dispatch({ type: 'SET_PAPER_ANALYSIS', analysis: result as PaperAnalysis });
    } catch (err: any) {
      guard();
      dispatch({ type: 'SET_ERROR', error: err.message });
    } finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [makeGuard]);

  const extractClaimEvidence = useCallback(async () => {
    if (!state.paperText) return;
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Extracting claim-evidence pairs...' });
    try {
      const result = await callAPI('/analyze-paper', { text: state.paperText });
      guard();
      if (result.evidenceBreakdown) {
        dispatch({ type: 'SET_CLAIM_EVIDENCE', evidence: (result.evidenceBreakdown as any[]).map((item: any, i: number) => ({
          id: `ce-${i}-${Date.now()}`, claim: item.claim || '', supportingPassage: item.evidence || '',
          passageValidated: item.passageValidated !== false, evidenceType: 'paraphrase' as const,
          assessment: 'unclear' as const, assessmentReason: 'Review the supporting passage to assess.', whatWouldHelp: 'Additional experimental details would clarify.',
        })) });
      }
    } catch (err: any) { guard(); dispatch({ type: 'SET_ERROR', error: err.message }); }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, makeGuard]);

  const runNumericalAudit = useCallback(async () => {
    if (!state.paperText || !state.paperAnalysis) return;
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Running numerical consistency audit...' });
    try {
      // Use AI to propose candidate claims with values, then verify deterministically
      const llmResult = await callAPI('/analyze-paper', { text: state.paperText });
      guard();
      const { auditNumericClaims } = await import('../utils/numericalAudit');
      const claims = (llmResult.evidenceBreakdown || []).map((eb: any) => ({
        claim: eb.claim || '',
        sourcePassage: eb.evidence || '',
        sourceSection: eb.sourceSection || 'Unknown',
      }));
      const audit = auditNumericClaims(claims, state.paperText, state.paperTextHash, state.paperAnalysis.title);
      dispatch({ type: 'SET_NUMERICAL_AUDIT', audit });
    } catch (err: any) { guard(); dispatch({ type: 'SET_ERROR', error: err.message }); }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, state.paperAnalysis, state.paperTextHash, makeGuard]);

  const savePaperSnapshot = useCallback((label: string) => {
    const snapshot: PaperSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      label,
      text: state.paperText,
      textHash: state.paperTextHash,
      savedAt: Date.now(),
      analysis: state.paperAnalysis,
    };
    dispatch({ type: 'ADD_PAPER_SNAPSHOT', snapshot });
    addMemoryItem({ type: 'paper', title: `Snapshot: ${label}`, content: `Paper version saved. Hash: ${state.paperTextHash}`, tags: ['snapshot', label] });
  }, [state.paperText, state.paperTextHash, state.paperAnalysis]);

  const loadPaperSnapshot = useCallback((textHash: string) => {
    if (textHash) {
      dispatch({ type: 'LOAD_PAPER_SNAPSHOT', textHash });
    }
  }, []);

  const compareRevisions = useCallback(async (oldId: string, newId: string) => {
    const older = state.paperSnapshots.find(s => s.id === oldId);
    const newer = state.paperSnapshots.find(s => s.id === newId);
    if (!older || !newer) { dispatch({ type: 'SET_ERROR', error: 'Snapshot not found.' }); return; }
    const { compareRevisions: compare } = await import('../utils/revisionCompare');
    const comparison = compare(older, newer, state.autopsyResult);
    dispatch({ type: 'SET_REVISION_COMPARISON', comparison });
  }, [state.paperSnapshots, state.autopsyResult]);

  const findGaps = useCallback(async (analysis?: PaperAnalysis, text?: string, forceHeuristic?: boolean) => {
    const paperText = text || state.paperText;
    const paperAnalysis = analysis || state.paperAnalysis;
    const paperHash = hashText(paperText);
    if (!paperText || paperText.length < 50) { dispatch({ type: 'SET_ERROR', error: 'No paper loaded to analyze.' }); return; }
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Identifying research gaps...' });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const result = await callAPI('/find-gaps', { text: paperText, analysis: paperAnalysis, forceHeuristic });
      guard();
      const gapMode = result.mode || 'heuristic';
      if (gapMode === 'ai') {
        dispatch({ type: 'SET_GAP_RESULT', gaps: (result.gaps || []) as ResearchGap[], gapPaperHash: paperHash, gapMode, gapError: null });
      } else if (forceHeuristic) {
        // Explicitly requested heuristic — no error
        dispatch({ type: 'SET_GAP_RESULT', gaps: (result.gaps || []) as ResearchGap[], gapPaperHash: paperHash, gapMode, gapError: null });
      } else {
        // AI failed, show error instead of silently substituting
        dispatch({ type: 'SET_GAP_RESULT', gaps: [], gapPaperHash: '', gapMode: '', gapError: 'AI gap analysis failed. The provider returned results in heuristic mode. You can retry AI or use heuristic extraction.' });
      }
    } catch (err: any) {
      guard();
      const msg = err.message || 'AI analysis failed.';
      const kind = err.errorKind || null;
      const status = err.errorStatus ?? null;
      const retryAfter = err.errorRetryAfterSec ?? null;
      dispatch({ type: 'SET_GAP_RESULT', gaps: [], gapPaperHash: '', gapMode: '', gapError: msg, gapErrorKind: kind, gapErrorStatus: status, gapErrorRetryAfterSec: retryAfter });
    }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, state.paperAnalysis, makeGuard]);

  const checkOverlap = useCallback(async (idea: string) => {
    if (!state.paperText && !idea) return;
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Checking idea-paper overlap...' });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const result = await callAPI('/check-overlap', { text: state.paperText, analysis: state.paperAnalysis, idea });
      guard();
      dispatch({ type: 'SET_NOVELTY_CHECK', check: result as NoveltyCheck });
    } catch (err: any) { guard(); dispatch({ type: 'SET_ERROR', error: err.message }); }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, state.paperAnalysis, makeGuard]);

  const analyzeExperiment = useCallback(async (description: string) => {
    if (!description) return;
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Analyzing experiment design...' });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const result = await callAPI('/analyze-experiment', { text: state.paperText, analysis: state.paperAnalysis, description });
      guard();
      dispatch({ type: 'SET_EXPERIMENT_PLAN', plan: result as ExperimentPlan });
    } catch (err: any) { guard(); dispatch({ type: 'SET_ERROR', error: err.message }); }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, state.paperAnalysis, makeGuard]);

  const runAutopsy = useCallback(async () => {
    if (!state.paperText) return;
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Running research autopsy...' });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const result = await callAPI('/run-autopsy', { text: state.paperText, analysis: state.paperAnalysis });
      guard();
      dispatch({ type: 'SET_AUTOPSY', autopsy: result.autopsy, nextSteps: result.nextSteps });
    } catch (err: any) { guard(); dispatch({ type: 'SET_ERROR', error: err.message }); }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, state.paperAnalysis, makeGuard]);

  const runReviewer = useCallback(async () => {
    if (!state.paperText) return;
    const guard = makeGuard();
    dispatch({ type: 'SET_LOADING', isLoading: true, loadingText: 'Reviewer #2 is attacking your research...' });
    dispatch({ type: 'SET_ERROR', error: null });
    try {
      const result = await callAPI('/run-reviewer', { text: state.paperText, analysis: state.paperAnalysis });
      guard();
      if (result.reviewerReport) {
        if (state.autopsyResult) {
          dispatch({ type: 'SET_AUTOPSY', autopsy: { ...state.autopsyResult, reviewerReport: result.reviewerReport }, nextSteps: state.nextSteps || result.nextSteps });
        } else {
          dispatch({ type: 'SET_AUTOPSY', autopsy: { failureRisks: [], reviewerReport: result.reviewerReport }, nextSteps: result.nextSteps || [] });
        }
      }
    } catch (err: any) { guard(); dispatch({ type: 'SET_ERROR', error: err.message }); }
    finally { dispatch({ type: 'SET_LOADING', isLoading: false }); }
  }, [state.paperText, state.paperAnalysis, state.autopsyResult, state.nextSteps, makeGuard]);

  // Memory
  const addMemoryItem = useCallback((item: Omit<ResearchMemoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    dispatch({ type: 'ADD_MEMORY_ITEM', item: { ...item, id: `mem-${now}-${Math.random().toString(36).slice(2, 8)}`, createdAt: now, updatedAt: now } });
  }, []);
  const removeMemoryItem = useCallback((id: string) => dispatch({ type: 'REMOVE_MEMORY_ITEM', id }), []);
  const updateMemoryItem = useCallback((item: ResearchMemoryItem) => dispatch({ type: 'UPDATE_MEMORY_ITEM', item: { ...item, updatedAt: Date.now() } }), []);

  // Experiment briefs
  const addExperimentBrief = useCallback((brief: Omit<ExperimentBrief, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    dispatch({ type: 'SET_EXPERIMENT_BRIEFS', briefs: [...state.experimentBriefs, { ...brief, id: `eb-${now}-${Math.random().toString(36).slice(2, 6)}`, createdAt: now, updatedAt: now }] });
  }, [state.experimentBriefs]);
  const updateExperimentBrief = useCallback((brief: ExperimentBrief) => {
    dispatch({ type: 'SET_EXPERIMENT_BRIEFS', briefs: state.experimentBriefs.map(b => b.id === brief.id ? { ...brief, updatedAt: Date.now() } : b) });
  }, [state.experimentBriefs]);

  // Reviewer responses
  const addReviewerResponse = useCallback((response: Omit<ReviewerResponse, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = Date.now();
    dispatch({ type: 'SET_REVIEWER_RESPONSES', responses: [...state.reviewerResponses, { ...response, id: `rr-${now}-${Math.random().toString(36).slice(2, 6)}`, createdAt: now, updatedAt: now }] });
  }, [state.reviewerResponses]);
  const updateReviewerResponse = useCallback((response: ReviewerResponse) => {
    dispatch({ type: 'SET_REVIEWER_RESPONSES', responses: state.reviewerResponses.map(r => r.id === response.id ? { ...response, updatedAt: Date.now() } : r) });
  }, [state.reviewerResponses]);

  // Backup/Export
  const getBackup = useCallback(() => JSON.stringify({ version: 3, exportedAt: new Date().toISOString(), memory: state.memory, experimentBriefs: state.experimentBriefs, reviewerResponses: state.reviewerResponses, paperSnapshots: state.paperSnapshots }, null, 2), [state.memory, state.experimentBriefs, state.reviewerResponses, state.paperSnapshots]);

  const importBackup = useCallback((json: string) => {
    try {
      const data = JSON.parse(json);
      if (!data.version || data.version < 1) return { success: false, count: 0, errors: ['Invalid backup format.'] };
      const errors: string[] = [];
      let count = 0;
      if (data.memory?.items && Array.isArray(data.memory.items)) {
        const valid = data.memory.items.filter((item: any) => { if (!item.id || !item.title) { errors.push(`Skipping item without id/title`); return false; } return true; });
        count = valid.length;
        dispatch({ type: 'LOAD_MEMORY', items: [...state.memory.items, ...valid] });
      }
      if (data.experimentBriefs) dispatch({ type: 'SET_EXPERIMENT_BRIEFS', briefs: [...state.experimentBriefs, ...data.experimentBriefs] });
      if (data.reviewerResponses) dispatch({ type: 'SET_REVIEWER_RESPONSES', responses: [...state.reviewerResponses, ...data.reviewerResponses] });
      if (data.paperSnapshots) data.paperSnapshots.forEach((s: any) => dispatch({ type: 'ADD_PAPER_SNAPSHOT', snapshot: s }));
      return { success: true, count, errors };
    } catch (e: any) { return { success: false, count: 0, errors: [`Invalid JSON: ${e.message}`] }; }
  }, [state.memory.items, state.experimentBriefs, state.reviewerResponses]);

  const exportReviewPacket = useCallback(() => {
    const { paperAnalysis, claimEvidence, numericalAudit, revisionComparison, researchGaps, autopsyResult, experimentBriefs, reviewerResponses } = state;
    const parts: string[] = [];
    parts.push('# Research Review Packet');
    parts.push(`Generated: ${new Date().toISOString()}`);
    parts.push(`Analysis mode: ${analysisMode}`);
    parts.push('');
    if (paperAnalysis) {
      parts.push('## Paper');
      parts.push(`**Title:** ${paperAnalysis.title}`);
      parts.push(`**Mode:** ${paperAnalysis.mode}`);
      parts.push(`**Version hash:** ${paperAnalysis.paperVersion.textHash}`);
      if (paperAnalysis.mode === 'demo') parts.push('⚠ This paper is a demo/fictional example.');
      if (paperAnalysis.mode === 'heuristic') parts.push('Analysis is heuristic text extraction, not AI understanding.');
      parts.push('');
    }
    if (numericalAudit && numericalAudit.findings.length > 0) {
      parts.push('## Numerical Consistency Audit');
      for (const f of numericalAudit.findings) {
        parts.push(`### ${f.claim}`);
        parts.push(`- **Assessment:** ${f.assessment}`);
        parts.push(`- **Formula:** ${f.formula}`);
        parts.push(`- **Deterministic result:** ${f.deterministicResult ?? 'N/A'}`);
        parts.push(`- **Expected:** ${f.expectedResult ?? 'N/A'}`);
        parts.push(`- **Reason:** ${f.reason}`);
        if (f.userCorrectedValue !== undefined) parts.push(`- **User correction:** ${f.userCorrectedValue} (original: ${f.userOriginalValue})`);
        parts.push('');
      }
    }
    if (revisionComparison) {
      parts.push('## Revision Comparison');
      parts.push(`**Old:** ${revisionComparison.olderTitle}`);
      parts.push(`**New:** ${revisionComparison.newerTitle}`);
      for (const rc of revisionComparison.concerns) {
        parts.push(`### ${rc.concernText.slice(0, 100)}`);
        parts.push(`- **Status:** ${rc.status}`);
        parts.push(`- **Source:** ${rc.determinationSource}`);
        parts.push(`- **Reason:** ${rc.reason}`);
        parts.push('');
      }
    }
    if (claimEvidence.length > 0) {
      parts.push('## Claim-Evidence Analysis');
      for (const ce of claimEvidence) {
        parts.push(`- **${ce.claim}** — ${ce.assessment} (${ce.evidenceType})`);
      }
      parts.push('');
    }
    if (researchGaps.length > 0) {
      parts.push('## Research Gaps');
      for (const g of researchGaps) parts.push(`- ${g.title} (${g.confidenceLevel} confidence)`);
      parts.push('');
    }
    if (autopsyResult) {
      parts.push('## Reviewer #2');
      parts.push(`Score: ${autopsyResult.reviewerReport.overallScore}/10`);
      for (const c of autopsyResult.reviewerReport.majorConcerns) parts.push(`- Major: ${c}`);
      for (const c of autopsyResult.reviewerReport.minorConcerns) parts.push(`- Minor: ${c}`);
      parts.push('');
    }
    if (experimentBriefs.length > 0) {
      parts.push('## Planned Experiments');
      for (const eb of experimentBriefs) parts.push(`- ${eb.hypothesis.slice(0, 80)} (${eb.status})`);
      parts.push('');
    }
    if (reviewerResponses.length > 0) {
      parts.push('## Reviewer Response Plans');
      for (const rr of reviewerResponses) parts.push(`- ${rr.concern.slice(0, 80)} (${rr.status}, work done: ${rr.workCompleted})`);
      parts.push('');
    }
    parts.push('---\n*Generated by Research Autopsy. Includes proposed work and analysis, not verified results.*');
    return parts.join('\n');
  }, [state, analysisMode]);

  return (
    <ResearchContext.Provider value={{
      state, dispatch, analysisMode,
      setModule, confirmNavigation, cancelNavigation, uploadPaper, findGaps, checkOverlap, analyzeExperiment, runAutopsy, runReviewer,
      extractClaimEvidence, runNumericalAudit, savePaperSnapshot, loadPaperSnapshot, compareRevisions,
      loadDemo, clearAll, toggleTheme,
      addMemoryItem, removeMemoryItem, updateMemoryItem,
      getBackup, importBackup,
      addExperimentBrief, updateExperimentBrief,
      addReviewerResponse, updateReviewerResponse,
      exportReviewPacket,
    }}>
      {children}
    </ResearchContext.Provider>
  );
}

export function useResearch() {
  const ctx = useContext(ResearchContext);
  if (!ctx) throw new Error('useResearch must be used within ResearchProvider');
  return ctx;
}