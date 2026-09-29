import { useState, useCallback, useRef, useEffect } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import {
  Edit3, RefreshCw, Save, Download, Upload,
  PanelRight, PanelRightClose, Highlighter, BrainCircuit, FileSearch, FileText,
  CheckCircle, XCircle, Clock, AlertTriangle
} from 'lucide-react';
import { analyzeAIContent, traceSources } from '../utils/aiDetection';
import type { AIDetectionResult, SourceTraceResult } from '../types';

type EditorTab = 'write' | 'sources' | 'detection';

const AUTOSAVE_DELAY = 2000;
const DRAFT_KEY_PREFIX = 'research-autopsy-draft-';

function hashContent(str: string): number {
  if (!str) return 0;
  let h = 0; for (let i = 0; i < str.length; i++) { h = ((h << 5) - h) + str.charCodeAt(i); h |= 0; } return h;
}

export function EditorPage() {
  const { state, dispatch, addMemoryItem } = useResearch();
  const { paperText, paperTextHash, draftState } = state;
  const paperHashAtLoad = useRef(paperTextHash);

  // Restore draft scoped to paper version — never default to demo content
  const [content, setContent] = useState(() => {
    const key = DRAFT_KEY_PREFIX + (paperTextHash || 'default');
    // Check context state first
    if (draftState && draftState.version === hashContent(paperTextHash)) {
      return draftState.content;
    }
    // Check localStorage
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const p = JSON.parse(saved);
        if (p.content && typeof p.content === 'string') return p.content;
      }
    } catch {}
    // No draft found for this paper — start empty
    return '';
  });
  const [activeTab, setActiveTab] = useState<EditorTab>('write');
  const [showPaper, setShowPaper] = useState(true);
  const [aiResult, setAiResult] = useState<AIDetectionResult | null>(null);
  const [sourceResult, setSourceResult] = useState<SourceTraceResult | null>(null);
  const [showHighlighted, setShowHighlighted] = useState(false);
  const [docTitle, setDocTitle] = useState(() => {
    const key = DRAFT_KEY_PREFIX + (paperTextHash || 'default');
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const p = JSON.parse(saved);
        return p.title || 'Untitled';
      }
    } catch {}
    return 'Untitled';
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'failed' | 'unsaved'>('saved');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef(content);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contentHashAtLastTrace = useRef(0);
  const sourceHashAtLastTrace = useRef('');

  contentRef.current = content;
  paperHashAtLoad.current = paperTextHash;

  // Autosave with debounce — scoped to current paper hash
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSaveStatus('unsaved');
    dispatch({ type: 'SET_EDITOR_DIRTY', dirty: true });

    timerRef.current = setTimeout(() => {
      setSaveStatus('saving');
      try {
        const key = DRAFT_KEY_PREFIX + (paperTextHash || 'default');
        const data = JSON.stringify({ content: contentRef.current, title: docTitle, savedAt: Date.now(), version: hashContent(paperTextHash) });
        localStorage.setItem(key, data);
        setSaveStatus('saved');
        dispatch({ type: 'SET_DRAFT', draft: { content: contentRef.current, savedAt: Date.now(), version: hashContent(paperTextHash) } });
      } catch { setSaveStatus('failed'); }
    }, AUTOSAVE_DELAY);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [content, docTitle, paperTextHash, dispatch]);

  useEffect(() => { if (saveStatus === 'saved') dispatch({ type: 'SET_EDITOR_DIRTY', dirty: false }); }, [saveStatus, dispatch]);

  // Detect paper switch
  useEffect(() => {
    if (paperHashAtLoad.current !== paperTextHash) {
      paperHashAtLoad.current = paperTextHash;
    }
  }, [paperTextHash]);

  // Unsaved changes protection
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => { if (saveStatus === 'unsaved') { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [saveStatus]);

  const paperContent = paperText || 'Load a paper first to view it alongside your document.';

  const handleChange = useCallback((value: string) => { setContent(value); }, []);

  const handleRunAIDetection = useCallback(() => {
    const result = analyzeAIContent(content);
    setAiResult(result);
    setActiveTab('detection');
  }, [content]);

  const handleRunSourceTrace = useCallback(() => {
    const sources = paperText ? [paperText] : undefined;
    const result = traceSources(content, sources);
    contentHashAtLastTrace.current = hashContent(content);
    sourceHashAtLastTrace.current = paperTextHash;
    setSourceResult(result);
    setActiveTab('sources');
  }, [content, paperText, paperTextHash]);

  // Invalidate stale source trace when content or source changes
  useEffect(() => {
    if (sourceResult && contentHashAtLastTrace.current !== 0) {
      const changed = hashContent(content) !== contentHashAtLastTrace.current || sourceHashAtLastTrace.current !== paperTextHash;
      if (changed) { setSourceResult(null); contentHashAtLastTrace.current = 0; }
    }
  }, [content, paperTextHash, sourceResult]);

  const handleSaveToMemory = useCallback(() => {
    try { addMemoryItem({ type: 'paper', title: `Editor: ${docTitle}`, content: content.slice(0, 500), tags: ['editor', 'document'] }); } catch {}
  }, [content, docTitle, addMemoryItem]);

  const handleExportTex = useCallback(() => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${docTitle.replace(/\s+/g, '_')}.tex`; a.click();
    URL.revokeObjectURL(url);
  }, [content, docTitle]);

  const handleExportPdf = useCallback(async () => {
    try {
      const res = await fetch('/api/create-pdf-blank', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: docTitle, content }) });
      const data = await res.json();
      if (data.latex) {
        const blob = new Blob([data.latex], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = `${docTitle.replace(/\s+/g, '_')}_formatted.tex`; a.click();
        URL.revokeObjectURL(url);
      }
    } catch {}
  }, [content, docTitle]);

  const handleImport = useCallback(() => { fileInputRef.current?.click(); }, []);
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => { const text = evt.target?.result as string; if (text) { setContent(text); setDocTitle(file.name.replace(/\.(tex|txt|md)$/, '')); } };
    reader.readAsText(file); e.target.value = '';
  }, []);

  const highlightedContent = showHighlighted && aiResult ? highlightSentences(content, aiResult.sentences) : null;

  // Find abstract start position for "jump to abstract"
  const abstractStart = paperText.search(/\bAbstract[\s:\u2014-]+/i);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-bold text-[var(--text-primary)]">Research Writer</h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">Editor with writing patterns & source comparison</p>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0 flex-wrap gap-y-1 justify-end">
          <div className={`text-xs flex items-center space-x-1 px-2 py-1 rounded ${
            saveStatus === 'saved' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20' :
            saveStatus === 'saving' ? 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/20' :
            saveStatus === 'failed' ? 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20' :
            'text-[var(--text-muted)] bg-[var(--bg-secondary)]'
          }`}>
            {saveStatus === 'saved' && <><CheckCircle className="w-3 h-3" /><span>Saved</span></>}
            {saveStatus === 'saving' && <><Clock className="w-3 h-3 animate-pulse" /><span>Saving...</span></>}
            {saveStatus === 'failed' && <><XCircle className="w-3 h-3" /><span>Save failed</span></>}
            {saveStatus === 'unsaved' && <span>Unsaved</span>}
          </div>
          <button onClick={handleSaveToMemory} className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs rounded-md transition-colors flex items-center space-x-1">
            <Save className="w-3.5 h-3.5" /><span>Save to Memory</span>
          </button>
          <button onClick={handleExportTex} className="px-2.5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-md transition-colors flex items-center space-x-1">
            <Download className="w-3.5 h-3.5" /><span>Export LaTeX</span>
          </button>
          <button onClick={handleExportPdf} className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 dark:bg-blue-700 dark:hover:bg-blue-600 text-white text-xs rounded-md transition-colors flex items-center space-x-1">
            <FileText className="w-3.5 h-3.5" /><span>Export PDF</span>
          </button>
          <button onClick={handleImport} className="px-2.5 py-1.5 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-xs rounded-md transition-colors flex items-center space-x-1">
            <Upload className="w-3.5 h-3.5" /><span>Import</span>
          </button>
          <input ref={fileInputRef} type="file" accept=".tex,.txt,.md" onChange={handleFileChange} className="hidden" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-[var(--border-color)] pb-2 overflow-x-auto">
        <TabBtn label="Write" icon={<Edit3 className="w-4 h-4" />} active={activeTab === 'write'} onClick={() => setActiveTab('write')} />
        <TabBtn label="Writing Patterns" icon={<BrainCircuit className="w-4 h-4" />} active={activeTab === 'detection'} onClick={handleRunAIDetection} badge={aiResult ? `${aiResult.overallScore}%` : undefined} />
        <TabBtn label="Source Compare" icon={<FileSearch className="w-4 h-4" />} active={activeTab === 'sources'} onClick={handleRunSourceTrace} badge={sourceResult && !sourceResult.summary.startsWith('Not assessed') ? `${sourceResult.overallOriginality}%` : undefined} />
        <div className="flex-1" />
        <button onClick={() => setShowPaper(!showPaper)} className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center space-x-1 flex-shrink-0">
          {showPaper ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRight className="w-3.5 h-3.5" />}
          <span>{showPaper ? 'Hide paper' : 'Show paper'}</span>
        </button>
      </div>

      {/* Editor area */}
      <div className="flex space-x-4">
        <div className={`flex-1 min-w-0 ${!showPaper ? 'max-w-full' : ''}`}>
          {activeTab === 'write' && (
            <div className="space-y-3">
              <input value={docTitle} onChange={e => setDocTitle(e.target.value)}
                className="w-full bg-transparent border-b border-[var(--border-color)] pb-2 text-lg font-semibold text-[var(--text-primary)] focus:outline-none focus:border-emerald-600/50"
                placeholder="Document title" />
              <div className="relative">
                {showHighlighted && highlightedContent ? (
                  <div className="w-full max-w-[75ch] min-h-[500px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md p-5 text-base leading-relaxed overflow-y-auto whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: highlightedContent }} />
                ) : (
                  <textarea value={content} onChange={e => handleChange(e.target.value)}
                    className="w-full max-w-[75ch] min-h-[500px] bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md p-5 text-base leading-relaxed text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-y"
                    placeholder="Start writing..." spellCheck={false} />
                )}
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <button onClick={() => setShowHighlighted(!showHighlighted)} disabled={!aiResult}
                    className={`p-1.5 rounded text-xs transition-colors ${showHighlighted ? 'bg-emerald-700/50 text-emerald-300' : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'} disabled:opacity-30`}>
                    <Highlighter className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] text-[var(--text-muted)]">{content.split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'detection' && <AIDetectionPanel result={aiResult} content={content} onRun={handleRunAIDetection} />}
          {activeTab === 'sources' && <SourceTracePanel result={sourceResult} onRun={handleRunSourceTrace} sourceCount={paperText ? 1 : 0} />}
        </div>
        {showPaper && (
          <div className="w-72 flex-shrink-0 hidden md:block">
            <Card title="Paper Source">
              <div className="text-sm text-[var(--text-secondary)] leading-relaxed space-y-2 overflow-y-auto max-h-[600px]">
                {abstractStart >= 0 && (
                  <a href="#paper-abstract" className="text-xs text-emerald-400 hover:text-emerald-300 block"
                    onClick={(e) => { e.preventDefault(); const el = document.getElementById('paper-abstract'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }}>
                    Jump to Abstract →
                  </a>
                )}
                <div className="whitespace-pre-wrap break-words" id="paper-abstract">
                  {paperContent}
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-[var(--border-color)]">
                <p className="text-[10px] text-[var(--text-muted)]">Reference paper while writing.</p>
                <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Your document is separate.</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

function TabBtn({ label, icon, active, onClick, badge }: { label: string; icon: React.ReactNode; active: boolean; onClick: () => void; badge?: string }) {
  return <button onClick={onClick} className={`px-3 py-2 text-sm rounded-t-md transition-colors flex items-center space-x-1.5 flex-shrink-0 border-b-2 ${active ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-transparent hover:border-[var(--border-color)]'}`}>
    {icon}<span>{label}</span>{badge ? <span className="text-[10px] px-1 py-0.5 rounded bg-[var(--bg-secondary)] text-[var(--text-muted)]">{badge}</span> : null}
  </button>;
}

function AIDetectionPanel({ result, content, onRun }: { result: AIDetectionResult | null; content: string; onRun: () => void }) {
  const sentCount = content.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 15).length;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">{sentCount} sentences analyzed</p>
        <button onClick={onRun} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white text-xs rounded-md transition-colors flex items-center space-x-1">
          <RefreshCw className="w-3 h-3" /><span>Re-analyze</span>
        </button>
      </div>
      {!result ? (
        <Card><div className="text-center py-8"><BrainCircuit className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" /><p className="text-sm text-[var(--text-secondary)]">Click "Writing Patterns" to analyze for common formulaic patterns.</p></div></Card>
      ) : (
        <>
          <Card title="Writing Pattern Score" subtitle="Heuristic analysis — not verified authorship attribution">
            <div className="flex items-center space-x-4">
              <div className="relative w-20 h-20 flex-shrink-0">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--border-color)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={result.overallScore >= 50 ? '#ef4444' : result.overallScore >= 25 ? '#f59e0b' : '#10b981'} strokeWidth="3" strokeDasharray={`${result.overallScore * 0.97} 97`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center"><span className={`text-xl font-bold ${result.overallScore >= 50 ? 'text-red-400' : result.overallScore >= 25 ? 'text-amber-400' : 'text-emerald-400'}`}>{result.overallScore}%</span></div>
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-[var(--text-primary)]">{result.summary}</p>
                <div className="p-2 bg-amber-900/15 border border-amber-800/30 rounded-md">
                  <div className="flex items-start space-x-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-200/80">This score measures how many sentences match formulaic patterns. Human academic writing frequently uses the same patterns. This is not a verified authorship test.</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
          {result.breakdown.length > 0 && (
            <Card title="Pattern Breakdown">
              <div className="space-y-2">{result.breakdown.map((b, i) => (
                <div key={i} className="flex items-center space-x-3">
                  <span className="text-xs text-[var(--text-secondary)] w-32 truncate">{b.category}</span>
                  <div className="flex-1 h-4 bg-[var(--bg-secondary)] rounded-full overflow-hidden"><div className="h-full bg-emerald-600/60 rounded-full" style={{ width: `${b.contribution}%` }} /></div>
                  <span className="text-xs text-[var(--text-muted)] w-8 text-right">{b.contribution}%</span>
                </div>
              ))}</div>
            </Card>
          )}
          <Card title="Sentence Analysis">
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {result.sentences.map(s => (
                <div key={s.index} className={`flex items-start space-x-3 py-1.5 text-xs border-b border-[var(--border-color)] ${s.highlight === 'high' ? 'bg-red-900/20' : s.highlight === 'medium' ? 'bg-amber-900/15' : s.highlight === 'low' ? 'bg-yellow-900/10' : ''}`}>
                  <span className="text-[var(--text-muted)] w-6 flex-shrink-0">{s.index + 1}</span>
                  <p className="flex-1 text-[var(--text-primary)] leading-relaxed">{s.text}</p>
                  <span className={`w-12 text-right font-mono font-bold flex-shrink-0 ${s.score >= 60 ? 'text-red-400' : s.score >= 35 ? 'text-amber-400' : s.score >= 15 ? 'text-yellow-400' : 'text-[var(--text-muted)]'}`}>{s.score}%</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function SourceTracePanel({ result, onRun, sourceCount }: { result: SourceTraceResult | null; onRun: () => void; sourceCount: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          {sourceCount > 0 ? `${sourceCount} source(s) loaded for comparison` : 'No source loaded for comparison'}
        </p>
        <button onClick={onRun} disabled={sourceCount === 0}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-700 dark:hover:bg-emerald-600 disabled:bg-[var(--bg-secondary)] text-white disabled:text-[var(--text-muted)] text-xs rounded-md transition-colors flex items-center space-x-1">
          <RefreshCw className="w-3 h-3" /><span>Trace sources</span>
        </button>
      </div>
      {!result && sourceCount === 0 && (
        <Card><div className="text-center py-8"><FileSearch className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" /><p className="text-sm text-[var(--text-secondary)]">Load a paper source in the Papers page, then run Source Compare to check for similar phrasing.</p></div></Card>
      )}
      {!result && sourceCount > 0 && (
        <Card><div className="text-center py-8"><FileSearch className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" /><p className="text-sm text-[var(--text-secondary)]">Click "Trace sources" to compare your draft against the loaded paper.</p></div></Card>
      )}
      {result && result.summary.startsWith('Not assessed') && (
        <Card><div className="text-center py-8">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
          <p className="text-sm text-[var(--text-secondary)]">Not assessed — add a paper source to compare against.</p>
        </div></Card>
      )}
      {result && !result.summary.startsWith('Not assessed') && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Phrasing Similarity">
              <div className="text-center">
                <span className={`text-3xl font-bold ${result.overallOriginality >= 70 ? 'text-emerald-400' : result.overallOriginality >= 50 ? 'text-amber-400' : 'text-red-400'}`}>{result.overallOriginality}%</span>
                <p className="text-xs text-[var(--text-muted)] mt-1">different from sources</p>
              </div>
            </Card>
            <Card title="Matches Found">
              <div className="text-center"><span className="text-3xl font-bold text-[var(--text-primary)]">{result.matches.length}</span><p className="text-xs text-[var(--text-muted)] mt-1">sentences matched</p></div>
            </Card>
            <Card title="Top Source">
              <div className="text-center"><span className="text-sm font-bold text-[var(--text-primary)]">{result.mostMatchedSource?.replace(/_/g, ' ') || 'None'}</span><p className="text-xs text-[var(--text-muted)] mt-1">most frequent pattern</p></div>
            </Card>
          </div>
          <p className="text-sm text-[var(--text-secondary)] p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md">{result.summary}</p>
          {result.matches.length > 0 && (
            <Card title="Matched Sentences">
              <div className="space-y-2">{result.matches.map((m, i) => (
                <div key={i} className="p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-md">
                  <div className="flex items-center justify-between"><span className="text-[10px] font-semibold text-amber-400">Sentence {m.sentenceIndex + 1}</span><span className={`text-xs font-bold ${m.similarity >= 70 ? 'text-red-400' : 'text-amber-400'}`}>{m.similarity}% match</span></div>
                  <p className="text-sm text-[var(--text-primary)] mt-1">{m.sentence}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Similar to: "{m.sourceText}"</p>
                </div>
              ))}</div>
            </Card>
          )}
        </>
      )}
      {result && result.summary === 'No matches found in the compared sources. Common academic phrases were checked.' && result.matches.length === 0 && (
        <Card><div className="text-center py-6"><CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" /><p className="text-sm text-[var(--text-secondary)]">No matches found in the compared sources.</p></div></Card>
      )}
    </div>
  );
}

function highlightSentences(text: string, sentences: { index: number; text: string; score: number; pattern: string; highlight: 'none' | 'low' | 'medium' | 'high' }[]): string {
  const parts = text.split(/(?<=[.!?])\s+/);
  return parts.map((part, i) => {
    const s = sentences.find(s => s.index === i || part.trim().startsWith(s.text.slice(0, 20)));
    if (!s || s.highlight === 'none') return escapeHtml(part);
    const colors = { high: 'rgba(239, 68, 68, 0.25)', medium: 'rgba(245, 158, 11, 0.2)', low: 'rgba(234, 179, 8, 0.12)' };
    return `<span style="background:${colors[s.highlight]};border-bottom:2px solid ${s.highlight === 'high' ? '#ef4444' : s.highlight === 'medium' ? '#f59e0b' : '#eab308'};border-radius:2px;" title="AI score:${s.score}% — ${s.pattern}">${escapeHtml(part)}</span>`;
  }).join(' ');
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}