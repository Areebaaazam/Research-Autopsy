import { useCallback } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Pin, PinOff, AlertTriangle, Beaker, Sword, ArrowRight, Search } from 'lucide-react';
import type { QueueItem } from '../types';

export function QueuePage() {
  const { state, dispatch, setModule } = useResearch();
  const { queue, autopsyResult, experimentBriefs, reviewerResponses, claimEvidence } = state;

  // Build queue from existing data
  const buildQueue = useCallback(() => {
    const items: QueueItem[] = [];

    // From numerical audit
    state.numericalAudit?.findings?.forEach(f => {
      if (f.assessment === 'inconsistent') {
        items.push({
          id: `q-num-${f.id}`, sourceModule: 'numericalAudit', sourceId: f.id,
          title: f.claim.slice(0, 100), preview: f.reason.slice(0, 150),
          type: 'finding', severity: 'HIGH', status: 'open', pinned: false,
          userPriority: 0, userNote: '', nextAction: f.formula, nextActionTarget: 'numericalAudit',
        });
      }
    });

    // From autopsy concerns
    const major = autopsyResult?.reviewerReport?.majorConcerns || [];
    const minor = autopsyResult?.reviewerReport?.minorConcerns || [];
    [...major, ...minor].forEach((c, i) => {
      items.push({
        id: `q-aut-${i}`, sourceModule: 'autopsy', sourceId: `concern-${i}`,
        title: c.slice(0, 120), preview: '',
        type: 'concern', severity: i < major.length ? 'HIGH' : 'MEDIUM', status: 'open', pinned: false,
        userPriority: 0, userNote: '', nextAction: 'Review evidence and plan response', nextActionTarget: 'autopsy',
      });
    });

    // From failure risks
    autopsyResult?.failureRisks?.forEach(r => {
      items.push({
        id: `q-risk-${r.title.slice(0, 20)}`, sourceModule: 'autopsy', sourceId: r.title,
        title: r.title, preview: r.explanation.slice(0, 150),
        type: 'finding', severity: r.severity, status: 'open', pinned: false,
        userPriority: 0, userNote: '', nextAction: r.rulingOutExperiment, nextActionTarget: 'experiments',
      });
    });

    // From experiment briefs
    experimentBriefs.forEach(eb => {
      items.push({
        id: `q-eb-${eb.id}`, sourceModule: 'experiments', sourceId: eb.id,
        title: eb.hypothesis.slice(0, 100), preview: eb.proposedTest.slice(0, 150),
        type: 'experiment', severity: 'MEDIUM', status: eb.status, pinned: false,
        userPriority: 0, userNote: '', nextAction: 'Run planned experiment', nextActionTarget: 'experiments',
      });
    });

    // From reviewer responses
    reviewerResponses.forEach(rr => {
      items.push({
        id: `q-rr-${rr.id}`, sourceModule: 'reviewerWorkspace', sourceId: rr.id,
        title: rr.concern.slice(0, 100), preview: rr.proposedResponse.slice(0, 150),
        type: 'reviewer_task', severity: 'HIGH', status: rr.status, pinned: false,
        userPriority: 0, userNote: '', nextAction: rr.requiredExperimentOrRevision, nextActionTarget: 'reviewerWorkspace',
      });
    });

    return items;
  }, [state.numericalAudit, autopsyResult, experimentBriefs, reviewerResponses]);

  // Update queue on first render
  if (queue.length === 0 && (claimEvidence.length > 0 || autopsyResult || experimentBriefs.length > 0)) {
    const items = buildQueue();
    dispatch({ type: 'SET_QUEUE', queue: items });
  }

  const filtered = queue.sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.userPriority !== b.userPriority) return b.userPriority - a.userPriority;
    const sev = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (sev[a.severity as keyof typeof sev] ?? 3) - (sev[b.severity as keyof typeof sev] ?? 3);
  });

  const typeIcons: Record<string, React.ReactNode> = {
    concern: <AlertTriangle className="w-4 h-4" />,
    experiment: <Beaker className="w-4 h-4" />,
    reviewer_task: <Sword className="w-4 h-4" />,
    finding: <Search className="w-4 h-4" />,
  };

  const typeColors: Record<string, string> = {
    concern: 'text-red-400', experiment: 'text-blue-400', reviewer_task: 'text-amber-400', finding: 'text-purple-400',
  };

  const statusBadges: Record<string, string> = {
    open: 'danger', planned: 'info', in_progress: 'warning', completed: 'success', inconclusive: 'default',
  };

  if (filtered.length === 0 && queue.length === 0) {
    return (
      <Card><div className="text-center py-10">
        <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
        <p className="text-sm text-slate-500">Run the Autopsy, Numerical Audit, or create experiment briefs to populate your queue.</p>
      </div></Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-slate-100">Research Queue</h1>
          <p className="text-sm text-slate-400 mt-1">{filtered.length} items · {filtered.filter(i => i.pinned).length} pinned</p>
        </div>
      </div>

      <div className="space-y-1.5">
        {filtered.map(item => {
          const isPinned = queue.find(q => q.id === item.id)?.pinned ?? false;
          const userNote = queue.find(q => q.id === item.id)?.userNote ?? '';
          const userPriority = queue.find(q => q.id === item.id)?.userPriority ?? 0;

          return (
            <div key={item.id} className="flex items-start p-3 bg-slate-800/50 border border-slate-700/60 rounded-md hover:bg-slate-800/80 transition-colors group">
              <div className={`flex-shrink-0 mt-0.5 ${typeColors[item.type] || 'text-slate-400'}`}>{typeIcons[item.type]}</div>
              <div className="flex-1 min-w-0 ml-3 mr-2">
                <div className="flex items-center space-x-2 mb-0.5">
                  <span className={`text-xs font-semibold ${item.severity === 'HIGH' ? 'text-red-400' : item.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'}`}>
                    {item.severity}
                  </span>
                  <Badge variant={(statusBadges[item.status] || 'default') as any}>{item.status}</Badge>
                  <span className="text-[10px] text-slate-600 capitalize">{item.type.replace('_', ' ')}</span>
                </div>
                <h3 className="text-sm font-medium text-slate-200">{item.title}</h3>
                {item.preview && <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.preview}</p>}
                {userNote && <p className="text-xs text-slate-500 mt-0.5 italic">Note: {userNote}</p>}
                {item.nextAction && (
                  <button onClick={() => setModule(item.nextActionTarget)}
                    className="text-xs text-emerald-400 hover:text-emerald-300 mt-1 flex items-center space-x-1">
                    <span>{item.nextAction}</span><ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex flex-col items-center space-y-1 flex-shrink-0">
                <button onClick={() => dispatch({ type: 'PIN_QUEUE_ITEM', id: item.id, pinned: !isPinned })}
                  className={`p-1 rounded transition-colors ${isPinned ? 'text-emerald-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}>
                  {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => {
                  const newP = userPriority >= 3 ? 0 : (userPriority || 0) + 1;
                  dispatch({ type: 'SET_QUEUE_PRIORITY', id: item.id, priority: newP });
                }}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${userPriority > 0 ? 'bg-amber-900/40 text-amber-300' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}>
                  P{userPriority || 0}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}