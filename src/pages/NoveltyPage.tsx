import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { AlertCircle, FlaskConical } from 'lucide-react';
import type { OverlapConcept } from '../types';

export function NoveltyPage() {
  const { state, checkOverlap } = useResearch();
  const { paperAnalysis, noveltyCheck, isLoading, demoMode } = state;
  const [idea, setIdea] = useState('');

  if (!paperAnalysis && !demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <FlaskConical className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Paper Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload a paper first to check idea–paper overlap.</p>
        </div>
      </Card>
    );
  }

  const handleSubmit = () => {
    if (idea.trim()) checkOverlap(idea.trim());
  };

  const riskColors: Record<string, string> = {
    Low: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
    Moderate: 'text-amber-400 border-amber-700/50 bg-amber-900/20',
    High: 'text-red-400 border-red-700/50 bg-red-900/20'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Idea–Paper Overlap</h1>
        <p className="text-sm text-slate-400 mt-1">Check overlap between your idea and the loaded paper</p>
      </div>

      <Card className="border-amber-700/40 bg-amber-900/10">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Important Limitation</h4>
            <p className="text-sm text-amber-200/70 mt-1">
              This tool checks overlap between your idea and <strong>the loaded paper only</strong>.
              It does <strong>not</strong> assess novelty across the broader research literature.
              A thorough literature review is required to establish true novelty.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Enter Your Research Idea" subtitle="Describe your proposed contribution or research direction">
        <div className="space-y-4">
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value)}
            placeholder='e.g., "Adaptive failure-specific intervention for LLM reasoning using memory of previous failures."'
            className="w-full h-32 bg-slate-900/60 border border-slate-700 rounded-md p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !idea.trim()}
            className="px-5 py-2.5 bg-purple-700 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FlaskConical className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Checking...' : 'Check Overlap'}</span>
          </button>
        </div>
      </Card>

      {isLoading && (
        <Card>
          <div className="flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Analyzing potential overlaps...</p>
          </div>
        </Card>
      )}

      {noveltyCheck && !isLoading && (
        <>
          <Card
            title="Overlap Assessment"
            headerRight={
              <div className={`px-3 py-1.5 rounded-md border text-sm font-medium ${riskColors[noveltyCheck.riskLevel]}`}>
                OVERLAP RISK: {noveltyCheck.riskLevel}
              </div>
            }
          >
            <div className="space-y-6">
              {noveltyCheck.disclaimer && (
                <div className="flex items-start space-x-3 p-4 bg-blue-900/20 border border-blue-800/40 rounded-md">
                  <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-blue-200/80">{noveltyCheck.disclaimer}</p>
                </div>
              )}

              <h3 className="text-sm font-semibold text-slate-300">Similar Concepts Found</h3>
              <div className="space-y-4">
                {noveltyCheck.similarConcepts.map((concept: OverlapConcept, i: number) => (
                  <div key={i} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-md space-y-3">
                    <h4 className="text-sm font-medium text-slate-200">Potential Overlap: {concept.concept}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-2.5 bg-red-900/20 border border-red-800/40 rounded">
                        <span className="text-xs font-semibold text-red-400 uppercase">Overlap</span>
                        <p className="text-sm text-red-200/80 mt-1">{concept.overlap}</p>
                      </div>
                      <div className="p-2.5 bg-emerald-900/20 border border-emerald-800/40 rounded">
                        <span className="text-xs font-semibold text-emerald-400 uppercase">Difference</span>
                        <p className="text-sm text-emerald-200/80 mt-1">{concept.difference}</p>
                      </div>
                    </div>
                    <div className="p-2.5 bg-amber-900/20 border border-amber-800/40 rounded">
                      <span className="text-xs font-semibold text-amber-400 uppercase">Needs Investigation</span>
                      <p className="text-sm text-amber-200/80 mt-1">{concept.needsInvestigation}</p>
                    </div>
                  </div>
                ))}
              </div>

              {noveltyCheck.potentiallyNovelComponents.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-300 mb-3">Potentially Differentiating Components</h3>
                  <ul className="space-y-2">
                    {noveltyCheck.potentiallyNovelComponents.map((comp: string, i: number) => (
                      <li key={i} className="flex items-start space-x-2 text-sm text-emerald-300">
                        <span className="text-emerald-400 mt-0.5">◆</span>
                        <span>{comp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}