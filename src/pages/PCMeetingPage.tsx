import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Users, MessageSquare, ThumbsUp, ThumbsDown, Minus, AlertTriangle, CheckCircle } from 'lucide-react';

const verdictColors: Record<string, string> = {
  accept: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/30',
  weak_accept: 'text-emerald-400 border-emerald-700/40 bg-emerald-900/20',
  borderline: 'text-amber-400 border-amber-700/50 bg-amber-900/30',
  weak_reject: 'text-red-400 border-red-700/40 bg-red-900/20',
  reject: 'text-red-400 border-red-700/50 bg-red-900/30',
};

const stanceIcons: Record<string, React.ReactNode> = {
  positive: <ThumbsUp className="w-4 h-4 text-emerald-400" />,
  mixed: <Minus className="w-4 h-4 text-amber-400" />,
  negative: <ThumbsDown className="w-4 h-4 text-red-400" />,
};

export function PCMeetingPage() {
  const { state } = useResearch();
  const { pcMeeting, paperAnalysis } = state;
  const [expandedReviewer, setExpandedReviewer] = useState<string | null>(null);

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12"><Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Load a paper to simulate a program committee meeting.</p>
        </div>
      </Card>
    );
  }

  if (!pcMeeting) {
    return (
      <Card>
        <div className="text-center py-10"><MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Load the demo project to see a virtual PC meeting simulation.</p>
        </div>
      </Card>
    );
  }

  const outcomeColors: Record<string, string> = { accept: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20', reject: 'text-red-400 border-red-700/50 bg-red-900/20', major_revision: 'text-amber-400 border-amber-700/50 bg-amber-900/20' };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Virtual Program Committee Meeting</h1>
        <p className="text-sm text-slate-400 mt-1">Simulated critique — not a real PC meeting</p>
      </div>

      <Card className="border-amber-700/40 bg-amber-900/10">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Simulated Critique</h4>
            <p className="text-sm text-amber-200/70 mt-1">
              This is a simulated reviewer discussion generated from paper text, not an actual PC meeting.
              Reviewer scores and verdicts are qualitative estimates, not validated predictions.
              Acceptance probabilities are not provided — outcomes depend on actual reviewer assignments, venue standards, and concurrent submissions.
            </p>
          </div>
        </div>
      </Card>

      <div className={`p-4 rounded-lg border text-center ${outcomeColors[pcMeeting.finalOutcome]}`}>
        <h2 className="text-lg font-bold capitalize">{pcMeeting.finalOutcome.replace('_', ' ')}</h2>
        <p className="text-sm mt-1 opacity-80">{pcMeeting.consensus}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {pcMeeting.reviewers.map(r => (
          <Card key={r.id} className={r.stance === 'negative' ? 'border-red-800/40' : r.stance === 'positive' ? 'border-emerald-800/40' : ''}>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {stanceIcons[r.stance]}
                  <span className="text-sm font-semibold text-slate-200">{r.name.split('(')[0].trim()}</span>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded border ${verdictColors[r.finalVerdict]}`}>
                  {r.finalVerdict.replace('_', ' ')} ({r.score}/10)
                </span>
              </div>
              <p className="text-[10px] text-slate-500">{r.expertise}</p>
              <p className="text-xs text-slate-400 italic">"{r.personality}"</p>

              <button onClick={() => setExpandedReviewer(expandedReviewer === r.id ? null : r.id)} className="text-xs text-emerald-400 hover:text-emerald-300">
                {expandedReviewer === r.id ? 'Hide details' : 'Show concerns & strengths'}
              </button>

              {expandedReviewer === r.id && (
                <div className="space-y-2">
                  <div>
                    <h4 className="text-[10px] font-semibold text-red-400 uppercase">Concerns</h4>
                    <ul className="space-y-0.5 mt-1">
                      {r.concerns.map((c, i) => <li key={i} className="text-xs text-slate-400 flex items-start space-x-1"><AlertTriangle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" /><span>{c}</span></li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-semibold text-emerald-400 uppercase">Strengths</h4>
                    <ul className="space-y-0.5 mt-1">
                      {r.strengths.map((s, i) => <li key={i} className="text-xs text-slate-400 flex items-start space-x-1"><CheckCircle className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /><span>{s}</span></li>)}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Card title="Discussion Transcript" subtitle="Simulated PC discussion">
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {pcMeeting.discussionLog.map((entry, i) => {
            const reviewer = pcMeeting.reviewers.find(r => r.id === entry.reviewerId);
            const stanceColors: Record<string, string> = { positive: 'border-emerald-800/40', mixed: 'border-amber-800/40', negative: 'border-red-800/40' };
            return (
              <div key={i} className={`p-3 border-l-2 rounded-r-md ${stanceColors[reviewer?.stance || 'mixed']} bg-slate-800/40`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-semibold text-slate-300">{reviewer?.name.split('(')[0].trim()}</span>
                  <span className="text-[10px] text-slate-600">Turn {entry.turn}</span>
                  {stanceIcons[reviewer?.stance || 'mixed']}
                </div>
                <p className="text-sm text-slate-300">{entry.message}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <Card title="Meta-Review">
        <p className="text-sm text-slate-300 leading-relaxed">{pcMeeting.metaReview}</p>
      </Card>
    </div>
  );
}