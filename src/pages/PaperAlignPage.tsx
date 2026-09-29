import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { analyzePaperAlignment, getDemoAlignment } from '../utils/boomFeatures';
import { CONFERENCE_DATABASE } from '../utils/conferenceData';
import type { PaperAlignment } from '../types';
import { CheckCircle, AlertTriangle, Info, ArrowRight, RefreshCw } from 'lucide-react';

export function PaperAlignPage() {
  const { state } = useResearch();
  const { demoMode } = state;
  const [content, setContent] = useState('');
  const [result, setResult] = useState<PaperAlignment | null>(demoMode ? getDemoAlignment() : null);
  const [targetVenue, setTargetVenue] = useState('NeurIPS 2025');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');

  const venues = CONFERENCE_DATABASE.map(c => `${c.acronym} 2025`).sort();

  const handleAnalyze = () => {
    if (!content.trim()) return;
    const alignment = analyzePaperAlignment(content, targetVenue);
    setResult(alignment);
  };

  const filtered = result
    ? filterSeverity === 'all' ? result.issues : result.issues.filter(i => i.severity === filterSeverity)
    : [];

  const severityIcons: Record<string, React.ReactNode> = {
    error: <AlertTriangle className="w-4 h-4 text-red-400" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400" />,
    info: <Info className="w-4 h-4 text-blue-400" />,
  };

  const countBySeverity = (sev: string) => result?.issues.filter(i => i.severity === sev).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Paper Alignment System</h1>
        <p className="text-sm text-slate-400 mt-1">Structural validation better than Overleaf</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Input */}
        <div className="lg:col-span-3 space-y-4">
          <Card title="Paste Your LaTeX">
            <div className="space-y-3">
              <select value={targetVenue} onChange={e => setTargetVenue(e.target.value)}
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200">
                {venues.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <textarea value={content} onChange={e => setContent(e.target.value)}
                placeholder="% Paste your LaTeX document here...\n\\section{Introduction}\n..."
                className="w-full h-64 bg-slate-900/80 border border-slate-700 rounded-md p-4 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 resize-y" />
              <button onClick={handleAnalyze} disabled={!content.trim()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
                <RefreshCw className="w-4 h-4" />
                <span>Analyze Alignment</span>
              </button>
            </div>
          </Card>
        </div>

        {/* Score Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          {result && (
            <>
              <Card title="Alignment Health">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-24 h-24 -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="#1e293b" strokeWidth="3" />
                      <circle cx="18" cy="18" r="15.5" fill="none"
                        stroke={result.overallHealth >= 80 ? '#10b981' : result.overallHealth >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="3"
                        strokeDasharray={`${result.overallHealth * 0.97} 97`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-bold ${result.overallHealth >= 80 ? 'text-emerald-400' : result.overallHealth >= 50 ? 'text-amber-400' : 'text-red-400'}`}>
                        {result.overallHealth}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Overall alignment score</p>
                </div>
              </Card>

              <Card title="Dimension Scores">
                <div className="space-y-2">
                  {[
                    { label: 'Structure', score: result.structuralScore, color: 'bg-emerald-500' },
                    { label: 'Consistency', score: result.consistencyScore, color: 'bg-blue-500' },
                    { label: 'Formatting', score: result.formatScore, color: 'bg-purple-500' },
                  ].map(d => (
                    <div key={d.label}>
                      <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                        <span>{d.label}</span><span>{d.score}/100</span>
                      </div>
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${d.color}`} style={{ width: `${d.score}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Stats">
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-slate-400">Sections</span><span className="text-slate-200">{result.sectionCount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Words</span><span className="text-slate-200">{result.wordCount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Issues</span><span className="text-slate-200">{result.issues.length}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Missing sections</span><span className="text-red-400">{result.missingSections.length}</span></div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Issues */
      result && (
        <Card title="Alignment Issues" subtitle={`${result.issues.length} total · ${countBySeverity('error')} errors · ${countBySeverity('warning')} warnings · ${countBySeverity('info')} info`}>
          <div className="flex items-center space-x-2 mb-4">
            <FilterBtn label="All" active={filterSeverity === 'all'} onClick={() => setFilterSeverity('all')} count={result.issues.length} />
            <FilterBtn label="Errors" active={filterSeverity === 'error'} onClick={() => setFilterSeverity('error')} count={countBySeverity('error')} color="red" />
            <FilterBtn label="Warnings" active={filterSeverity === 'warning'} onClick={() => setFilterSeverity('warning')} count={countBySeverity('warning')} color="amber" />
            <FilterBtn label="Info" active={filterSeverity === 'info'} onClick={() => setFilterSeverity('info')} count={countBySeverity('info')} color="blue" />
          </div>

          {result.missingSections.length > 0 && (
            <div className="mb-4 p-3 bg-red-900/15 border border-red-800/30 rounded-md">
              <h4 className="text-xs font-semibold text-red-400 mb-1">Missing Required Sections</h4>
              <div className="flex flex-wrap gap-1.5">
                {result.missingSections.map(s => <Badge key={s} variant="danger">{s}</Badge>)}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(issue => (
              <div key={issue.id} className={`flex items-start space-x-3 p-3 border rounded-md ${
                issue.severity === 'error' ? 'bg-red-900/10 border-red-800/30' :
                issue.severity === 'warning' ? 'bg-amber-900/10 border-amber-800/30' :
                'bg-blue-900/10 border-blue-800/30'
              }`}>
                {severityIcons[issue.severity]}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <Badge variant={issue.severity === 'error' ? 'danger' : issue.severity === 'warning' ? 'warning' : 'info'}>
                      {issue.type}
                    </Badge>
                    {issue.section && <span className="text-[10px] text-slate-600">in {issue.section}</span>}
                    {issue.lineNumber && <span className="text-[10px] text-slate-600">line {issue.lineNumber}</span>}
                  </div>
                  <p className="text-sm text-slate-300 mt-1">{issue.description}</p>
                  <div className="flex items-start space-x-1.5 mt-1 text-xs text-emerald-400">
                    <ArrowRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{issue.suggestion}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-6">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No {filterSeverity !== 'all' ? filterSeverity : ''} issues found!</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

function FilterBtn({ label, active, onClick, count, color = 'slate' }: { label: string; active: boolean; onClick: () => void; count: number; color?: string }) {
  const colors: Record<string, string> = { red: 'text-red-400 border-red-800/50 bg-red-900/20', amber: 'text-amber-400 border-amber-800/50 bg-amber-900/20', blue: 'text-blue-400 border-blue-800/50 bg-blue-900/20', slate: 'text-slate-300 border-slate-700/50 bg-slate-800/50' };
  return <button onClick={onClick} className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${active ? colors[color] : 'bg-slate-800/30 text-slate-500 border-transparent'}`}>{label} ({count})</button>;
}