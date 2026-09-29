export type AnalysisMode = 'ai' | 'heuristic' | 'demo';

export interface PaperVersion {
  textHash: string;
  analyzedAt: number;
  title: string;
}

export interface PaperSnapshot {
  id: string;
  label: string;
  text: string;
  textHash: string;
  savedAt: number;
  analysis: PaperAnalysis | null;
}

export interface PaperAnalysis {
  mode: AnalysisMode;
  paperVersion: PaperVersion;
  title: string;
  abstract: string;
  researchProblem: string;
  researchQuestion: string;
  hypothesis: string;
  methodology: string;
  datasets: string[];
  models: string[];
  experimentalSetup: string;
  evaluationMetrics: string[];
  mainResults: string;
  claimedContributions: string[];
  limitations: string[];
  futureWork: string[];
  importantCitations: string[];
  evidenceBreakdown: { claim: string; evidence: string; sourceSection: string }[];
}

export interface ClaimEvidence {
  id: string;
  claim: string;
  supportingPassage: string;
  passageValidated: boolean;
  evidenceType: 'direct_quotation' | 'paraphrase' | 'numerical_result' | 'method_description';
  assessment: 'supported' | 'partially_supported' | 'unsupported_in_text' | 'unclear';
  assessmentReason: string;
  whatWouldHelp: string;
  userAnnotation?: 'useful' | 'incorrect' | 'needs_investigation';
}

export interface ResearchGap {
  id: string;
  title: string;
  description: string;
  evidence: string;
  evidenceValidated: boolean;
  gapType: 'paper_limitation' | 'field_wide_gap' | 'author_stated' | 'author_claimed_field_gap' | 'author_reported_open_question' | 'inferred_concern' | 'unverified_field_gap_candidate';
  whyItMatters: string;
  explicitlyAcknowledged: boolean;
  potentialDirection: string;
  confidenceLevel: 'High' | 'Moderate' | 'Low';
}

export interface OverlapConcept {
  concept: string;
  overlap: string;
  difference: string;
  needsInvestigation: string;
}

export interface NoveltyCheck {
  riskLevel: 'Low' | 'Moderate' | 'High';
  disclaimer: string;
  similarConcepts: OverlapConcept[];
  potentiallyNovelComponents: string[];
}

export interface ExperimentIssue {
  severity: 'critical' | 'warning' | 'info';
  description: string;
}

export interface ExperimentPlan {
  description: string;
  healthScore: number;
  healthScoreLabel: string;
  criticalIssues: ExperimentIssue[];
  recommendedExperiments: { id: string; name: string; description: string }[];
  experimentMatrix: string[][];
}

export interface FailureRisk {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  explanation: string;
  couldInvalidate: string;
  rulingOutExperiment: string;
}

export interface ReviewerReport {
  overallScore: number;
  scoreLabel: string;
  majorConcerns: string[];
  minorConcerns: string[];
  questions: string[];
  convincingEvidence: string[];
  strengtheningAdvice: string[];
}

export interface AutopsyResult {
  failureRisks: FailureRisk[];
  reviewerReport: ReviewerReport;
}

export interface NextSteps {
  fixFirst: string[];
  investigate: string[];
  strongAreas: string[];
  experimentsToRun: string[];
  literatureToInvestigate: string[];
}

export interface ExperimentBrief {
  id: string;
  concernReference: string;
  hypothesis: string;
  proposedTest: string;
  baselineComparison: string;
  controls: string;
  confounders: string;
  measurementCriteria: string;
  outcomesWouldSupport: string;
  outcomesWouldWeaken: string;
  estimatedEffort: string;
  assumptions: string;
  unknownDetails: string;
  status: 'planned' | 'in_progress' | 'completed' | 'inconclusive';
  createdAt: number;
  updatedAt: number;
}

export interface ReviewerResponse {
  id: string;
  concern: string;
  relevantEvidence: string;
  proposedResponse: string;
  requiredExperimentOrRevision: string;
  status: 'planned' | 'in_progress' | 'completed' | 'inconclusive';
  workCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ResearchMemoryItem {
  id: string;
  type: 'project' | 'question' | 'gap' | 'experiment' | 'finding' | 'failed_approach' | 'paper' | 'contribution' | 'experiment_brief' | 'reviewer_response';
  title: string;
  content: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  data?: ExperimentBrief | ReviewerResponse;
}

export interface ResearchMemory {
  storageVersion: number;
  items: ResearchMemoryItem[];
}

// ---- NUMERICAL CONSISTENCY AUDIT ----

export interface NumericClaim {
  id: string;
  claim: string;
  sourcePassage: string;
  sourceSection: string;
  passageValidated: boolean;
  extractedValues: { label: string; value: number; unit: string }[];
  comparisonDirection: string;
  formula: string;
  deterministicResult: number | null;
  expectedResult: number | null;
  tolerance: number;
  assessment: 'consistent' | 'inconsistent' | 'ambiguous' | 'unable_to_verify';
  reason: string;
  userCorrectedValue?: number;
  userOriginalValue?: number;
  userCorrectionNote?: string;
}

export interface NumericalAudit {
  paperHash: string;
  paperTitle: string;
  findings: NumericClaim[];
  generatedAt: number;
}

// ---- REVISION COMPARISON ----

export interface RevisionConcern {
  id: string;
  concernText: string;
  originalEvidence: string;
  originalSource: string;
  revisedPassage: string;
  status: 'resolved' | 'partially_addressed' | 'still_open' | 'unable_to_assess';
  reason: string;
  determinationSource: 'deterministic' | 'ai_assessment' | 'user_confirmation';
  userOverride?: 'resolved' | 'partially_addressed' | 'still_open' | 'unable_to_assess';
  matchedFindingId?: string;
}

export interface RevisionChange {
  type: 'deleted_claim' | 'new_claim' | 'strengthened' | 'weakened';
  text: string;
  section: string;
}

export interface RevisionComparison {
  id: string;
  olderSnapshotId: string;
  newerSnapshotId: string;
  olderTitle: string;
  newerTitle: string;
  concerns: RevisionConcern[];
  newFindings: RevisionChange[];
  unmatchedOldFindings: string[];
  comparedAt: number;
}

// ---- CONFERENCE ----

export interface Conference {
  id: string;
  name: string;
  acronym: string;
  field: string;
  tier: 'A*' | 'A' | 'B' | 'C';
  deadline: string;
  notificationDate: string;
  cameraReadyDate: string;
  format: 'double_blind' | 'single_blind' | 'open';
  pageLimit: number;
  formatTemplate: string;
  templateUrl: string;
  templateUrlVerified: boolean;
  location: string;
  month: string;
  submissionCycle: string;
}

export interface ConferenceSubmission {
  id: string;
  conferenceId: string;
  title: string;
  status: 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'camera_ready';
  submittedAt: number | null;
  deadline: string;
  notes: string;
}

export interface AIProcessTask {
  id: string;
  type: string;
  label: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  result: string;
  startedAt: number | null;
  completedAt: number | null;
  error: string | null;
}

export interface AIEngineState {
  isRunning: boolean;
  tasks: AIProcessTask[];
  activeTaskCount: number;
  totalTasksCompleted: number;
  lastRunAt: number | null;
}

// ---- LEGACY TYPES (preserved for existing modules) ----

export type ModuleType = string;

export interface TimelineAnalysis { events: any[]; rebuttalPredictions: any[]; overallOutlook: string }
export interface AdversarialAnalysis { cases: any[]; overallResilience: string; weakestAreas: string[]; strongestAreas: string[] }
export interface StatisticalPowerAnalysis { analysis: any[]; recommendation: string; simulationParams: any }
export interface RelatedWorkMatrix { entries: any[]; summary: string; suggestedComparisons: string[] }
export interface ProfessorAnalysis { executiveSummary: string; whyThisMatters: string; fatalFlaws: string[]; citabilityScores: any[]; overallVerdict: string; howToMakeItPublishable: string[] }
export interface RebuttalLetter { editorSalutation: string; opening: string; pointByPoint: any[]; closing: string }
export interface AIDetectionResult { overallScore: number; sentences: any[]; breakdown: any[]; summary: string }
export interface SourceTraceResult { matches: any[]; overallOriginality: number; mostMatchedSource: string; summary: string }
export interface EditorDocument { id: string; title: string; content: string; version: number; createdAt: number; updatedAt: number }
export interface TrackChange { id: string; type: string; position: number; length: number; text: string; timestamp: number; resolved: boolean }
export interface ResearchNode { id: string; label: string; type: string; connections: string[] }
export interface GraphEdge {
  from: string;
  to: string;
  label: string;
  type: string;
  provenance: 'sourced' | 'inferred' | 'unknown';
  sourceReference?: string;
}
export interface ResearchGraphData { nodes: ResearchNode[]; edges: GraphEdge[]; insights: string[]; methodologyClusters: string[]; missingLinks: string[] }
export interface PCReviewer { id: string; name: string; expertise: string; personality: string; stance: string; score: number; concerns: string[]; strengths: string[]; finalVerdict: string }
export interface PCMeeting { reviewers: PCReviewer[]; discussionLog: any[]; finalOutcome: string; metaReview: string; consensus: string }
export interface RoadmapPhase { id: string; name: string; startWeek: number; durationWeeks: number; tasks: string[]; milestone: string; status: string; dependsOn: string[] }
export interface Roadmap { title: string; targetVenue: string; deadline: string; weeksUntilDeadline: number; phases: RoadmapPhase[]; criticalPath: string[]; riskFactors: string[] }
export interface AlignmentIssue { id: string; section: string; type: string; description: string; severity: string; suggestion: string; lineNumber?: number }
export interface PaperAlignment { title: string; sectionCount: number; wordCount: number; issues: AlignmentIssue[]; structuralScore: number; consistencyScore: number; formatScore: number; overallHealth: number; targetVenue: string; missingSections: string[] }

// ---- QUEUE, LAYOUT, PALETTE ----

export interface QueueItem {
  id: string;
  sourceModule: string;
  sourceId: string;
  title: string;
  preview: string;
  type: 'concern' | 'experiment' | 'reviewer_task' | 'finding';
  severity: string;
  status: string;
  pinned: boolean;
  userPriority: number;
  userNote: string;
  nextAction: string;
  nextActionTarget: string;
}

export interface LayoutState {
  sidebarCollapsed: boolean;
  evidencePanelOpen: boolean;
  evidencePanelWidth: number;
}

export interface DraftState {
  content: string;
  savedAt: number;
  version: number;
}

export interface ResearchState {
  currentModule: string;
  paperText: string;
  paperTextHash: string;
  paperAnalysis: PaperAnalysis | null;
  paperAnalysisHash: string;
  paperSnapshots: PaperSnapshot[];
  claimEvidence: ClaimEvidence[];
  numericalAudit: NumericalAudit | null;
  revisionComparison: RevisionComparison | null;
  researchGaps: ResearchGap[];
  noveltyCheck: NoveltyCheck | null;
  experimentPlan: ExperimentPlan | null;
  experimentBriefs: ExperimentBrief[];
  reviewerResponses: ReviewerResponse[];
  autopsyResult: AutopsyResult | null;
  nextSteps: NextSteps | null;
  timeline: TimelineAnalysis | null;
  adversarial: AdversarialAnalysis | null;
  statisticalPower: StatisticalPowerAnalysis | null;
  relatedWork: RelatedWorkMatrix | null;
  professorAnalysis: ProfessorAnalysis | null;
  rebuttalLetter: RebuttalLetter | null;
  aiDetection: AIDetectionResult | null;
  sourceTrace: SourceTraceResult | null;
  editorDoc: EditorDocument | null;
  trackChanges: TrackChange[];
  conferences: Conference[];
  submissions: ConferenceSubmission[];
  aiEngine: AIEngineState;
  researchGraph: ResearchGraphData | null;
  pcMeeting: PCMeeting | null;
  roadmap: Roadmap | null;
  paperAlignment: PaperAlignment | null;
  memory: ResearchMemory;
  isLoading: boolean;
  loadingText: string;
  error: string | null;
  darkMode: boolean;
  demoMode: boolean;
  resultPaperHash: string;
  /** Which paper's gaps are stored */
  gapPaperHash: string;
  gapMode: string;
  gapError: string | null;
  gapErrorKind: string | null;
  gapErrorStatus: number | null;
  gapErrorRetryAfterSec: number | null;
  /** Tracks when editor has unsaved changes */
  editorDirty: boolean;
  /** Tracks when editor has unsaved changes */
  navigationTarget: string | null;
  layout: LayoutState;
  queue: QueueItem[];
  /** Auto-save draft for editor */
  draftState: DraftState | null;
  /** Backend connectivity status */
  backendStatus: 'unknown' | 'connected' | 'disconnected';
  /** Guard token to prevent stale updates */
  requestGuard: number;
}