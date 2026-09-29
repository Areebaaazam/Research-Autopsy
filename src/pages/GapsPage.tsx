import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AlertCircle, Lightbulb, Target, CheckCircle, RefreshCw } from 'lucide-react';
import type { ResearchGap } from '../types';

export function GapsPage() {
  const { state, findGaps, setModule } = useResearch();
  const { researchGaps, paperAnalysis, paperText, isLoading, demoMode, gapPaperHash, gapMode, gapError, gapErrorKind, gapErrorStatus, gapErrorRetryAfterSec, paperTextHash } = state;

  // Check if displayed gaps belong to the current paper
  const gapsAreStale = gapPaperHash && gapPaperHash !== paperTextHash;
  const noGapsYet = researchGaps.length === 0 && !gapError;

  const handleRetryAi = () => {
    findGaps(paperAnalysis || undefined, paperText || undefined, false);
  };
  const handleHeuristic = () => {
    findGaps(paperAnalysis || undefined, paperText || undefined, true);
  };

  if (!paperAnalysis && !demoMode) {
    return (
      <Card><div className="text-center py-12">
        <Lightbulb className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-400">No Paper Analyzed</h2>
        <p className="text-sm text-slate-500 mt-1">Upload a paper first to identify research gaps.</p>
      </div></Card>
    );
  }

  if (isLoading) {
    return (
      <Card><div className="flex flex-col items-center py-12">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm text-slate-400">Analyzing for research gaps...</p>
      </div></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Research Gap Finder</h1>
          <p className="text-sm text-slate-400 mt-1">
            {researchGaps.length > 0 ? `${researchGaps.length} gaps identified` : 'No gaps loaded'}
          </p>
        </div>
        <button onClick={handleRetryAi} disabled={isLoading || !paperText}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 text-xs rounded-md transition-colors flex items-center space-x-1">
          <RefreshCw className="w-3.5 h-3.5" /><span>Re-analyze gaps</span>
        </button>
      </div>

      {/* Provenance bar */}
      {gapMode && (
        <div className="flex items-center space-x-2 text-xs">
          <span className={`font-medium ${gapMode === 'ai' ? 'text-emerald-400' : 'text-amber-400'}`}>
            {gapMode === 'ai' ? 'AI-powered' : 'Heuristic extraction'}
          </span>
          <span className="text-slate-600">|</span>
          {state.gapPaperHash && <span className="text-slate-600 font-mono">v{state.gapPaperHash.slice(0, 8)}</span>}
          {gapsAreStale && <span className="text-amber-400">(stale — paper has changed)</span>}
        </div>
      )}

      {/* Error / AI failure */}
      {gapError && !gapMode && (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-md">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-300">AI analysis failed</h4>
              <p className="text-sm text-red-200/70 mt-1">{gapError}</p>
              {gapErrorKind && (
                <p className="text-xs text-red-300/60 mt-1">
                  Error details: {gapErrorKind}
                  {gapErrorStatus ? ` (status ${gapErrorStatus})` : ''}
                  {gapErrorRetryAfterSec ? ` — retry after ${gapErrorRetryAfterSec}s` : ''}
                </p>
              )}
              <div className="flex items-center space-x-3 mt-3">
                <button onClick={handleRetryAi} disabled={isLoading}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-xs rounded-md transition-colors flex items-center space-x-1">
                  <RefreshCw className="w-3.5 h-3.5" /><span>Retry AI</span>
                </button>
                <button onClick={handleHeuristic} disabled={isLoading}
                  className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 text-white text-xs rounded-md transition-colors flex items-center space-x-1">
                  <span>Use heuristic extraction</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI heuristic notice */}
      {gapMode === 'heuristic' && researchGaps.length > 0 && !gapError && (
        <div className="p-3 bg-amber-900/15 border border-amber-800/30 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-200/80">AI gap analysis was not available. Results below are from heuristic extraction.</p>
        </div>
      )}

      {/* Stale results warning */}
      {gapsAreStale && researchGaps.length > 0 && (
        <div className="p-3 bg-amber-900/15 border border-amber-800/30 rounded-md flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-200/80">These gaps were identified for a different paper version. Re-analyze for the current paper.</p>
        </div>
      )}

      {/* Empty state */}
      {noGapsYet && !gapError && (
        <Card><div className="text-center py-8">
          <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No gap analysis has been run for this paper yet.</p>
          <button onClick={() => setModule('papers')} className="mt-3 text-sm text-emerald-400 hover:text-emerald-300 underline">
            Go to Papers to analyze
          </button>
        </div></Card>
      )}

      {/* Gap cards */}
      <div className="space-y-3">
        {researchGaps.map((gap, index) => (
          <GapCard key={gap.id} gap={gap} index={index} />
        ))}
      </div>
    </div>
  );
}

function GapCard({ gap, index }: { gap: ResearchGap; index: number }) {
  const confidenceColors: Record<string, string> = {
    High: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/30',
    Moderate: 'text-amber-400 border-amber-700/50 bg-amber-900/30',
    Low: 'text-slate-400 border-slate-700/50 bg-slate-800/50'
  };

  const gapTypeColors: Record<string, { variant: 'info' | 'warning' | 'danger' | 'default' | 'success'; label: string }> = {
    paper_limitation: { variant: 'default', label: 'Paper limitation' },
    field_wide_gap: { variant: 'info', label: 'Field-wide gap' },
    author_stated: { variant: 'info', label: 'Author-stated gap' },
    author_claimed_field_gap: { variant: 'warning', label: 'Author-claimed field gap' },
    author_reported_open_question: { variant: 'default', label: 'Author-reported question' },
    inferred_concern: { variant: 'warning', label: 'Inferred concern' },
    unverified_field_gap_candidate: { variant: 'warning', label: 'Unverified gap candidate' },
  };

  const tc = gapTypeColors[gap.gapType] || { variant: 'default' as const, label: gap.gapType };

  return (
    <Card id={`gap-${gap.id}`}
      title={`GAP ${String(index + 1).padStart(2, '0')}`}
      subtitle={gap.title}
      headerRight={
        <div className="flex items-center space-x-2">
          <Badge variant={tc.variant}>{tc.label}</Badge>
          <Badge variant={gap.explicitlyAcknowledged ? 'warning' : 'default'}>
            {gap.explicitlyAcknowledged ? 'Acknowledged' : 'Unacknowledged'}
          </Badge>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${confidenceColors[gap.confidenceLevel]}`}>
            {gap.confidenceLevel}
          </span>
        </div>
      }
    >
      <div className="space-y-4">
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Description</h4>
          <p className="text-sm text-slate-300">{gap.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-emerald-900/20 border border-emerald-800/40 rounded-md">
            <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">
              Evidence {gap.evidenceValidated && <CheckCircle className="w-3 h-3 inline ml-1" />}
              {!gap.evidenceValidated && <span className="text-xs text-amber-400 ml-1">(not validated)</span>}
            </h4>
            <p className="text-sm text-emerald-200/80">{gap.evidence}</p>
            {!gap.evidenceValidated && (
              <p className="text-xs text-amber-400 mt-1">This passage could not be verified against the source text.</p>
            )}
          </div>
          <div className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-md">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Why It Matters</h4>
            <p className="text-sm text-blue-200/80">{gap.whyItMatters}</p>
          </div>
        </div>

        <div className="p-3 bg-purple-900/20 border border-purple-800/40 rounded-md">
          <div className="flex items-start space-x-2">
            <Target className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Potential Research Direction</h4>
              <p className="text-sm text-purple-200/80">{gap.potentialDirection}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}