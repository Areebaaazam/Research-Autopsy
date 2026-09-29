import { useRef, useCallback, useEffect } from 'react';
import { useResearch } from '../context/ResearchContext';
import { X, CheckCircle, AlertTriangle, GripVertical } from 'lucide-react';

export function EvidencePanel() {
  const { state, dispatch } = useResearch();
  const { claimEvidence, numericalAudit, paperText, layout } = state;
  const panelRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);

  const topFinding = numericalAudit?.findings?.find(f => f.assessment === 'inconsistent')
    || claimEvidence[0] || null;

  // Resize with pointer
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isResizing.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.max(280, Math.min(600, window.innerWidth - e.clientX - 20));
    dispatch({ type: 'SET_LAYOUT', layout: { ...layout, evidencePanelWidth: newWidth } });
  }, [dispatch, layout]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (isResizing.current) {
      isResizing.current = false;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    }
  }, []);

  // Keyboard resize: Alt+Left/Right
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      if (e.key === 'ArrowRight') {
        const newWidth = Math.min(600, layout.evidencePanelWidth + 40);
        dispatch({ type: 'SET_LAYOUT', layout: { ...layout, evidencePanelWidth: newWidth } });
      } else if (e.key === 'ArrowLeft') {
        const newWidth = Math.max(280, layout.evidencePanelWidth - 40);
        dispatch({ type: 'SET_LAYOUT', layout: { ...layout, evidencePanelWidth: newWidth } });
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [layout, dispatch]);

  if (!topFinding) {
    return (
      <div ref={panelRef} className="flex h-full">
<ResizeHandle onPointerDown={onPointerDown} onPointerMove={onPointerMove} />
        <div className="flex-1 p-4 text-sm text-slate-500 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence</h3>
            <button onClick={() => dispatch({ type: 'SET_LAYOUT', layout: { ...layout, evidencePanelOpen: false } })} className="text-slate-500 hover:text-slate-300"><X className="w-3.5 h-3.5" /></button>
          </div>
          <p className="text-xs">No findings loaded. Run analysis on a paper to populate evidence.</p>
        </div>
      </div>
    );
  }

  const isNumeric = 'deterministicResult' in topFinding;

  return (
    <div ref={panelRef} className="flex h-full" onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
      <ResizeHandle onPointerDown={onPointerDown} onPointerMove={onPointerMove} />
      <div className="flex-1 p-4 text-sm overflow-y-auto min-h-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evidence</h3>
          <button onClick={() => dispatch({ type: 'SET_LAYOUT', layout: { ...layout, evidencePanelOpen: false } })}
            className="text-slate-500 hover:text-slate-300 p-1 rounded transition-colors"><X className="w-3.5 h-3.5" /></button>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-slate-900/60 border border-slate-700/50 rounded-md">
            <h4 className="text-[10px] font-semibold text-slate-500 uppercase mb-1">
              {'passageValidated' in topFinding && !topFinding.passageValidated && '⚠ '}Source Passage
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">{(topFinding as any).sourcePassage || (topFinding as any).supportingPassage}</p>
            {'sourceSection' in topFinding && (topFinding as any).sourceSection && (
              <p className="text-[10px] text-slate-600 mt-1">{(topFinding as any).sourceSection}</p>
            )}
            {'passageValidated' in topFinding && !topFinding.passageValidated && (
              <p className="text-[10px] text-amber-400 mt-1">Passage not validated against source text.</p>
            )}
          </div>

          <div className={`p-3 rounded-md border ${
            (topFinding as any).assessment === 'consistent' || (topFinding as any).assessment === 'supported' ? 'bg-emerald-900/15 border-emerald-800/30' :
            (topFinding as any).assessment === 'inconsistent' ? 'bg-red-900/15 border-red-800/30' :
            (topFinding as any).assessment === 'partially_supported' ? 'bg-amber-900/15 border-amber-800/30' :
            'bg-slate-800/50 border-slate-700/50'
          }`}>
            <div className="flex items-center space-x-1.5 mb-1">
              {(topFinding as any).assessment === 'supported' || (topFinding as any).assessment === 'consistent' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
              <span className="text-xs font-semibold capitalize">{(topFinding as any).assessment?.replace(/_/g, ' ')}</span>
            </div>
            <p className="text-xs text-slate-400">{(topFinding as any).assessmentReason || (topFinding as any).reason}</p>
          </div>

          {isNumeric && 'extractedValues' in topFinding && (
            <div className="space-y-1.5">
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase">Extracted Values</h4>
              {(topFinding as any).extractedValues?.slice(0, 4).map((v: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-1 border-b border-slate-800 last:border-0">
                  <span className="text-slate-400">{v.label}</span>
                  <span className="text-slate-200 font-mono">{v.value} {v.unit}</span>
                </div>
              ))}
            </div>
          )}

          {paperText && (
            <details className="group">
              <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-300 transition-colors">Paper context</summary>
              <div className="mt-1 p-2 bg-slate-900/40 border border-slate-800/60 rounded text-[10px] text-slate-500 max-h-32 overflow-y-auto leading-relaxed font-mono">
                {paperText.slice(0, 1000)}{paperText.length > 1000 ? '...' : ''}
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

function ResizeHandle({ onPointerDown, onPointerMove }: {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
}) {
  return (
    <div className="w-1.5 flex-shrink-0 cursor-col-resize hover:bg-emerald-700/30 active:bg-emerald-600/40 transition-colors flex items-center justify-center group"
      onPointerDown={onPointerDown}
      role="slider" aria-label="Resize evidence panel" aria-orientation="vertical"
      tabIndex={0}
      onKeyDown={e => { if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); onPointerMove(e as unknown as React.PointerEvent); } }}>
      <GripVertical className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}