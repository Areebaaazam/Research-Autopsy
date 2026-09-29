import { useState, useRef } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import {
  Database, Plus, Trash2, BookOpen, Lightbulb, Beaker, AlertTriangle, Target, Star, FlaskConical, Search,
  Download, Upload, CheckCircle, XCircle
} from 'lucide-react';
import type { ResearchMemoryItem } from '../types';

const typeConfig: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  project: { label: 'Project', icon: Star, color: 'text-purple-400' },
  question: { label: 'Question', icon: Search, color: 'text-blue-400' },
  gap: { label: 'Gap', icon: Lightbulb, color: 'text-amber-400' },
  experiment: { label: 'Experiment', icon: Beaker, color: 'text-blue-400' },
  finding: { label: 'Finding', icon: Target, color: 'text-emerald-400' },
  failed_approach: { label: 'Failed Approach', icon: AlertTriangle, color: 'text-red-400' },
  paper: { label: 'Paper', icon: BookOpen, color: 'text-emerald-400' },
  contribution: { label: 'Contribution', icon: FlaskConical, color: 'text-purple-400' },
  experiment_brief: { label: 'Experiment Brief', icon: Beaker, color: 'text-blue-400' },
  reviewer_response: { label: 'Reviewer Response', icon: AlertTriangle, color: 'text-amber-400' }
};

export function MemoryPage() {
  const { state, addMemoryItem, removeMemoryItem, getBackup, importBackup } = useResearch();
  const { memory } = state;
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const [newItem, setNewItem] = useState({ type: 'finding' as ResearchMemoryItem['type'], title: '', content: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = filter === 'all'
    ? memory.items
    : memory.items.filter(i => i.type === filter);

  const handleAdd = () => {
    if (!newItem.title.trim() || !newItem.content.trim()) return;
    addMemoryItem({
      type: newItem.type,
      title: newItem.title.trim(),
      content: newItem.content.trim(),
      tags: []
    });
    setNewItem({ type: 'finding', title: '', content: '' });
    setShowForm(false);
  };

  const handleExport = () => {
    const backup = getBackup();
    const blob = new Blob([backup], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `research-autopsy-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const result = importBackup(text);
      if (result.success) {
        setImportResult({ success: true, message: `Imported ${result.count} memory items. ${result.errors.length > 0 ? `${result.errors.length} items skipped.` : ''}` });
      } else {
        setImportResult({ success: false, message: result.errors.join('; ') || 'Import failed.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Research Memory</h1>
          <p className="text-sm text-slate-400 mt-1">{memory.items.length} saved items (v{memory.storageVersion})</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleExport} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md transition-colors flex items-center space-x-1">
            <Download className="w-4 h-4" />
            <span>Export Backup</span>
          </button>
          <button onClick={handleImport} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md transition-colors flex items-center space-x-1">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {importResult && (
        <div className={`p-3 rounded-md flex items-start space-x-2 text-sm ${importResult.success ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-800/50' : 'bg-red-900/30 text-red-300 border border-red-800/50'}`}>
          {importResult.success ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
          <span>{importResult.message}</span>
          <button onClick={() => setImportResult(null)} className="ml-auto text-slate-500 hover:text-slate-300">
            <XCircle className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <Card className="border-slate-700/40">
        <div className="flex items-start space-x-3">
          <Database className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-500">
            <p>Data is stored in browser local storage and may be cleared if you delete browser data.</p>
            <p className="mt-0.5">Use Export Backup to download a JSON file. Import will add to existing items without overwriting.</p>
          </div>
        </div>
      </Card>

      {showForm && (
        <Card title="New Memory Item">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Type</label>
              <select
                value={newItem.type}
                onChange={e => setNewItem({ ...newItem, type: e.target.value as ResearchMemoryItem['type'] })}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              >
                {Object.entries(typeConfig).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Title</label>
              <input
                value={newItem.title}
                onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                placeholder="Give this item a title..."
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase">Content</label>
              <textarea
                value={newItem.content}
                onChange={e => setNewItem({ ...newItem, content: e.target.value })}
                placeholder="Describe your research item..."
                rows={4}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md p-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50"
              />
            </div>
            <div className="flex space-x-2">
              <button onClick={handleAdd} className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors">
                Save
              </button>
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </Card>
      )}

      <div className="flex items-center space-x-2 overflow-x-auto pb-2" role="tablist">
        <FilterButton label={`All (${memory.items.length})`} active={filter === 'all'} onClick={() => setFilter('all')} />
        {Object.entries(typeConfig).map(([key, cfg]) => {
          const count = memory.items.filter(i => i.type === key).length;
          if (count === 0) return null;
          return (
            <FilterButton key={key} label={`${cfg.label} (${count})`} active={filter === key} onClick={() => setFilter(key)} />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <Database className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-slate-400">No Items Yet</h2>
            <p className="text-sm text-slate-500 mt-1">Start saving research ideas, gaps, experiments, and findings.</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const cfg = typeConfig[item.type] || typeConfig.finding;
            const Icon = cfg.icon;
            const date = new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            return (
              <Card key={item.id} className="py-0">
                <div className="flex items-start justify-between p-4">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className={`p-2 rounded-md bg-slate-800/80 flex-shrink-0 ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">{cfg.label}</Badge>
                        <span className="text-[10px] text-slate-500">{date}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 mt-1 break-words">{item.title}</h4>
                      <p className="text-sm text-slate-400 mt-1 line-clamp-2 break-words">{item.content}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeMemoryItem(item.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                    aria-label="Delete item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap ${
        active ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
      }`}
    >
      {label}
    </button>
  );
}