import { useState, useCallback, useEffect, useRef } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Pin, PinOff, ChevronUp, ChevronDown, Edit3, X, Check, ArrowRight } from 'lucide-react';
import type { QueueItem } from '../types';

export function QueueSection() {
  const { state, dispatch, setModule } = useResearch();
  const { queue, autopsyResult, experimentBriefs, reviewerResponses } = state;
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteValue, setNoteValue] = useState('');
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const rebuiltRef = useRef(false);

  useEffect(() => { if (editingNote && noteRef.current) noteRef.current.focus(); }, [editingNote]);

  const buildQueue = useCallback((): QueueItem[] => {
    const items: QueueItem[] = [];
    state.numericalAudit?.findings?.forEach(f => {
      if (f.assessment === 'inconsistent') items.push({ id: `q-num-${f.id}`, sourceModule: 'numericalAudit', sourceId: f.id, title: f.claim.slice(0, 100), preview: f.reason.slice(0, 150), type: 'finding', severity: 'HIGH' as const, status: 'open', pinned: false, userPriority: 0, userNote: '', nextAction: f.formula, nextActionTarget: 'numericalAudit' });
    });
    const major = autopsyResult?.reviewerReport?.majorConcerns || [];
    const minor = autopsyResult?.reviewerReport?.minorConcerns || [];
    [...major, ...minor].forEach((c, i) => { items.push({ id: `q-aut-${i}`, sourceModule: 'autopsy', sourceId: `concern-${i}`, title: c.slice(0, 120), preview: '', type: 'concern', severity: i < major.length ? 'HIGH' as const : 'MEDIUM' as const, status: 'open', pinned: false, userPriority: 0, userNote: '', nextAction: 'Review evidence', nextActionTarget: 'autopsy' }); });
    autopsyResult?.failureRisks?.forEach(r => { items.push({ id: `q-risk-${r.title.slice(0, 20)}`, sourceModule: 'autopsy', sourceId: r.title, title: r.title, preview: r.explanation.slice(0, 150), type: 'finding', severity: r.severity as 'HIGH' | 'MEDIUM' | 'LOW', status: 'open', pinned: false, userPriority: 0, userNote: '', nextAction: r.rulingOutExperiment, nextActionTarget: 'experiments' }); });
    experimentBriefs.forEach(eb => { items.push({ id: `q-eb-${eb.id}`, sourceModule: 'experiments', sourceId: eb.id, title: eb.hypothesis.slice(0, 100), preview: eb.proposedTest.slice(0, 150), type: 'experiment' as const, severity: 'MEDIUM' as const, status: eb.status, pinned: false, userPriority: 0, userNote: '', nextAction: 'Run experiment', nextActionTarget: 'experiments' }); });
    reviewerResponses.forEach(rr => { items.push({ id: `q-rr-${rr.id}`, sourceModule: 'reviewerWorkspace', sourceId: rr.id, title: rr.concern.slice(0, 100), preview: rr.proposedResponse.slice(0, 150), type: 'reviewer_task' as const, severity: 'HIGH' as const, status: rr.status, pinned: false, userPriority: 0, userNote: '', nextAction: rr.requiredExperimentOrRevision, nextActionTarget: 'reviewerWorkspace' }); });
    return items;
  }, [state.numericalAudit, autopsyResult, experimentBriefs, reviewerResponses]);

  // Derive queue: always rebuild from source, merge user metadata from stored queue
  const queuedIds = new Set(queue.map(q => q.id));
  const freshQueue = buildQueue();
  const needsUpdate = freshQueue.length !== queue.length || freshQueue.some(fq => !queuedIds.has(fq.id));

  if (needsUpdate && !rebuiltRef.current) {
    rebuiltRef.current = true;
    // Merge user metadata from existing queue items
    const merged = freshQueue.map(fq => {
      const existing = queue.find(q => q.id === fq.id);
      return existing ? { ...fq, pinned: existing.pinned, userPriority: existing.userPriority, userNote: existing.userNote } : fq;
    });
    dispatch({ type: 'SET_QUEUE', queue: merged });
  }

  const activeQueue = queue.length > 0 ? queue : freshQueue;

  const setNote = (id: string, note: string) => dispatch({ type: 'SET_QUEUE_NOTE', id, note });
  const togglePin = (id: string, pinned: boolean) => dispatch({ type: 'PIN_QUEUE_ITEM', id, pinned });
  const setPriority = (id: string, p: number) => dispatch({ type: 'SET_QUEUE_PRIORITY', id, priority: p });

  const filtered = [...activeQueue].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (a.userPriority !== b.userPriority) return b.userPriority - a.userPriority;
    const sev = { HIGH: 0, MEDIUM: 1, LOW: 2 } as Record<string, number>;
    return (sev[a.severity] ?? 3) - (sev[b.severity] ?? 3);
  }).slice(0, 10);

  if (filtered.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-300">Research Queue</h2>
        <div className="flex items-center space-x-2 text-xs text-slate-500">
          <span>{activeQueue.filter(i => i.pinned).length} pinned</span>
          <span>·</span>
          <span>{activeQueue.length} total</span>
        </div>
      </div>
      <div className="space-y-1">
        {filtered.map(item => {
          const pinned = item.pinned;
          const priority = item.userPriority || 0;
          const note = item.userNote || '';
          const isEditingNote = editingNote === item.id;

          return (
            <div key={item.id} className="flex items-start p-2.5 bg-slate-800/40 border border-slate-700/50 rounded-md group">
              <button onClick={() => togglePin(item.id, !pinned)}
                className={`p-0.5 flex-shrink-0 mt-1 transition-colors ${pinned ? 'text-emerald-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`}
                title={pinned ? 'Unpin' : 'Pin'}>
                {pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
              </button>
              <div className="flex-1 min-w-0 ml-1.5 mr-1">
                <div className="flex items-center space-x-1.5">
                  <span className={`text-[10px] font-semibold ${item.severity === 'HIGH' ? 'text-red-400' : item.severity === 'MEDIUM' ? 'text-amber-400' : 'text-slate-400'}`}>{item.severity}</span>
                  <span className="text-[10px] text-slate-600 capitalize">{item.type.replace('_', ' ')}</span>
                  {priority > 0 && <span className="text-[10px] text-amber-400 bg-amber-900/20 px-1 rounded">P{priority}</span>}
                </div>
                <p className="text-xs text-slate-300 line-clamp-1">{item.title}</p>
                {note && !isEditingNote && <p className="text-[10px] text-slate-500 italic mt-0.5">{note}</p>}
                {isEditingNote && (
                  <div className="flex items-start space-x-1 mt-1">
                    <textarea ref={noteRef} value={noteValue} onChange={e => setNoteValue(e.target.value)}
                      className="flex-1 bg-slate-900/80 border border-slate-700 rounded text-[10px] text-slate-300 p-1 resize-none h-12 focus:outline-none focus:ring-1 focus:ring-emerald-600/50"
                      placeholder="Why this matters..." />
                    <button onClick={() => { setNote(item.id, noteValue); setEditingNote(null); }} className="p-0.5 text-emerald-400 hover:text-emerald-300"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setEditingNote(null)} className="p-0.5 text-slate-500 hover:text-slate-300"><X className="w-3 h-3" /></button>
                  </div>
                )}
                <button onClick={() => setModule(item.nextActionTarget)} className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-0.5 mt-0.5">
                  <span>{item.nextAction}</span><ArrowRight className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="flex flex-col items-center space-y-0.5 flex-shrink-0">
                <div className="flex space-x-0.5">
                  <button onClick={() => setPriority(item.id, Math.min(3, priority + 1))}
                    className={`p-0.5 rounded transition-colors ${priority < 3 ? 'text-slate-600 hover:text-amber-400 opacity-0 group-hover:opacity-100' : 'text-amber-400'}`} title="Increase priority">
                    <ChevronUp className="w-3 h-3" />
                  </button>
                  <button onClick={() => setPriority(item.id, Math.max(0, priority - 1))}
                    className={`p-0.5 rounded transition-colors ${priority > 0 ? 'text-amber-400' : 'text-slate-600 opacity-0 group-hover:opacity-100'}`} title="Decrease priority">
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <button onClick={() => { if (isEditingNote) { setNote(item.id, noteValue); setEditingNote(null); } else { setNoteValue(note); setEditingNote(item.id); } }}
                  className="p-0.5 text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" title="Add note">
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {activeQueue.length > 10 && <p className="text-xs text-slate-500 text-center">+{activeQueue.length - 10} more items</p>}
    </div>
  );
}