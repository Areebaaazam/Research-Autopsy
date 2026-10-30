import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PaperHealthScorecard } from '../components/PaperHealthScorecard';
import { BookOpen, AlertTriangle, ArrowRight, FileText, Layers } from 'lucide-react';

export function DashboardPage() {
  const { state, setModule, loadDemo, loadPaperSnapshot, analysisMode } = useResearch();
  const { paperAnalysis, claimEvidence, researchGaps, experimentBriefs,
    reviewerResponses, autopsyResult, nextSteps, memory, demoMode, numericalAudit, revisionComparison, paperSnapshots } = state;

  const hasResearch = paperAnalysis || demoMode;

  // Highest-priority grounded finding
  const topFindingText: string | null = (() => {
    const inc = numericalAudit?.findings?.find(f => f.assessment === 'inconsistent');
    if (inc) return inc.claim;
    const risk = autopsyResult?.failureRisks?.find(r => r.severity === 'HIGH');
    if (risk) return risk.title;
    const concern = autopsyResult?.reviewerReport?.majorConcerns?.[0];
    if (concern) return concern;
    return null;
  })();

  const unresolvedConcerns = revisionComparison?.concerns?.filter(c => c.status === 'still_open' || c.status === 'partially_addressed').length || 0;
  const plannedExperiments = experimentBriefs.filter(b => b.status === 'planned').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Research Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Find a weakness · Trace the evidence · Check the fix</p>
        </div>
        {!hasResearch && (
          <button onClick={loadDemo} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2 shadow-sm">
            <BookOpen className="w-4 h-4" /><span>Load Demo Project</span>
          </button>
        )}
      </div>

      {!hasResearch ? (
        <Card><div className="text-center py-12">
          <div className="w-14 h-14 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-slate-500" />
          </div>
          <h2 className="text-lg font-semibold text-slate-300 mb-2">No Research Loaded</h2>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">Upload a research paper to analyze claims, trace evidence, and check your fixes.</p>
          <div className="flex justify-center space-x-3">
            <button onClick={loadDemo} className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md shadow-sm">Load Demo Project</button>
            <button onClick={() => setModule('papers')} className="px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md">Upload Paper</button>
          </div>
        </div></Card>
      ) : (
        <>
          {/* Current paper & mode */}
          <Card>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 mr-4">
                <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                  <Badge variant={analysisMode === 'demo' ? 'warning' : analysisMode === 'ai' ? 'success' : 'default'}>
                    {analysisMode === 'demo' ? 'Demo (fictional)' : analysisMode === 'ai' ? 'AI-powered' : 'Heuristic extraction'}
                  </Badge>
                  {state.paperAnalysis?.paperVersion?.textHash && (
                    <span className="text-[10px] text-slate-500 font-mono">v{state.paperAnalysis.paperVersion.textHash.slice(0, 8)}</span>
                  )}
                  {paperSnapshots.length > 0 && (
                    <div className="flex items-center space-x-1.5 ml-auto text-xs bg-slate-800/90 px-2 py-0.5 rounded border border-slate-700">
                      <Layers className="w-3 h-3 text-slate-400" />
                      <select
                        value={state.paperTextHash || ''}
                        onChange={e => loadPaperSnapshot(e.target.value)}
                        className="bg-transparent text-slate-300 text-xs focus:outline-none cursor-pointer">
                        <option value="" className="bg-slate-900">Current Paper Version</option>
                        {paperSnapshots.map(snap => (
                          <option key={snap.id} value={snap.textHash} className="bg-slate-900">
                            {snap.label} ({snap.textHash.slice(0, 6)})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-slate-100 truncate">{paperAnalysis?.title || 'Untitled'}</h2>
                {paperAnalysis?.abstract && <p className="text-sm text-slate-400 mt-1 line-clamp-2">{paperAnalysis.abstract.slice(0, 300)}</p>}
              </div>
              <div className="flex-shrink-0 space-y-1.5">
                <button onClick={() => setModule('papers')} className="w-full px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center space-x-1">
                  <FileText className="w-3 h-3" /><span>View paper</span>
                </button>
                <button onClick={() => setModule('numericalAudit')} className="w-full px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center space-x-1">
                  <AlertTriangle className="w-3 h-3" /><span>Run audit</span>
                </button>
              </div>
            </div>
          </Card>

          {/* Interactive Paper Health Scorecard */}
          <PaperHealthScorecard />

          {/* Top actionable concern */}
          {topFindingText && (
            <Card className="border-l-2 border-l-red-500">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-200">Top Concern</h3>
                  <p className="text-sm text-slate-300 mt-1">{topFindingText}</p>
                  {numericalAudit?.findings?.some(f => f.assessment === 'inconsistent') && (
                    <p className="text-xs text-slate-400 mt-1">Numerical inconsistency detected. Run the audit for details.</p>
                  )}
                </div>
                <button onClick={() => setModule('numericalAudit')} className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 flex-shrink-0">
                  <span>Review</span><ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button onClick={() => setModule('claimExplorer')} className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4 text-left hover:bg-slate-800 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Findings</span>
                <span className="text-lg font-bold text-slate-200">{claimEvidence.length}</span>
              </div>
              <p className="text-sm text-slate-300">Claim–Evidence pairs</p>
              <p className="text-xs text-slate-500 mt-0.5">{claimEvidence.filter(c => c.assessment === 'supported').length} supported</p>
            </button>
            <button onClick={() => setModule('experiments')} className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4 text-left hover:bg-slate-800 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Planned</span>
                <span className="text-lg font-bold text-slate-200">{plannedExperiments}</span>
              </div>
              <p className="text-sm text-slate-300">Experiments to verify</p>
              <p className="text-xs text-slate-500 mt-0.5">{experimentBriefs.filter(b => b.status === 'completed').length} completed</p>
            </button>
            <button onClick={() => setModule('revisionCompare')} className="bg-slate-800/80 border border-slate-700/60 rounded-lg p-4 text-left hover:bg-slate-800 transition-colors shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 uppercase tracking-wider">Revisions</span>
                <span className="text-lg font-bold text-slate-200">{unresolvedConcerns}</span>
              </div>
              <p className="text-sm text-slate-300">Open concerns</p>
              <p className="text-xs text-slate-500 mt-0.5">{revisionComparison?.concerns?.filter(c => c.status === 'resolved').length || 0} resolved</p>
            </button>
          </div>

          {/* Next steps from autopsy */}
          {nextSteps && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-red-400 uppercase mb-2 flex items-center space-x-1">
                  <span>🔴</span><span>Fix First</span>
                </h3>
                <ul className="space-y-1">
                  {nextSteps.fixFirst.slice(0, 2).map((item, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start space-x-1.5">
                      <span className="text-red-400 flex-shrink-0">{i + 1}.</span><span>{item}</span>
                    </li>
                  ))}
                  {nextSteps.fixFirst.length > 2 && <li className="text-xs text-slate-500">+{nextSteps.fixFirst.length - 2} more</li>}
                </ul>
              </div>
              <div className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-4">
                <h3 className="text-xs font-semibold text-blue-400 uppercase mb-2">🧪 Experiments To Run</h3>
                <ul className="space-y-1">
                  {nextSteps.experimentsToRun.slice(0, 2).map((item, i) => (
                    <li key={i} className="text-sm text-slate-300">{item}</li>
                  ))}
                  {nextSteps.experimentsToRun.length > 2 && <li className="text-xs text-slate-500">+{nextSteps.experimentsToRun.length - 2} more</li>}
                </ul>
              </div>
            </div>
          )}

          {/* Supporting metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-md p-2.5 text-center">
              <span className="text-xs text-slate-500">Gaps</span>
              <p className="text-base font-bold text-slate-200">{researchGaps.length}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-md p-2.5 text-center">
              <span className="text-xs text-slate-500">Numerical issues</span>
              <p className={`text-base font-bold ${numericalAudit?.findings?.some(f => f.assessment === 'inconsistent') ? 'text-red-400' : 'text-slate-200'}`}>
                {numericalAudit?.findings?.filter(f => f.assessment === 'inconsistent').length || 0}
              </p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-md p-2.5 text-center">
              <span className="text-xs text-slate-500">Reviewer responses</span>
              <p className="text-base font-bold text-slate-200">{reviewerResponses.length}</p>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/40 rounded-md p-2.5 text-center">
              <span className="text-xs text-slate-500">Memory items</span>
              <p className="text-base font-bold text-slate-200">{memory.items.length}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}