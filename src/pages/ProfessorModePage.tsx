import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { GraduationCap, AlertTriangle, Lightbulb, ChevronDown, ChevronRight } from 'lucide-react';

export function ProfessorModePage() {
  const { state } = useResearch();
  const { professorAnalysis, paperAnalysis } = state;
  const [showScores, setShowScores] = useState(true);

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <GraduationCap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper for a professor-level assessment.</p>
        </div>
      </Card>
    );
  }

  if (!professorAnalysis) {
    return (
      <Card>
        <div className="text-center py-12">
          <GraduationCap className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No professor analysis available. Load the demo project to see an example.</p>
        </div>
      </Card>
    );
  }

  const overallPct = Math.round(
    professorAnalysis.citabilityScores.reduce((sum, s) => sum + s.score, 0) /
    professorAnalysis.citabilityScores.reduce((sum, s) => sum + s.maxScore, 0) * 100
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Professor Mode</h1>
        <p className="text-sm text-slate-400 mt-1">Senior researcher assessment & citability scoring</p>
      </div>

      {/* Executive Summary */}
      <Card className="border-l-2 border-l-emerald-600">
        <div className="flex items-start space-x-3">
          <GraduationCap className="w-6 h-6 text-emerald-400 mt-1 flex-shrink-0" />
          <div>
            <h2 className="text-base font-semibold text-slate-100">Executive Summary</h2>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{professorAnalysis.executiveSummary}</p>
          </div>
        </div>
      </Card>

      {/* Overall Citability */}
      <Card title="Citability Score" subtitle="Overall research quality assessment">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={overallPct >= 70 ? '#10b981' : overallPct >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="3"
                strokeDasharray={`${overallPct * 0.97} 97`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-lg font-bold ${overallPct >= 70 ? 'text-emerald-400' : overallPct >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                {overallPct}%
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-slate-400">{professorAnalysis.overallVerdict}</p>
          </div>
        </div>
      </Card>

      {/* Why This Matters */}
      <Card title="Why This Matters" className="border-l-2 border-l-blue-600">
        <div className="flex items-start space-x-3">
          <Lightbulb className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-slate-300 leading-relaxed">{professorAnalysis.whyThisMatters}</p>
        </div>
      </Card>

      {/* Fatal Flaws */}
      <Card title="Fatal Flaws" subtitle="Issues that must be addressed before publication">
        <div className="space-y-2">
          {professorAnalysis.fatalFlaws.map((flaw, i) => (
            <div key={i} className="flex items-start space-x-3 p-3 bg-red-900/15 border border-red-800/30 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-slate-300">{flaw}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Citability Scores */}
      <Card title="Dimension Breakdown" subtitle="8-point citability assessment">
        <button
          onClick={() => setShowScores(!showScores)}
          className="text-xs text-slate-400 hover:text-slate-200 mb-3 flex items-center space-x-1"
        >
          <span>{showScores ? 'Hide details' : 'Show details'}</span>
          {showScores ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>

        {showScores && (
          <div className="space-y-4">
            {professorAnalysis.citabilityScores.map((cs, i) => (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-200">{cs.dimension}</span>
                  <div className="flex items-center space-x-2">
                    <div className="flex">
                      {Array.from({ length: cs.maxScore / 2 }).map((_, j) => (
                        <div key={j} className={`w-2.5 h-4 mx-px rounded-sm ${j < cs.score / 2 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                      ))}
                    </div>
                    <span className={`text-xs font-bold ${cs.score >= 7 ? 'text-emerald-400' : cs.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                      {cs.score}/{cs.maxScore}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-400">{cs.explanation}</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* How to Make It Publishable */}
      <Card title="How to Make This Publishable" subtitle="Concrete actions for acceptance">
        <ol className="space-y-2">
          {professorAnalysis.howToMakeItPublishable.map((advice, i) => (
            <li key={i} className="flex items-start space-x-3 p-2.5 bg-emerald-900/15 border border-emerald-800/30 rounded-md">
              <span className="text-emerald-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
              <p className="text-sm text-slate-300">{advice}</p>
            </li>
          ))}
        </ol>
      </Card>

      <div className="text-xs text-slate-500 p-3 bg-slate-800/40 border border-slate-700/40 rounded-md">
        <p>Professor Mode analysis is based on the supplied paper text and common academic reviewing standards. Citability scores are qualitative estimates, not validated metrics. Always seek feedback from domain experts.</p>
      </div>
    </div>
  );
}