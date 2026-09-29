import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Sword, Plus, Save, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import type { ReviewerResponse } from '../types';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
  in_progress: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
  completed: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
  inconclusive: 'bg-slate-800/60 text-slate-300 border-slate-700/50'
};

export function ReviewerWorkspacePage() {
  const { state, addReviewerResponse, updateReviewerResponse, addMemoryItem, exportReviewPacket } = useResearch();
  const { reviewerResponses, autopsyResult, paperAnalysis } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    concern: '', relevantEvidence: '', proposedResponse: '', requiredExperimentOrRevision: ''
  });

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Sword className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to create reviewer response plans.</p>
        </div>
      </Card>
    );
  }

  const handleSave = () => {
    const data: Omit<ReviewerResponse, 'id' | 'createdAt' | 'updatedAt'> = {
      ...form,
      status: 'planned',
      workCompleted: false
    };

    if (editingId) {
      const existing = reviewerResponses.find(r => r.id === editingId);
      if (existing) updateReviewerResponse({ ...existing, ...data, id: editingId, updatedAt: Date.now() });
    } else {
      addReviewerResponse(data);
    }

    setForm({ concern: '', relevantEvidence: '', proposedResponse: '', requiredExperimentOrRevision: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (resp: ReviewerResponse) => {
    setForm({
      concern: resp.concern,
      relevantEvidence: resp.relevantEvidence,
      proposedResponse: resp.proposedResponse,
      requiredExperimentOrRevision: resp.requiredExperimentOrRevision
    });
    setEditingId(resp.id);
    setShowForm(true);
  };

  const handleExport = () => {
    const packet = exportReviewPacket();
    const blob = new Blob([packet], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-review-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const concernSources = [
    ...(autopsyResult?.reviewerReport?.majorConcerns?.map(c => c) || []),
    ...(autopsyResult?.reviewerReport?.minorConcerns?.map(c => c) || []),
    ...(autopsyResult?.failureRisks?.map(r => `[Failure Risk] ${r.title}: ${r.couldInvalidate}`) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Reviewer Response Workspace</h1>
          <p className="text-sm text-slate-400 mt-1">Turn reviewer concerns into actionable response plans</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export Review Packet</span>
          </button>
          <button
            onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ concern: '', relevantEvidence: '', proposedResponse: '', requiredExperimentOrRevision: '' }); }}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{showForm ? 'Cancel' : 'Add Response Plan'}</span>
          </button>
        </div>
      </div>

      {showForm && (
        <Card title={editingId ? 'Edit Response Plan' : 'New Reviewer Response Plan'}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Reviewer Concern</label>
              <select
                value={form.concern}
                onChange={e => setForm({ ...form, concern: e.target.value })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200"
              >
                <option value="">Select a concern...</option>
                {concernSources.map((s, i) => <option key={i} value={s}>{s.slice(0, 120)}</option>)}
                <option value="__custom__">Custom concern</option>
              </select>
              {form.concern === '__custom__' && (
                <textarea
                  value={''}
                  onChange={e => setForm({ ...form, concern: e.target.value })}
                  placeholder="Describe the reviewer concern..."
                  rows={2}
                  className="w-full mt-2 bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Relevant Evidence</label>
              <textarea value={form.relevantEvidence} onChange={e => setForm({ ...form, relevantEvidence: e.target.value })}
                placeholder="What evidence addresses this concern?"
                rows={3} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Proposed Response</label>
              <textarea value={form.proposedResponse} onChange={e => setForm({ ...form, proposedResponse: e.target.value })}
                placeholder="How do you plan to respond?"
                rows={3} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              <p className="text-[10px] text-amber-500 mt-1">This is a proposed response. Do NOT claim experiments were conducted unless you have recorded that they were.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Required Experiment or Revision</label>
              <textarea value={form.requiredExperimentOrRevision} onChange={e => setForm({ ...form, requiredExperimentOrRevision: e.target.value })}
                placeholder="What specific experiment or revision is needed?"
                rows={3} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
            </div>

            <button onClick={handleSave} className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{editingId ? 'Update Response' : 'Save Response Plan'}</span>
            </button>
          </div>
        </Card>
      )}

      {reviewerResponses.length === 0 && !showForm && (
        <Card>
          <div className="text-center py-8">
            <Sword className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No response plans yet.</p>
            <p className="text-xs text-slate-600 mt-1">Run the Autopsy or Reviewer #2 first, then create response plans for each concern.</p>
            <p className="text-xs text-slate-600 mt-1">You can also use "Add Response Plan" to respond to any concern.</p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {reviewerResponses.map(response => (
          <ReviewerResponseCard
            key={response.id}
            response={response}
            onEdit={() => startEdit(response)}
            onSaveToMemory={() => {
              addMemoryItem({
                type: 'reviewer_response',
                title: `Reviewer Response: ${response.concern.slice(0, 80)}`,
                content: `Proposed: ${response.proposedResponse}\nRequired: ${response.requiredExperimentOrRevision}\nStatus: ${response.status}`,
                tags: ['reviewer', response.status]
              });
            }}
            onStatusChange={(status) => updateReviewerResponse({ ...response, status: status as ReviewerResponse['status'] })}
            onWorkToggle={() => updateReviewerResponse({ ...response, workCompleted: !response.workCompleted })}
          />
        ))}
      </div>
    </div>
  );
}

function ReviewerResponseCard({ response, onEdit, onSaveToMemory, onStatusChange, onWorkToggle }: {
  response: ReviewerResponse;
  onEdit: () => void;
  onSaveToMemory: () => void;
  onStatusChange: (status: string) => void;
  onWorkToggle: () => void;
}) {
  return (
    <Card
      title={response.concern.slice(0, 150)}
      subtitle={`Created: ${new Date(response.createdAt).toLocaleDateString()}`}
      headerRight={
        <div className="flex items-center space-x-2">
          <select
            value={response.status}
            onChange={e => onStatusChange(e.target.value)}
            className={`px-2 py-1 text-xs rounded-md border ${statusColors[response.status]}`}
          >
            <option value="planned">Planned</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
          <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Relevant Evidence</h4>
          <p className="text-sm text-slate-300">{response.relevantEvidence}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-blue-900/15 border border-blue-800/30 rounded-md">
            <h4 className="text-xs font-semibold text-blue-400 uppercase mb-1">Proposed Response</h4>
            <p className="text-sm text-blue-200/80">{response.proposedResponse}</p>
          </div>
          <div className="p-3 bg-purple-900/15 border border-purple-800/30 rounded-md">
            <h4 className="text-xs font-semibold text-purple-400 uppercase mb-1">Required Experiment / Revision</h4>
            <p className="text-sm text-purple-200/80">{response.requiredExperimentOrRevision}</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex items-center space-x-2">
            <button
              onClick={onWorkToggle}
              className={`text-xs flex items-center space-x-1 px-2.5 py-1.5 rounded-md transition-colors ${
                response.workCompleted
                  ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/50'
                  : 'bg-amber-900/20 text-amber-300 border border-amber-800/40'
              }`}
            >
              {response.workCompleted ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
              <span>{response.workCompleted ? 'Work Completed' : 'Proposed (not yet conducted)'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={onEdit} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
              Edit
            </button>
            <button onClick={onSaveToMemory} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center space-x-1">
              <Save className="w-3 h-3" />
              <span>Save to Memory</span>
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}