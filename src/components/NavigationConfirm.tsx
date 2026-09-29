import { useResearch } from '../context/ResearchContext';
import { AlertTriangle } from 'lucide-react';

export function NavigationConfirm() {
  const { state, confirmNavigation, cancelNavigation } = useResearch();

  if (!state.navigationTarget) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={cancelNavigation}>
      <div className="fixed inset-0 bg-black/60" />
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-base font-semibold text-slate-100">Unsaved Changes</h3>
            <p className="text-sm text-slate-400 mt-1">You have unsaved changes in the editor. If you leave, your changes will be lost.</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={cancelNavigation}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md transition-colors">
            Stay
          </button>
          <button onClick={confirmNavigation}
            className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white text-sm rounded-md transition-colors">
            Discard & Leave
          </button>
        </div>
      </div>
    </div>
  );
}