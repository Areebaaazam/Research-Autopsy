import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Beaker, Plus, Save, HelpCircle } from 'lucide-react';
import type { ExperimentBrief } from '../types';

const statusColors: Record<string, string> = {
  planned: 'bg-blue-900/40 text-blue-300 border-blue-800/50',
  in_progress: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
  completed: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
  inconclusive: 'bg-slate-800/60 text-slate-300 border-slate-700/50'
};

export function ExperimentBriefPage() {
  const { state, addExperimentBrief, updateExperimentBrief, addMemoryItem } = useResearch();
  const { experimentBriefs, paperAnalysis, autopsyResult } = state;
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    concernReference: '', hypothesis: '', proposedTest: '', baselineComparison: '',
    controls: '', confounders: '', measurementCriteria: '',
    outcomesWouldSupport: '', outcomesWouldWeaken: '',
    estimatedEffort: '', assumptions: '', unknownDetails: ''
  });

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Beaker className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to plan experiments.</p>
        </div>
      </Card>
    );
  }

  const handleSave = () => {
    const brief: Omit<ExperimentBrief, 'id' | 'createdAt' | 'updatedAt'> = {
      ...form,
      status: 'planned'
    };

    if (editingId) {
      const existing = experimentBriefs.find(b => b.id === editingId);
      if (existing) updateExperimentBrief({ ...existing, ...brief, id: editingId, updatedAt: Date.now() });
    } else {
      addExperimentBrief(brief);
    }

    setForm({ concernReference: '', hypothesis: '', proposedTest: '', baselineComparison: '',
      controls: '', confounders: '', measurementCriteria: '',
      outcomesWouldSupport: '', outcomesWouldWeaken: '',
      estimatedEffort: '', assumptions: '', unknownDetails: '' });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (brief: ExperimentBrief) => {
    setForm({
      concernReference: brief.concernReference,
      hypothesis: brief.hypothesis,
      proposedTest: brief.proposedTest,
      baselineComparison: brief.baselineComparison,
      controls: brief.controls,
      confounders: brief.confounders,
      measurementCriteria: brief.measurementCriteria,
      outcomesWouldSupport: brief.outcomesWouldSupport,
      outcomesWouldWeaken: brief.outcomesWouldWeaken,
      estimatedEffort: brief.estimatedEffort,
      assumptions: brief.assumptions,
      unknownDetails: brief.unknownDetails
    });
    setEditingId(brief.id);
    setShowForm(true);
  };

  const handleSaveToMemory = (brief: ExperimentBrief) => {
    addMemoryItem({
      type: 'experiment',
      title: `Experiment: ${brief.hypothesis.slice(0, 80)}`,
      content: `Test: ${brief.proposedTest}\nBaseline: ${brief.baselineComparison}\nStatus: ${brief.status}`,
      tags: ['experiment', brief.status]
    });
  };

  const concernSources = [
    ...(autopsyResult?.failureRisks?.map(r => `[Autopsy] ${r.title}`) || []),
    ...(autopsyResult?.reviewerReport?.majorConcerns?.map(c => `[Reviewer] ${c}`) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Experiment Planner</h1>
          <p className="text-sm text-slate-400 mt-1">Design experiments from actionable concerns</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({
            concernReference: '', hypothesis: '', proposedTest: '', baselineComparison: '',
            controls: '', confounders: '', measurementCriteria: '',
            outcomesWouldSupport: '', outcomesWouldWeaken: '',
            estimatedEffort: '', assumptions: '', unknownDetails: ''
          }); }}
          className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Cancel' : 'Plan an Experiment'}</span>
        </button>
      </div>

      {showForm && (
        <Card title={editingId ? 'Edit Experiment Brief' : 'New Experiment Brief'}>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Concern Reference</label>
                <select
                  value={form.concernReference}
                  onChange={e => setForm({ ...form, concernReference: e.target.value })}
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200"
                >
                  <option value="">Select a concern...</option>
                  {concernSources.map((s, i) => <option key={i} value={s}>{s}</option>)}
                  <option value="__custom__">Custom concern (type below)</option>
                </select>
                {form.concernReference === '__custom__' && (
                  <input
                    value={form.concernReference === '__custom__' ? '' : form.concernReference}
                    onChange={e => setForm({ ...form, concernReference: e.target.value })}
                    placeholder="Describe the concern..."
                    className="w-full mt-2 bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200"
                  />
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1">Hypothesis</label>
                <input value={form.hypothesis} onChange={e => setForm({ ...form, hypothesis: e.target.value })}
                  placeholder="What do you expect to find?"
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Proposed Test</label>
                <textarea value={form.proposedTest} onChange={e => setForm({ ...form, proposedTest: e.target.value })}
                  placeholder="Describe the experiment..."
                  rows={3} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Baseline / Comparison</label>
                <textarea value={form.baselineComparison} onChange={e => setForm({ ...form, baselineComparison: e.target.value })}
                  placeholder="What are you comparing against?"
                  rows={3} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Controls</label>
                <textarea value={form.controls} onChange={e => setForm({ ...form, controls: e.target.value })}
                  placeholder="What variables are held constant?"
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Possible Confounders</label>
                <textarea value={form.confounders} onChange={e => setForm({ ...form, confounders: e.target.value })}
                  placeholder="What might confound results?"
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Measurement / Evaluation Criteria</label>
                <textarea value={form.measurementCriteria} onChange={e => setForm({ ...form, measurementCriteria: e.target.value })}
                  placeholder="What metrics will you use?"
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Estimated Effort</label>
                <input value={form.estimatedEffort} onChange={e => setForm({ ...form, estimatedEffort: e.target.value })}
                  placeholder='e.g., "2-3 weeks" — this is an estimate'
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
                <p className="text-[10px] text-slate-500 mt-1">This is a rough estimate, not a validated projection.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">What Outcomes Would Support the Claim</label>
                <textarea value={form.outcomesWouldSupport} onChange={e => setForm({ ...form, outcomesWouldSupport: e.target.value })}
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">What Outcomes Would Weaken the Claim</label>
                <textarea value={form.outcomesWouldWeaken} onChange={e => setForm({ ...form, outcomesWouldWeaken: e.target.value })}
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Assumptions</label>
                <textarea value={form.assumptions} onChange={e => setForm({ ...form, assumptions: e.target.value })}
                  placeholder="What are you assuming?"
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Unknown Details</label>
                <textarea value={form.unknownDetails} onChange={e => setForm({ ...form, unknownDetails: e.target.value })}
                  placeholder="What is not yet known?"
                  rows={2} className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200" />
              </div>
            </div>

            <button onClick={handleSave} className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>{editingId ? 'Update Brief' : 'Save Experiment Brief'}</span>
            </button>
          </div>
        </Card>
      )}

      {experimentBriefs.length === 0 && !showForm && (
        <Card>
          <div className="text-center py-8">
            <Beaker className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No experiment briefs yet. Click "Plan an Experiment" to start.</p>
            <p className="text-xs text-slate-600 mt-2">You can also create experiments from concerns identified in the Autopsy or Reviewer reports.</p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {experimentBriefs.map(brief => (
          <ExperimentBriefCard
            key={brief.id}
            brief={brief}
            onEdit={() => startEdit(brief)}
            onSaveToMemory={() => handleSaveToMemory(brief)}
            onStatusChange={(status) => updateExperimentBrief({ ...brief, status: status as ExperimentBrief['status'] })}
          />
        ))}
      </div>
    </div>
  );
}

function ExperimentBriefCard({ brief, onEdit, onSaveToMemory, onStatusChange }: {
  brief: ExperimentBrief;
  onEdit: () => void;
  onSaveToMemory: () => void;
  onStatusChange: (status: string) => void;
}) {
  return (
    <Card title={brief.hypothesis.slice(0, 120)} subtitle={`Ref: ${brief.concernReference}`}
      headerRight={
        <select
          value={brief.status}
          onChange={e => onStatusChange(e.target.value)}
          className={`px-2 py-1 text-xs rounded-md border ${statusColors[brief.status]}`}
        >
          <option value="planned">Planned</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="inconclusive">Inconclusive</option>
        </select>
      }
    >
      <div className="space-y-3">
        {brief.proposedTest && (
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Proposed Test</h4>
            <p className="text-sm text-slate-300">{brief.proposedTest}</p>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {brief.baselineComparison && (
            <div className="p-2.5 bg-slate-800/50 border border-slate-700/60 rounded">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Baseline</span>
              <p className="text-sm text-slate-300 mt-0.5">{brief.baselineComparison}</p>
            </div>
          )}
          {brief.controls && (
            <div className="p-2.5 bg-slate-800/50 border border-slate-700/60 rounded">
              <span className="text-[10px] font-semibold text-slate-500 uppercase">Controls</span>
              <p className="text-sm text-slate-300 mt-0.5">{brief.controls}</p>
            </div>
          )}
          {brief.confounders && (
            <div className="p-2.5 bg-red-900/15 border border-red-800/30 rounded">
              <span className="text-[10px] font-semibold text-red-400 uppercase">Confounders</span>
              <p className="text-sm text-red-200/80 mt-0.5">{brief.confounders}</p>
            </div>
          )}
          {brief.measurementCriteria && (
            <div className="p-2.5 bg-blue-900/15 border border-blue-800/30 rounded">
              <span className="text-[10px] font-semibold text-blue-400 uppercase">Measurement</span>
              <p className="text-sm text-blue-200/80 mt-0.5">{brief.measurementCriteria}</p>
            </div>
          )}
        </div>

        {(brief.outcomesWouldSupport || brief.outcomesWouldWeaken) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {brief.outcomesWouldSupport && (
              <div className="p-2.5 bg-emerald-900/15 border border-emerald-800/30 rounded">
                <span className="text-[10px] font-semibold text-emerald-400 uppercase">Would Support</span>
                <p className="text-sm text-emerald-200/80 mt-0.5">{brief.outcomesWouldSupport}</p>
              </div>
            )}
            {brief.outcomesWouldWeaken && (
              <div className="p-2.5 bg-amber-900/15 border border-amber-800/30 rounded">
                <span className="text-[10px] font-semibold text-amber-400 uppercase">Would Weaken</span>
                <p className="text-sm text-amber-200/80 mt-0.5">{brief.outcomesWouldWeaken}</p>
              </div>
            )}
          </div>
        )}

        {brief.estimatedEffort && (
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>Estimated effort: {brief.estimatedEffort}</span>
            <HelpCircle className="w-3 h-3" />
            <span className="text-[10px]">(estimate)</span>
          </div>
        )}

        {(brief.assumptions || brief.unknownDetails) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {brief.assumptions && (
              <div>
                <span className="font-semibold text-slate-500 uppercase">Assumptions</span>
                <p className="text-slate-400 mt-0.5">{brief.assumptions}</p>
              </div>
            )}
            {brief.unknownDetails && (
              <div>
                <span className="font-semibold text-slate-500 uppercase">Unknown</span>
                <p className="text-slate-400 mt-0.5">{brief.unknownDetails}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center space-x-2 pt-2 border-t border-slate-700/50">
          <button onClick={onEdit} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors">
            Edit
          </button>
          <button onClick={onSaveToMemory} className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center space-x-1">
            <Save className="w-3 h-3" />
            <span>Save to Memory</span>
          </button>
        </div>
      </div>
    </Card>
  );
}