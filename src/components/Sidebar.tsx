import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import {
  LayoutDashboard, FileText, SearchCheck, AlertTriangle, BookOpen, Skull, FlaskConical,
  Beaker, BarChart3, ArrowLeftRight, FileEdit, TestTube, Database,
  Sun, Moon, Sword, Calendar, Sword as SwordIcon, ChevronDown, ChevronRight
} from 'lucide-react';

interface NavItem { id: string; label: string; icon: typeof LayoutDashboard; }

const primaryItems: { label: string; items: NavItem[] }[] = [
  { label: 'Overview', items: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'papers', label: 'Papers', icon: FileText },
  ]},
  { label: 'Review Findings', items: [
    { id: 'claimExplorer', label: 'Claim–Evidence', icon: SearchCheck },
    { id: 'numericalAudit', label: 'Numerical Audit', icon: AlertTriangle },
    { id: 'gaps', label: 'Research Gaps', icon: BookOpen },
    { id: 'autopsy', label: 'Research Autopsy', icon: Skull },
    { id: 'novelty', label: 'Idea–Paper Overlap', icon: FlaskConical },
  ]},
  { label: 'Experiment Plans', items: [
    { id: 'experiments', label: 'Experiment Planner', icon: Beaker },
    { id: 'powerCalc', label: 'Statistical Power', icon: BarChart3 },
  ]},
  { label: 'Revisions', items: [
    { id: 'revisionCompare', label: 'Compare Versions', icon: ArrowLeftRight },
    { id: 'editor', label: 'Research Writer', icon: FileEdit },
    { id: 'paperAlign', label: 'Paper Alignment', icon: TestTube },
  ]},
  { label: 'Export', items: [
    { id: 'memory', label: 'Research Memory', icon: Database },
  ]},
];

const advancedTools: NavItem[] = [
  { id: 'reviewerWorkspace', label: 'Reviewer Workspace', icon: Sword },
  { id: 'timeline', label: 'Timeline & Rebuttal', icon: Calendar },
  { id: 'adversarial', label: 'Attack Simulator', icon: AlertTriangle },
  { id: 'professorMode', label: 'Professor Mode', icon: BookOpen },
  { id: 'rebuttal', label: 'Rebuttal Letter', icon: FileText },
  { id: 'conferences', label: 'Conferences & AI', icon: Calendar },
  { id: 'researchGraph', label: 'Research Graph', icon: Database },
  { id: 'pcMeeting', label: 'PC Meeting Sim', icon: SwordIcon },
  { id: 'roadmap', label: 'Project Roadmap', icon: BarChart3 },
  { id: 'relatedWork', label: 'Related Work Matrix', icon: BookOpen },
];

const activeBtn = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 font-medium shadow-sm';
const inactiveBtn = 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-200/60 dark:hover:bg-slate-800/60';

export function Sidebar() {
  const { state, setModule, toggleTheme, analysisMode } = useResearch();
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <aside className="w-56 bg-slate-100 dark:bg-slate-900/95 border-r border-[var(--border-color)] flex flex-col h-screen flex-shrink-0 backdrop-blur-md">
      <div className="px-5 py-4 border-b border-[var(--border-color)]">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <Skull className="w-5 h-5 text-emerald-500" />
          </div>
          <span className="font-bold text-sm text-slate-800 dark:text-slate-100 tracking-tight">Research Autopsy</span>
        </div>
        <div className="flex items-center space-x-2 mt-2">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            analysisMode === 'demo' ? 'text-blue-600 bg-blue-100 border-blue-200 dark:text-blue-400 dark:bg-blue-900/40 dark:border-blue-800/60' :
            analysisMode === 'ai' ? 'text-emerald-600 bg-emerald-100 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-900/40 dark:border-emerald-800/60' : 'text-amber-600 bg-amber-100 border-amber-200 dark:text-amber-400 dark:bg-amber-900/40 dark:border-amber-800/60'
          }`}>
            {analysisMode === 'demo' ? 'DEMO MODE' : analysisMode === 'ai' ? 'AI MODE' : 'HEURISTIC'}
          </span>
          {state.backendStatus === 'connected' && <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" title="Server online" />}
          {state.backendStatus === 'disconnected' && <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-500/30" title="Server offline" />}
        </div>
      </div>

      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-3">
        {primaryItems.map(section => (
          <div key={section.label}>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-1">{section.label}</p>
            <div className="space-y-0.5">
              {section.items.map(item => {
                const Icon = item.icon;
                const active = state.currentModule === item.id;
                return (
                  <button key={item.id} onClick={() => setModule(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${active ? activeBtn : inactiveBtn}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div>
          <button onClick={() => setAdvancedOpen(!advancedOpen)}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            <span>Advanced Tools</span>
            {advancedOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          </button>
          {advancedOpen && (
            <div className="space-y-0.5 mt-1">
              {advancedTools.map(item => {
                const Icon = item.icon;
                const active = state.currentModule === item.id;
                return (
                  <button key={item.id} onClick={() => setModule(item.id)}
                    className={`w-full flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs transition-all ${active ? activeBtn : inactiveBtn}`}>
                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="p-3 border-t border-[var(--border-color)]">
        <button onClick={toggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-700">
          <div className="flex items-center space-x-2">
            {state.darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
            <span>{state.darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">{state.darkMode ? 'DARK' : 'LIGHT'}</span>
        </button>
      </div>
    </aside>
  );
}