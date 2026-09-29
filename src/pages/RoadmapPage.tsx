import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Calendar, Clock, AlertTriangle, Flag, ArrowRight, GitBranch } from 'lucide-react';

export function RoadmapPage() {
  const { state } = useResearch();
  const { roadmap, paperAnalysis } = state;
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12"><Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Load a paper to generate a publication roadmap.</p>
        </div>
      </Card>
    );
  }

  if (!roadmap) {
    return (
      <Card>
        <div className="text-center py-10"><Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Load the demo project to see a complete publication roadmap with Gantt chart.</p>
        </div>
      </Card>
    );
  }

  const totalWeeks = roadmap.phases.reduce((max, p) => Math.max(max, p.startWeek + p.durationWeeks), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">PhD Project Roadmap</h1>
          <p className="text-sm text-slate-400 mt-1">From now to submission deadline</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-400">{roadmap.weeksUntilDeadline} weeks</div>
          <div className="text-xs text-slate-500">until {roadmap.targetVenue} deadline</div>
        </div>
      </div>

      <Card title="Target" subtitle={`${roadmap.title}`}>
        <div className="flex items-center space-x-4">
          <Badge variant="success">{roadmap.targetVenue}</Badge>
          <span className="text-sm text-slate-400">Deadline: {roadmap.deadline}</span>
          <span className="text-sm text-slate-400">{roadmap.phases.length} phases</span>
        </div>
      </Card>

      {/* Gantt Chart */}
      <Card title="Gantt Chart" subtitle="Phases over time">
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Header */}
            <div className="flex items-center mb-2 text-[10px] text-slate-500">
              <div className="w-48 flex-shrink-0">Phase</div>
              <div className="flex-1 flex">
                {Array.from({ length: Math.ceil(totalWeeks / 4) }).map((_, i) => (
                  <div key={i} className="flex-1 text-center border-l border-slate-800">{i * 4}w</div>
                ))}
              </div>
            </div>
            {/* Bars */}
            {roadmap.phases.map(phase => {
              const isExpanded = expandedPhase === phase.id;
              const leftPct = (phase.startWeek / totalWeeks) * 100;
              const widthPct = (phase.durationWeeks / totalWeeks) * 100;
              const statusColors: Record<string, string> = { completed: 'bg-emerald-600', in_progress: 'bg-amber-500', pending: 'bg-slate-600' };
              return (
                <div key={phase.id}>
                  <button onClick={() => setExpandedPhase(isExpanded ? null : phase.id)} className="w-full flex items-center py-2 hover:bg-slate-800/40 rounded transition-colors text-left">
                    <div className="w-48 flex-shrink-0 flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${statusColors[phase.status]}`} />
                      <span className="text-xs text-slate-300 truncate">{phase.name}</span>
                    </div>
                    <div className="flex-1 relative h-6">
                      <div className="absolute inset-y-0" style={{ left: `${leftPct}%`, width: `${widthPct}%` }}>
                        <div className={`h-full rounded ${statusColors[phase.status]} opacity-60 border border-${phase.status === 'completed' ? 'emerald' : phase.status === 'in_progress' ? 'amber' : 'slate'}-700/50`} />
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 w-16 text-right">{phase.startWeek}-{phase.startWeek + phase.durationWeeks}w</span>
                  </button>
                  {isExpanded && (
                    <div className="ml-48 mb-2 p-3 bg-slate-900/60 border border-slate-700/40 rounded-md space-y-2">
                      <div className="flex items-center space-x-2">
                        <Flag className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-xs text-emerald-300">{phase.milestone}</span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-semibold text-slate-500 uppercase">Tasks</h4>
                        <ul className="space-y-1 mt-1">
                          {phase.tasks.map((task, i) => (
                            <li key={i} className="text-xs text-slate-400 flex items-start space-x-1.5">
                              <span className="text-slate-600">•</span>
                              <span>{task}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      {phase.dependsOn.length > 0 && (
                        <div className="flex items-center space-x-1 text-[10px] text-amber-400">
                          <GitBranch className="w-3 h-3" />
                          <span>Depends on: {phase.dependsOn.map(d => roadmap.phases.find(p => p.id === d)?.name || d).join(', ')}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Critical Path" subtitle="Must-complete phases">
          <div className="space-y-2">
            {roadmap.criticalPath.map((step, i) => (
              <div key={i} className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-emerald-400">{i + 1}</span>
                </div>
                <span className="text-sm text-slate-300">{step}</span>
                {i < roadmap.criticalPath.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600" />}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Risk Factors" subtitle="Watch out for these">
          <div className="space-y-2">
            {roadmap.riskFactors.map((risk, i) => (
              <div key={i} className="flex items-start space-x-2 p-2 bg-red-900/15 border border-red-800/30 rounded-md">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300">{risk}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}