import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Beaker, ChevronDown, ChevronRight } from 'lucide-react';
import { ExperimentBriefPage } from './ExperimentBriefPage';

export function ExperimentsPage() {
  const { state, analyzeExperiment } = useResearch();
  const { experimentPlan, paperAnalysis, isLoading, demoMode } = state;
  const [description, setDescription] = useState('');
  const [showMatrix, setShowMatrix] = useState(true);
  const [view, setView] = useState<'doctor' | 'planner'>('planner');

  if (!paperAnalysis && !demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Beaker className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Paper Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload a paper first to design and analyze experiments.</p>
        </div>
      </Card>
    );
  }

  const handleAnalyze = () => {
    if (description.trim()) analyzeExperiment(description.trim());
  };

  const severityColors = { critical: 'danger', warning: 'warning', info: 'info' } as const;
  const severityIcons = { critical: '🔴', warning: '🟠', info: '🔵' };

  const healthColor = experimentPlan
    ? experimentPlan.healthScore >= 75 ? 'text-emerald-400'
      : experimentPlan.healthScore >= 50 ? 'text-amber-400'
      : 'text-red-400'
    : '';

  if (view === 'planner') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">Experiments</h1>
            <p className="text-sm text-slate-400 mt-1">Design and manage experiments</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setView('doctor')} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
              Experiment Doctor
            </button>
          </div>
        </div>
        <ExperimentBriefPage />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Experiment Doctor</h1>
          <p className="text-sm text-slate-400 mt-1">Stress-test your experimental plan</p>
        </div>
        <button onClick={() => setView('planner')} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
          Experiment Planner
        </button>
      </div>

      <Card title="Describe Your Experiment">
        <div className="space-y-4">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder='e.g., "Compare baseline Chain-of-Thought against adaptive intervention across GSM8K and SVAMP. Measure accuracy and token usage."'
            className="w-full h-32 bg-slate-900/60 border border-slate-700 rounded-md p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading || !description.trim()}
            className="px-5 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Beaker className="w-4 h-4" />
            )}
            <span>{isLoading ? 'Analyzing...' : 'Analyze Experiment Design'}</span>
          </button>
        </div>
      </Card>

      {isLoading && (
        <Card>
          <div className="flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Analyzing experimental design...</p>
          </div>
        </Card>
      )}

      {experimentPlan && !isLoading && (
        <>
          <Card
            title="Experiment Health"
            headerRight={
              <div className="text-right">
                <span className={`text-2xl font-bold ${healthColor}`}>{experimentPlan.healthScore}/100</span>
                <p className="text-[10px] text-slate-500 mt-0.5">{experimentPlan.healthScoreLabel || 'Qualitative estimate'}</p>
              </div>
            }
          >
            <div className="space-y-6">
              <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Submitted Plan</h4>
                <p className="text-sm text-slate-300">{experimentPlan.description}</p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Issues Found</h3>
                <div className="space-y-2">
                  {experimentPlan.criticalIssues.map((issue, i) => (
                    <div key={i} className="flex items-start space-x-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                      <span className="text-sm flex-shrink-0">{severityIcons[issue.severity]}</span>
                      <div>
                        <Badge variant={severityColors[issue.severity]} className="mb-1">
                          {issue.severity.toUpperCase()}
                        </Badge>
                        <p className="text-sm text-slate-300 mt-1">{issue.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card
            title="Recommended Experiments"
            subtitle="Suggested experimental design"
            headerRight={
              <button
                onClick={() => setShowMatrix(!showMatrix)}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
              >
                {showMatrix ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>{showMatrix ? 'Hide matrix' : 'Show matrix'}</span>
              </button>
            }
          >
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">ID</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Experiment</th>
                      <th className="text-left py-2 px-3 text-slate-400 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {experimentPlan.recommendedExperiments.map((exp) => (
                      <tr key={exp.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-2.5 px-3">
                          <Badge variant="info">{exp.id}</Badge>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-medium">{exp.name}</td>
                        <td className="py-2.5 px-3 text-slate-400">{exp.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {showMatrix && experimentPlan.experimentMatrix.length > 1 && (
                <div className="overflow-x-auto">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Experiment Matrix</h4>
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr>
                        {experimentPlan.experimentMatrix[0].map((header, i) => (
                          <th key={i} className="text-left py-2 px-3 text-slate-400 font-medium border border-slate-700 bg-slate-800/50">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {experimentPlan.experimentMatrix.slice(1).map((row, i) => (
                        <tr key={i}>
                          {row.map((cell, j) => (
                            <td key={j} className="py-2 px-3 text-slate-300 border border-[var(--border-color)]">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="text-xs text-slate-600 mt-2">
                Use the <button onClick={() => setView('planner')} className="text-emerald-400 hover:text-emerald-300 underline">Experiment Planner</button> to turn these into detailed experiment briefs.
              </p>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}