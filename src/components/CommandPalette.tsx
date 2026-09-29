import { useState, useEffect, useRef, useCallback } from 'react';
import { useResearch } from '../context/ResearchContext';

interface PaletteResult {
  label: string;
  description: string;
  action: () => void;
  category: string;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const { state, setModule, savePaperSnapshot, exportReviewPacket } = useResearch();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const results = getSearchResults(query, state, { setModule, savePaperSnapshot, exportReviewPacket });

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => { setSelectedIndex(0); }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter' && results[selectedIndex]) { results[selectedIndex].action(); onClose(); }
  }, [results, selectedIndex, onClose]);

  useEffect(() => {
    if (resultsRef.current) {
      const el = resultsRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center px-4 py-3 border-b border-slate-700/60">
          <span className="text-slate-500 text-sm mr-2">⌘</span>
          <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Search modules, findings, papers, notes..."
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-500 focus:outline-none" />
          <button onClick={onClose} className="text-xs text-slate-500 hover:text-slate-300 px-2 py-1 rounded bg-slate-800">Esc</button>
        </div>
        {results.length > 0 && (
          <div ref={resultsRef} className="max-h-80 overflow-y-auto p-2 space-y-0.5">
            {results.map((r, i) => (
              <button key={`${r.category}-${r.label}`}
                onClick={() => { r.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(i)}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-left text-sm transition-colors ${
                  i === selectedIndex ? 'bg-emerald-900/40 text-emerald-300' : 'text-slate-300 hover:bg-slate-800/60'
                }`}>
                <span className="text-[10px] text-slate-500 uppercase w-16 flex-shrink-0">{r.category}</span>
                <span className="flex-1 min-w-0 truncate">{r.label}</span>
                {r.description && <span className="text-xs text-slate-500 truncate max-w-[200px] hidden sm:block">{r.description}</span>}
              </button>
            ))}
          </div>
        )}
        {query && results.length === 0 && (
          <div className="p-6 text-center text-sm text-slate-500">No results for "{query}"</div>
        )}
      </div>
    </div>
  );
}

function getSearchResults(query: string, state: any, actions: any): PaletteResult[] {
  const q = query.toLowerCase();
  const results: PaletteResult[] = [];

  // Modules
  const modules: { id: string; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'papers', label: 'Papers' },
    { id: 'claimExplorer', label: 'Claim–Evidence'},
    { id: 'numericalAudit', label: 'Numerical Audit' },
    { id: 'gaps', label: 'Research Gaps' },
    { id: 'autopsy', label: 'Research Autopsy' },
    { id: 'novelty', label: 'Idea–Paper Overlap' },
    { id: 'experiments', label: 'Experiment Planner' },
    { id: 'powerCalc', label: 'Statistical Power' },
    { id: 'revisionCompare', label: 'Compare Versions' },
    { id: 'editor', label: 'Research Writer' },
    { id: 'paperAlign', label: 'Paper Alignment' },
    { id: 'reviewerWorkspace', label: 'Reviewer Workspace' },
    { id: 'timeline', label: 'Timeline & Rebuttal' },
    { id: 'professorMode', label: 'Professor Mode' },
    { id: 'rebuttal', label: 'Rebuttal Letter' },
    { id: 'conferences', label: 'Conferences & AI' },
    { id: 'researchGraph', label: 'Research Graph' },
    { id: 'pcMeeting', label: 'PC Meeting' },
    { id: 'roadmap', label: 'Project Roadmap' },
    { id: 'relatedWork', label: 'Related Work' },
    { id: 'memory', label: 'Research Memory' },
  ];

  if (!q) {
    // Show default results
    modules.forEach(m => results.push({ label: m.label, description: '', action: () => actions.setModule(m.id), category: 'Go to' }));
    if (state.paperText) results.push({ label: 'Save paper snapshot', description: '', action: () => actions.savePaperSnapshot(`v${state.paperSnapshots.length + 1}`), category: 'Action' });
    results.push({ label: 'Export review packet', description: '', action: () => actions.exportReviewPacket(), category: 'Action' });
    return results;
  }

  // Filter modules
  modules.forEach(m => {
    if (m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q)) {
      results.push({ label: m.label, description: '', action: () => actions.setModule(m.id), category: 'Go to' });
    }
  });

  // Search findings
  if (state.claimEvidence && q) {
    state.claimEvidence.forEach((ce: any) => {
      if (ce.claim?.toLowerCase().includes(q) || ce.assessment?.includes(q)) {
        results.push({ label: ce.claim?.slice(0, 80), description: ce.assessment, action: () => actions.setModule('claimExplorer'), category: 'Finding' });
      }
    });
  }

  // Search memory
  if (state.memory?.items && q) {
    state.memory.items.forEach((item: any) => {
      if (item.title?.toLowerCase().includes(q) || item.content?.toLowerCase().includes(q)) {
        results.push({ label: item.title?.slice(0, 80), description: item.type, action: () => actions.setModule('memory'), category: 'Note' });
      }
    });
  }

  // Search paper title
  if (state.paperAnalysis?.title?.toLowerCase().includes(q)) {
    results.push({ label: state.paperAnalysis.title, description: 'Current paper', action: () => actions.setModule('papers'), category: 'Paper' });
  }

  return results.slice(0, 20);
}