import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { AlertTriangle, CheckCircle, HelpCircle, Search } from 'lucide-react';

const assessmentIcons: Record<string, React.ReactNode> = {
  consistent: <CheckCircle className="w-4 h-4 text-emerald-400" />,
  inconsistent: <AlertTriangle className="w-4 h-4 text-red-400" />,
  ambiguous: <HelpCircle className="w-4 h-4 text-amber-400" />,
  unable_to_verify: <Search className="w-4 h-4 text-slate-400" />,
};

export function NumericalAuditPage() {
  const { state, runNumericalAudit } = useResearch();
  const { numericalAudit, paperAnalysis, isLoading, demoMode } = state;

  if (!paperAnalysis && !demoMode) {
    return (
      <Card><div className="text-center py-12">
        <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-400">No Paper Loaded</h2>
        <p className="text-sm text-slate-500">Upload a paper to run a numerical consistency audit.</p>
      </div></Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">Numerical Consistency Audit</h1>
          <p className="text-sm text-slate-400 mt-1">Deterministic verification of numeric claims against supplied text</p>
        </div>
        <button onClick={runNumericalAudit} disabled={isLoading}
          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
          {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{isLoading ? 'Auditing...' : 'Run Audit'}</span>
        </button>
      </div>

      {isLoading && (
        <Card><div className="flex flex-col items-center py-8">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm text-slate-400">Running numerical consistency checks...</p>
        </div></Card>
      )}

      {numericalAudit && !isLoading && (
        <>
          <Card className="border-amber-700/40 bg-amber-900/10">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-200/70">
                Numerical audit uses deterministic code for verification. LLM output proposes candidate claims;
                arithmetic validation is performed by the system. All results are tied to the paper version at time of audit.
              </p>
            </div>
          </Card>

          <div className="space-y-4">
            {numericalAudit.findings.map((f, i) => (
              <Card key={f.id} title={`Finding ${i + 1}`} subtitle={f.claim}
                headerRight={<Badge variant={f.assessment === 'consistent' ? 'success' : f.assessment === 'inconsistent' ? 'danger' : f.assessment === 'ambiguous' ? 'warning' : 'default'}>{f.assessment.replace(/_/g, ' ')}</Badge>}>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-md">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Source Passage</h4>
                    <p className="text-sm text-slate-300">{f.sourcePassage}</p>
                    <span className="text-[10px] text-slate-600 mt-1 block">{f.sourceSection}</span>
                    {!f.passageValidated && <p className="text-xs text-amber-400 mt-1">Passage not validated against source text.</p>}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {f.extractedValues.map((v, vi) => (
                      <div key={vi} className="p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-md text-center">
                        <span className="text-[10px] text-slate-500">{v.label}</span>
                        <p className="text-lg font-bold text-slate-200">{v.value}</p>
                        <span className="text-[10px] text-slate-600">{v.unit}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Verification</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-slate-500">Formula:</span> <span className="text-slate-300">{f.formula}</span></div>
                      <div><span className="text-slate-500">Computed:</span> <span className="text-slate-300 font-mono">{f.deterministicResult ?? 'N/A'}</span></div>
                      <div><span className="text-slate-500">Expected:</span> <span className="text-slate-300 font-mono">{f.expectedResult ?? 'N/A'}</span></div>
                      <div><span className="text-slate-500">Tolerance:</span> <span className="text-slate-300">±{f.tolerance}</span></div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-md ${
                    f.assessment === 'consistent' ? 'bg-emerald-900/15 border border-emerald-800/30' :
                    f.assessment === 'inconsistent' ? 'bg-red-900/15 border border-red-800/30' :
                    'bg-amber-900/15 border border-amber-800/30'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {assessmentIcons[f.assessment]}
                      <p className="text-sm text-slate-300">{f.reason}</p>
                    </div>
                  </div>

                  {f.userCorrectedValue !== undefined && (
                    <div className="p-2.5 bg-blue-900/15 border border-blue-800/30 rounded-md text-xs">
                      <span className="text-blue-400 font-semibold">User correction: </span>
                      <span className="text-blue-200">{f.userCorrectedValue} (original: {f.userOriginalValue})</span>
                      {f.userCorrectionNote && <span className="text-blue-300"> — {f.userCorrectionNote}</span>}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {!numericalAudit && !isLoading && (
        <Card><div className="text-center py-8">
          <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Click "Run Audit" to analyze the loaded paper for numerical consistency.</p>
        </div></Card>
      )}
    </div>
  );
}