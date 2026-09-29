import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { ArrowLeftRight, Save, Plus, Minus, ArrowRight } from 'lucide-react';

export function RevisionComparePage() {
  const { state, savePaperSnapshot, compareRevisions } = useResearch();
  const { paperAnalysis, paperSnapshots, revisionComparison, isLoading, demoMode } = state;
  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [selectedOld, setSelectedOld] = useState('');
  const [selectedNew, setSelectedNew] = useState('');

  if (!paperAnalysis && !demoMode) {
    return (
      <Card><div className="text-center py-12">
        <ArrowLeftRight className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-slate-400">No Paper Loaded</h2>
        <p className="text-sm text-slate-500">Load a paper and save snapshots to compare revisions.</p>
      </div></Card>
    );
  }

  const handleSaveSnapshot = () => {
    if (!snapshotLabel.trim()) return;
    savePaperSnapshot(snapshotLabel.trim());
    setSnapshotLabel('');
  };

  const handleCompare = () => {
    if (selectedOld && selectedNew) compareRevisions(selectedOld, selectedNew);
  };

  const statusColors: Record<string, string> = {
    resolved: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
    partially_addressed: 'text-amber-400 border-amber-700/50 bg-amber-900/20',
    still_open: 'text-red-400 border-red-700/50 bg-red-900/20',
    unable_to_assess: 'text-slate-400 border-slate-700/50 bg-slate-800/50',
  };

  const sourceLabels: Record<string, string> = {
    deterministic: 'Deterministic check',
    ai_assessment: 'AI assessment',
    user_confirmation: 'User confirmed',
  };

  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-slate-100">Revision Comparison</h1>
        <p className="text-sm text-slate-400 mt-1">Compare paper versions and track concern resolution</p>
      </div>

      {/* Save snapshot */}
      <Card title="Save Current Version" subtitle="Capture a named snapshot for later comparison">
        <div className="flex items-center space-x-3">
          <input value={snapshotLabel} onChange={e => setSnapshotLabel(e.target.value)}
            placeholder="e.g., v1 — Original, v2 — After rebuttal..."
            className="flex-1 bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
            onKeyDown={e => { if (e.key === 'Enter') handleSaveSnapshot(); }} />
          <button onClick={handleSaveSnapshot} disabled={!snapshotLabel.trim()}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
            <Save className="w-4 h-4" /><span>Save Snapshot</span>
          </button>
        </div>
        {paperSnapshots.length > 0 && <p className="text-xs text-slate-500 mt-2">{paperSnapshots.length} snapshot(s) saved.</p>}
      </Card>

      {/* Compare */}
      {paperSnapshots.length >= 2 && (
        <Card title="Compare Versions">
          <div className="flex items-end space-x-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Older version</label>
              <select value={selectedOld} onChange={e => setSelectedOld(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200">
                <option value="">Select...</option>
                {paperSnapshots.map(s => <option key={s.id} value={s.id}>{s.label} — {new Date(s.savedAt).toLocaleDateString()}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Newer version</label>
              <select value={selectedNew} onChange={e => setSelectedNew(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200">
                <option value="">Select...</option>
                {paperSnapshots.map(s => <option key={s.id} value={s.id}>{s.label} — {new Date(s.savedAt).toLocaleDateString()}</option>)}
              </select>
            </div>
            <button onClick={handleCompare} disabled={!selectedOld || !selectedNew || isLoading}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
              <ArrowLeftRight className="w-4 h-4" /><span>Compare</span>
            </button>
          </div>
        </Card>
      )}

      {paperSnapshots.length < 2 && (
        <Card><div className="text-center py-6 text-sm text-slate-500">Save at least 2 snapshots to compare versions.</div></Card>
      )}

      {/* Results */}
      {revisionComparison && (
        <>
          <Card title="Concern Resolution" subtitle={`${revisionComparison.olderTitle} → ${revisionComparison.newerTitle}`}>
            <div className="space-y-4">
              {revisionComparison.concerns.map((rc) => (
                <div key={rc.id} className="p-4 bg-slate-800/50 border border-slate-700/60 rounded-md space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[rc.status]}`}>
                          {rc.status.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-slate-500">{sourceLabels[rc.determinationSource]}</span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-200">{rc.concernText}</h4>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-red-900/15 border border-red-800/30 rounded-md">
                      <span className="text-[10px] font-semibold text-red-400 uppercase">Original Evidence</span>
                      <p className="text-xs text-slate-300 mt-0.5">{rc.originalEvidence}</p>
                    </div>
                    <div className={`p-2.5 rounded-md border ${
                      rc.status === 'resolved' ? 'bg-emerald-900/15 border-emerald-800/30' : 'bg-amber-900/15 border-amber-800/30'
                    }`}>
                      <span className="text-[10px] font-semibold uppercase">Revised Passage</span>
                      <p className="text-xs text-slate-300 mt-0.5">{rc.revisedPassage}</p>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-900/60 border border-slate-700/40 rounded-md">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase">Reason</span>
                    <p className="text-xs text-slate-400 mt-0.5">{rc.reason}</p>
                  </div>
                </div>
              ))}

              {revisionComparison.concerns.length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No concerns from the original analysis were matched in the revision comparison.</p>
              )}
            </div>
          </Card>

          {/* New Findings */}
          {revisionComparison.newFindings.length > 0 && (
            <Card title="New Findings in Revision" subtitle="Changes detected between versions">
              <div className="space-y-2">
                {revisionComparison.newFindings.map((nf, i) => (
                  <div key={i} className="flex items-start space-x-2 p-2.5 bg-slate-800/50 border border-slate-700/60 rounded-md">
                    {nf.type === 'deleted_claim' ? <Minus className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" /> :
                     nf.type === 'new_claim' ? <Plus className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" /> :
                     <ArrowRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />}
                    <div>
                      <Badge variant={nf.type === 'deleted_claim' ? 'danger' : nf.type === 'new_claim' ? 'success' : 'warning'} className="mb-1">
                        {nf.type.replace(/_/g, ' ')}
                      </Badge>
                      <p className="text-sm text-slate-300">{nf.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <div className="text-xs text-slate-500 p-3 bg-slate-800/40 border border-slate-700/40 rounded-md">
            <p>A changed sentence alone does not count as resolving a concern. Claims about completed experiments do not constitute proof those experiments were conducted. User confirmations and overrides are preserved alongside the original assessment.</p>
          </div>
        </>
      )}
    </div>
  );
}