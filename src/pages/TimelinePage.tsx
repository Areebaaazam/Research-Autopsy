import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar, GitBranch, AlertCircle, CheckCircle, XCircle, ArrowRight, Lightbulb, TrendingUp } from 'lucide-react';

const eventIcons: Record<string, React.ReactNode> = {
  submission: <ArrowRight className="w-4 h-4" />,
  revision: <GitBranch className="w-4 h-4" />,
  rejection: <XCircle className="w-4 h-4" />,
  acceptance: <CheckCircle className="w-4 h-4" />,
  experiment: <TrendingUp className="w-4 h-4" />,
  insight: <Lightbulb className="w-4 h-4" />,
  rebuttal: <AlertCircle className="w-4 h-4" />,
};

const eventColors: Record<string, string> = {
  submission: 'border-blue-500 text-blue-400',
  revision: 'bg-amber-900/30 text-amber-300 border-amber-700/50',
  rejection: 'border-red-500 text-red-400',
  acceptance: 'border-emerald-500 text-emerald-400',
  experiment: 'border-purple-500 text-purple-400',
  insight: 'border-emerald-500 text-emerald-400',
  rebuttal: 'border-amber-500 text-amber-400',
};

const predictionColors: Record<string, string> = {
  likely_accepted: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
  needs_revision: 'text-amber-400 border-amber-700/50 bg-amber-900/20',
  likely_rejected: 'text-red-400 border-red-700/50 bg-red-900/20',
};

export function TimelinePage() {
  const { state } = useResearch();
  const { timeline, paperAnalysis } = state;
  const [showPredictions, setShowPredictions] = useState(true);

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to visualize the research timeline.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Research Timeline & Rebuttal Predictor</h1>
        <p className="text-sm text-slate-400 mt-1">Visualize your research journey and predict reviewer outcomes</p>
      </div>

      {!timeline && (
        <Card>
          <div className="text-center py-10">
            <Calendar className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No timeline data available. Load the demo project to see an example.</p>
          </div>
        </Card>
      )}

      {timeline && (
        <>
          {/* Timeline */}
          <Card title="Research Timeline" subtitle="Key events in chronological order">
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-slate-700" />
              <div className="space-y-6">
                {timeline.events.map(event => (
                  <div key={event.id} className="relative pl-10">
                    <div className={`absolute left-2.5 p-1 rounded-full border-2 -translate-x-1/2 ${eventColors[event.type]?.split(' ')[1] || 'border-slate-600'}`}>
                      <div className="w-3 h-3">{eventIcons[event.type]}</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-[10px] font-mono text-slate-500">{event.date}</span>
                        <Badge variant="default">{event.type}</Badge>
                        {event.confidence !== undefined && (
                          <span className="text-[10px] text-slate-500">confidence: {event.confidence}%</span>
                        )}
                      </div>
                      <h4 className="text-sm font-medium text-slate-200">{event.label}</h4>
                      <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Rebuttal Predictions */}
          <Card title="Reviewer Rebuttal Predictions" subtitle="Predicted outcomes for common reviewer concerns">
            <button
              onClick={() => setShowPredictions(!showPredictions)}
              className="text-xs text-slate-400 hover:text-slate-200 mb-3 flex items-center space-x-1"
            >
              <span>{showPredictions ? 'Hide details' : 'Show details'}</span>
            </button>

            {showPredictions && (
              <div className="space-y-4">
                {timeline.rebuttalPredictions.map((pred, i) => (
                  <div key={i} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-md space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant={pred.strength === 'strong' ? 'danger' : pred.strength === 'moderate' ? 'warning' : 'info'}>
                            {pred.strength.toUpperCase()} concern
                          </Badge>
                          <span className={`px-2 py-0.5 rounded text-xs border ${predictionColors[pred.predictedOutcome]}`}>
                            {pred.predictedOutcome.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-slate-200">{pred.concern}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{pred.reasoning}</p>
                    <div className="p-2.5 bg-emerald-900/15 border border-emerald-800/30 rounded-md">
                      <span className="text-xs font-semibold text-emerald-400 uppercase">Suggested approach</span>
                      <p className="text-sm text-emerald-200/80 mt-0.5">{pred.suggestedApproach}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-900/20 border border-blue-800/40 rounded-md">
              <div className="flex items-start space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-semibold text-blue-400 uppercase">Overall Outlook</h4>
                  <p className="text-sm text-blue-200/80 mt-1">{timeline.overallOutlook}</p>
                </div>
              </div>
            </div>
          </Card>

          <div className="text-xs text-slate-500 p-3 bg-slate-800/40 border border-slate-700/40 rounded-md">
            <p>Timeline events and rebuttal predictions are estimates based on available information. Actual outcomes depend on reviewer assignments, venue standards, and concurrent submissions.</p>
          </div>
        </>
      )}
    </div>
  );
}