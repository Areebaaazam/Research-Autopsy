import { useResearch } from '../context/ResearchContext';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { CheckCircle2, AlertTriangle, BookOpen, ArrowRight, Layers, FileText, Activity } from 'lucide-react';

export function PaperHealthScorecard() {
  const { state, setModule, loadPaperSnapshot } = useResearch();
  const { paperAnalysis, claimEvidence, numericalAudit, researchGaps, revisionComparison, paperSnapshots } = state;

  if (!paperAnalysis && !state.demoMode) return null;

  // Claim Support Metric
  const totalClaims = claimEvidence.length;
  const supportedClaims = claimEvidence.filter(c => c.assessment === 'supported').length;
  const claimSupportPct = totalClaims > 0 ? Math.round((supportedClaims / totalClaims) * 100) : 0;

  // Numerical Consistency Metric
  const totalNumeric = numericalAudit?.findings?.length || 0;
  const consistentNumeric = numericalAudit?.findings?.filter(f => f.assessment === 'consistent').length || 0;
  const numericInconsistent = numericalAudit?.findings?.filter(f => f.assessment === 'inconsistent').length || 0;
  const numericConsistencyPct = totalNumeric > 0 ? Math.round((consistentNumeric / totalNumeric) * 100) : 100;

  // Gaps & Revisions
  const gapsCount = researchGaps.length;
  const openConcernsCount = revisionComparison?.concerns?.filter(c => c.status === 'still_open' || c.status === 'partially_addressed').length || 0;

  // Overall Health Score Calculation
  let totalPoints = 0;
  let maxPoints = 0;

  if (totalClaims > 0) {
    totalPoints += (supportedClaims / totalClaims) * 40;
    maxPoints += 40;
  }
  if (totalNumeric > 0) {
    totalPoints += (consistentNumeric / totalNumeric) * 30;
    maxPoints += 30;
  }
  if (openConcernsCount === 0) {
    totalPoints += 15;
  } else {
    totalPoints += Math.max(0, 15 - openConcernsCount * 3);
  }
  maxPoints += 15;

  if (gapsCount <= 2) totalPoints += 15;
  else if (gapsCount <= 5) totalPoints += 10;
  else totalPoints += 5;
  maxPoints += 15;

  const healthScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 85;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/60';
    if (score >= 60) return 'text-amber-400 bg-amber-950/40 border-amber-800/60';
    return 'text-red-400 bg-red-950/40 border-red-800/60';
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-800/40 border border-slate-700/60 shadow-lg backdrop-blur-sm p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100 tracking-tight">Paper Health & Consistency Scorecard</h3>
            <Badge variant={healthScore >= 75 ? 'success' : healthScore >= 50 ? 'warning' : 'danger'}>
              {healthScore >= 75 ? 'Strong Foundation' : healthScore >= 50 ? 'Needs Attention' : 'Critical Issues'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 mt-1">Real-time assessment across claim verification, numerical consistency, and open gaps.</p>
        </div>

        {paperSnapshots.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700/60 text-xs">
            <Layers className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <span className="text-slate-400 font-medium hidden sm:inline">Version:</span>
            <select
              value={state.paperTextHash || ''}
              onChange={e => loadPaperSnapshot(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700/80 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono text-xs">
              <option value="">Current Analysis</option>
              {paperSnapshots.map(snap => (
                <option key={snap.id} value={snap.textHash}>
                  {snap.label} ({snap.textHash.slice(0, 7)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Claim Support Card */}
        <div onClick={() => setModule('claimExplorer')}
          className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 rounded-lg p-3.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Claim Support</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-slate-100">{totalClaims > 0 ? `${claimSupportPct}%` : 'N/A'}</span>
            <span className="text-xs text-slate-400">({supportedClaims}/{totalClaims} verified)</span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${claimSupportPct}%` }} />
          </div>
        </div>

        {/* Numerical Audit Card */}
        <div onClick={() => setModule('numericalAudit')}
          className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/50 rounded-lg p-3.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <AlertTriangle className={`w-3.5 h-3.5 ${numericInconsistent > 0 ? 'text-red-400' : 'text-emerald-400'}`} />
              <span>Numerical Consistency</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-extrabold ${numericInconsistent > 0 ? 'text-red-400' : 'text-slate-100'}`}>
              {totalNumeric > 0 ? `${numericConsistencyPct}%` : '100%'}
            </span>
            <span className="text-xs text-slate-400">
              {numericInconsistent > 0 ? `${numericInconsistent} flags` : 'All verified'}
            </span>
          </div>
          <div className="w-full bg-slate-700/60 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className={`h-1.5 rounded-full transition-all duration-500 ${numericInconsistent > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}
              style={{ width: `${numericConsistencyPct}%` }} />
          </div>
        </div>

        {/* Research Gaps Card */}
        <div onClick={() => setModule('gaps')}
          className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-blue-500/50 rounded-lg p-3.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>Identified Gaps</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-extrabold text-slate-100">{gapsCount}</span>
            <span className="text-xs text-slate-400">unaddressed gaps</span>
          </div>
          <div className="text-[11px] text-blue-400/90 mt-2 flex items-center space-x-1">
            <span>Explore opportunities</span>
          </div>
        </div>

        {/* Revision Open Concerns Card */}
        <div onClick={() => setModule('revisionCompare')}
          className="group cursor-pointer bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-purple-500/50 rounded-lg p-3.5 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <FileText className="w-3.5 h-3.5 text-purple-400" />
              <span>Open Concerns</span>
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-xl font-extrabold ${openConcernsCount > 0 ? 'text-amber-400' : 'text-slate-100'}`}>
              {openConcernsCount}
            </span>
            <span className="text-xs text-slate-400">pending resolution</span>
          </div>
          <div className="text-[11px] text-purple-400/90 mt-2 flex items-center space-x-1">
            <span>Compare versions</span>
          </div>
        </div>
      </div>

      {/* Health Indicator Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
        <span className="text-slate-400">Composite Paper Health Rating:</span>
        <div className={`px-2.5 py-1 rounded-md border font-semibold flex items-center space-x-1.5 ${getScoreColor(healthScore)}`}>
          <span>{healthScore} / 100</span>
        </div>
      </div>
    </Card>
  );
}