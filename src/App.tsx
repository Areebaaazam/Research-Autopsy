import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { ResearchProvider, useResearch } from './context/ResearchContext';
import { Sidebar } from './components/Sidebar';
import { CommandPalette } from './components/CommandPalette';
import { QueueSection } from './components/QueueSection';
import { EvidencePanel } from './components/EvidencePanel';
import { NavigationConfirm } from './components/NavigationConfirm';
import { AlertCircle, X, Wifi, WifiOff, Command, PanelRight, PanelRightClose } from 'lucide-react';

// Eager — core working modules
import { DashboardPage } from './pages/DashboardPage';
import { PapersPage } from './pages/PapersPage';
import { SalahPage } from './pages/SalahPage';
import { ClaimExplorerPage } from './pages/ClaimExplorerPage';
import { NumericalAuditPage } from './pages/NumericalAuditPage';
import { GapsPage } from './pages/GapsPage';
import { NoveltyPage } from './pages/NoveltyPage';
import { ExperimentBriefPage } from './pages/ExperimentBriefPage';
import { ReviewerWorkspacePage } from './pages/ReviewerWorkspacePage';
import { AutopsyPage } from './pages/AutopsyPage';
import { EditorPage } from './pages/EditorPage';
import { RevisionComparePage } from './pages/RevisionComparePage';
import { MemoryPage } from './pages/MemoryPage';

// Lazy — advanced/less-used modules
const TimelinePage = lazy(() => import('./pages/TimelinePage').then(m => ({ default: m.TimelinePage })));
const AdversarialPage = lazy(() => import('./pages/AdversarialPage').then(m => ({ default: m.AdversarialPage })));
const PowerCalcPage = lazy(() => import('./pages/PowerCalcPage').then(m => ({ default: m.PowerCalcPage })));
const RelatedWorkPage = lazy(() => import('./pages/RelatedWorkPage').then(m => ({ default: m.RelatedWorkPage })));
const ProfessorModePage = lazy(() => import('./pages/ProfessorModePage').then(m => ({ default: m.ProfessorModePage })));
const RebuttalPage = lazy(() => import('./pages/RebuttalPage').then(m => ({ default: m.RebuttalPage })));
const ConferencesPage = lazy(() => import('./pages/ConferencesPage').then(m => ({ default: m.ConferencesPage })));
const ResearchGraphPage = lazy(() => import('./pages/ResearchGraphPage').then(m => ({ default: m.ResearchGraphPage })));
const PCMeetingPage = lazy(() => import('./pages/PCMeetingPage').then(m => ({ default: m.PCMeetingPage })));
const RoadmapPage = lazy(() => import('./pages/RoadmapPage').then(m => ({ default: m.RoadmapPage })));
const PaperAlignPage = lazy(() => import('./pages/PaperAlignPage').then(m => ({ default: m.PaperAlignPage })));

const MODULE_ROUTES: Record<string, string> = {
  salah: '/salah', dashboard: '/', papers: '/papers', claimExplorer: '/findings', numericalAudit: '/findings/audit',
  gaps: '/findings/gaps', novelty: '/findings/overlap', experiments: '/experiments',
  autopsy: '/findings/autopsy', reviewerWorkspace: '/findings/reviewer', timeline: '/findings/timeline',
  adversarial: '/findings/adversarial', powerCalc: '/experiments/power', relatedWork: '/findings/related',
  professorMode: '/publish/professor', rebuttal: '/publish/rebuttal', editor: '/write',
  conferences: '/publish/conferences', researchGraph: '/findings/graph', pcMeeting: '/publish/pc-meeting',
  roadmap: '/publish/roadmap', paperAlign: '/write/align', revisionCompare: '/revisions',
  memory: '/memory',
};

const ROUTE_TO_MODULE: Record<string, string> = {};
for (const [mod, route] of Object.entries(MODULE_ROUTES)) ROUTE_TO_MODULE[route] = mod;

const SCROLL_KEY = 'research-autopsy-scroll';

function AppContent() {
  const { state, dispatch, analysisMode } = useResearch();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // URL navigation
  useEffect(() => {
    const handler = () => { const p = window.location.pathname; const m = ROUTE_TO_MODULE[p] || 'dashboard'; if (m !== state.currentModule) dispatch({ type: 'SET_MODULE', module: m }); };
    window.addEventListener('popstate', handler); handler(); return () => window.removeEventListener('popstate', handler);
  }, []);

  const prevModule = useRef(state.currentModule);
  useEffect(() => {
    if (prevModule.current !== state.currentModule) {
      // Save scroll for previous module
      if (scrollRef.current) {
        try { localStorage.setItem(SCROLL_KEY + '-' + prevModule.current, String(scrollRef.current.scrollTop)); } catch {}
      }
      const route = MODULE_ROUTES[state.currentModule] || '/'; window.history.pushState(null, '', route); prevModule.current = state.currentModule;
    }
  }, [state.currentModule]);

  // Restore scroll when module or paper changes
  useEffect(() => {
    if (scrollRef.current) {
      try {
        const saved = localStorage.getItem(SCROLL_KEY + '-' + state.currentModule);
        if (saved) { const pos = parseInt(saved, 10); if (!isNaN(pos)) scrollRef.current.scrollTop = pos; }
      } catch {}
    }
  }, [state.currentModule, state.resultPaperHash]);

  // Backend status
  useEffect(() => {
    let cancelled = false;
    fetch('/api/status').then(r => r.ok).then(ok => { if (!cancelled) dispatch({ type: 'SET_BACKEND_STATUS', status: ok ? 'connected' : 'disconnected' }); }).catch(() => { if (!cancelled) dispatch({ type: 'SET_BACKEND_STATUS', status: 'disconnected' }); });
    return () => { cancelled = true; };
  }, []);

  // Unsaved editor prompt
  useEffect(() => { if (!state.editorDirty) return; const h = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ''; }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h); }, [state.editorDirty]);

  // Ctrl+K / Cmd+K
  useEffect(() => { const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(true); } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, []);

  const lazyFallback = <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  const hasPageWithPanel = ['claimExplorer', 'numericalAudit', 'autopsy'].includes(state.currentModule);

  const renderModule = () => {
    const content = (() => {
      switch (state.currentModule) {
        case 'salah': return <SalahPage />;
        case 'dashboard': return <DashboardPage />;
        case 'papers': return <PapersPage />;
        case 'claimExplorer': return <ClaimExplorerPage />;
        case 'numericalAudit': return <NumericalAuditPage />;
        case 'gaps': return <GapsPage />;
        case 'novelty': return <NoveltyPage />;
        case 'experiments': return <ExperimentBriefPage />;
        case 'reviewerWorkspace': return <ReviewerWorkspacePage />;
        case 'autopsy': return <AutopsyPage />;
        case 'editor': return <EditorPage />;
        case 'revisionCompare': return <RevisionComparePage />;
        case 'memory': return <MemoryPage />;
        // Lazy loaded
        case 'timeline': return <TimelinePage />;
        case 'adversarial': return <AdversarialPage />;
        case 'powerCalc': return <PowerCalcPage />;
        case 'relatedWork': return <RelatedWorkPage />;
        case 'professorMode': return <ProfessorModePage />;
        case 'rebuttal': return <RebuttalPage />;
        case 'conferences': return <ConferencesPage />;
        case 'researchGraph': return <ResearchGraphPage />;
        case 'pcMeeting': return <PCMeetingPage />;
        case 'roadmap': return <RoadmapPage />;
        case 'paperAlign': return <PaperAlignPage />;
        default: return <DashboardPage />;
      }
    })();
    return <Suspense fallback={lazyFallback}>{content}</Suspense>;
  };

  return (
    <div className={`flex h-screen ${state.darkMode ? 'dark' : 'light'}`}>
      <div className={`flex-shrink-0 transition-all duration-200 ${state.layout.sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-56'}`}>
        <Sidebar />
      </div>
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-5 py-1.5 border-b border-slate-300/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <button onClick={() => dispatch({ type: 'SET_LAYOUT', layout: { ...state.layout, sidebarCollapsed: !state.layout.sidebarCollapsed } })}
              className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors" title="Toggle sidebar" aria-label="Toggle sidebar">
              <div className="w-4 h-3 flex flex-col justify-between"><span className="block h-px bg-current" /><span className="block h-px bg-current" /><span className="block h-px bg-current" /></div>
            </button>
            {state.paperAnalysis && (
              <div className="flex items-center space-x-2 text-xs">
                <span className={`font-medium ${analysisMode === 'demo' ? 'text-blue-400' : analysisMode === 'ai' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {analysisMode === 'demo' ? 'Demo' : analysisMode === 'ai' ? 'AI' : 'Heuristic'}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-300 truncate max-w-[200px]">{state.paperAnalysis.title}</span>
                {state.paperAnalysis?.paperVersion?.textHash && (
                  <span className="text-slate-600 font-mono text-[10px]">v{state.paperAnalysis.paperVersion.textHash.slice(0, 8)}</span>
                )}
              </div>
            )}
            {state.editorDirty && <span className="text-xs text-amber-400 flex items-center space-x-1"><span>●</span><span>Unsaved</span></span>}
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => setPaletteOpen(!paletteOpen)}
              className="px-2 py-1 text-xs text-slate-500 hover:text-slate-200 border border-slate-700/50 rounded-md flex items-center space-x-1.5 transition-colors">
              <Command className="w-3 h-3" /><span>K</span>
            </button>
            {state.backendStatus === 'disconnected' && <span className="text-xs text-red-400 flex items-center space-x-1"><WifiOff className="w-3 h-3" /><span>Offline</span></span>}
            {state.backendStatus === 'connected' && <span className="text-xs text-emerald-400 flex items-center space-x-1"><Wifi className="w-3 h-3" /><span>Online</span></span>}
            {hasPageWithPanel && (
              <button onClick={() => dispatch({ type: 'SET_LAYOUT', layout: { ...state.layout, evidencePanelOpen: !state.layout.evidencePanelOpen } })}
                className="p-1 text-slate-500 hover:text-slate-200 rounded transition-colors" aria-label="Toggle evidence panel">
                {state.layout.evidencePanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Main content + optional evidence panel */}
        <div className="flex flex-1 min-h-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-5 py-4">
              {state.error && (
                <div className="mb-4 p-3 bg-red-900/40 border border-red-800/60 rounded-md flex items-start justify-between" role="alert">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-red-300">{state.error}</p>
                  </div>
                  <button onClick={() => dispatch({ type: 'SET_ERROR', error: null })} className="text-red-400 hover:text-red-300" aria-label="Dismiss"><X className="w-4 h-4" /></button>
                </div>
              )}
              {renderModule()}
              {state.currentModule === 'dashboard' && <div className="mt-6"><QueueSection /></div>}
            </div>
          </div>
          {hasPageWithPanel && state.layout.evidencePanelOpen && (
            <div className="flex-shrink-0 border-l border-slate-800 overflow-hidden" style={{ width: state.layout.evidencePanelWidth }}>
              <EvidencePanel />
            </div>
          )}
        </div>
      </main>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
      <NavigationConfirm />
    </div>
  );
}

export default function App() {
  return <ResearchProvider><AppContent /></ResearchProvider>;
}