import { useState, useCallback } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { CONFERENCE_DATABASE, DEMO_SUBMISSIONS, FORMAT_TEMPLATE_INFO } from '../utils/conferenceData';
import { AVAILABLE_TASKS, createTask, executeTask, DEMO_AI_ENGINE } from '../utils/aiEngine';
import type { Conference, ConferenceSubmission, AIProcessTask, AIEngineState } from '../types';
import {
  Calendar, Clock, Globe, FileText, ExternalLink, CheckCircle, XCircle,
  Activity, Cpu, Play, Trash2, ChevronDown, ChevronRight, Zap,
  Search, BookOpen, MapPin
} from 'lucide-react';

export function ConferencesPage() {
  const { state, addMemoryItem } = useResearch();
  const demoMode = state.demoMode;
  const [conferences] = useState<Conference[]>(CONFERENCE_DATABASE);
  const [submissions] = useState<ConferenceSubmission[]>(demoMode ? DEMO_SUBMISSIONS as ConferenceSubmission[] : []);
  const [aiEngine, setAiEngine] = useState<AIEngineState>(demoMode ? DEMO_AI_ENGINE : { isRunning: false, tasks: [], activeTaskCount: 0, totalTasksCompleted: 0, lastRunAt: null });
  const [activeTab, setActiveTab] = useState<'conferences' | 'submissions' | 'engine'>('conferences');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [fieldFilter, setFieldFilter] = useState<string>('all');
  const [expandedConf, setExpandedConf] = useState<string | null>(null);
  const [showNewSub, setShowNewSub] = useState(false);

  const fields = [...new Set(conferences.map(c => c.field))].sort();
  const filtered = conferences.filter(c => {
    if (tierFilter !== 'all' && c.tier !== tierFilter) return false;
    if (fieldFilter !== 'all' && c.field !== fieldFilter) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.acronym.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // AI Engine handlers
  const queueTask = useCallback((type: AIProcessTask['type'], label: string) => {
    const task = createTask(type, label);
    setAiEngine(prev => ({
      ...prev,
      tasks: [...prev.tasks, task],
      activeTaskCount: prev.activeTaskCount + 1,
      isRunning: true,
    }));

    executeTask(
      task,
      (id, progress) => {
        setAiEngine(prev => ({
          ...prev,
          tasks: prev.tasks.map(t => t.id === id ? { ...t, progress } : t),
        }));
      },
      (completedTask) => {
        setAiEngine(prev => {
          const newTasks = prev.tasks.map(t => t.id === completedTask.id ? completedTask : t);
          const activeCount = newTasks.filter(t => t.status === 'running' || t.status === 'queued').length;
          return {
            ...prev,
            tasks: newTasks,
            activeTaskCount: activeCount,
            totalTasksCompleted: prev.totalTasksCompleted + (completedTask.status === 'completed' ? 1 : 0),
            isRunning: activeCount > 0,
            lastRunAt: completedTask.status === 'completed' ? Date.now() : prev.lastRunAt,
          };
        });
      }
    );
  }, []);

  const runAllTasks = useCallback(() => {
    for (const t of AVAILABLE_TASKS) {
      queueTask(t.type, t.label);
    }
  }, [queueTask]);

  const clearTasks = useCallback(() => {
    setAiEngine(prev => ({ ...prev, tasks: [], activeTaskCount: 0 }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setAiEngine(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id),
      activeTaskCount: prev.tasks.filter(t => t.id !== id && (t.status === 'running' || t.status === 'queued')).length,
    }));
  }, []);

  // Countdown helper
  const daysUntil = (deadlineStr: string) => {
    const months: Record<string, number> = { January: 0, February: 1, March: 2, April: 3, May: 4, June: 5, July: 6, August: 7, September: 8, October: 9, November: 10, December: 11 };
    const parts = deadlineStr.split(' ');
    if (parts.length < 2) return null;
    const month = months[parts[0]];
    const day = parseInt(parts[1]);
    if (month === undefined || isNaN(day)) return null;
    const date = new Date(2025, month, day);
    const now = new Date();
    const diff = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    return diff;
  };

  const tierColors: Record<string, string> = {
    'A*': 'text-emerald-400 border-emerald-700/50 bg-emerald-900/30',
    'A': 'text-blue-400 border-blue-700/50 bg-blue-900/30',
    'B': 'text-amber-400 border-amber-700/50 bg-amber-900/30',
    'C': 'text-slate-400 border-slate-700/50 bg-slate-800/50',
  };

  const statusColors: Record<string, string> = {
    draft: 'bg-slate-700 text-slate-300',
    submitted: 'bg-blue-900/40 text-blue-300',
    under_review: 'bg-amber-900/40 text-amber-300',
    accepted: 'bg-emerald-900/40 text-emerald-300',
    rejected: 'bg-red-900/40 text-red-300',
    camera_ready: 'bg-purple-900/40 text-purple-300',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Conference Manager & AI Engine</h1>
          <p className="text-sm text-slate-400 mt-1">Track deadlines, formats, and run powerful AI analysis</p>
        </div>
        <div className="flex items-center space-x-2">
          {aiEngine.isRunning && (
            <div className="flex items-center space-x-1 text-xs text-emerald-400">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>{aiEngine.activeTaskCount} running</span>
            </div>
          )}
          <Badge variant="info">{aiEngine.totalTasksCompleted} tasks</Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-700/60 pb-2">
        <TabButton label="Conferences" icon={Globe} active={activeTab === 'conferences'} onClick={() => setActiveTab('conferences')} count={conferences.length} />
        <TabButton label="My Submissions" icon={FileText} active={activeTab === 'submissions'} onClick={() => setActiveTab('submissions')} count={submissions.length} />
        <TabButton label="AI Engine" icon={Cpu} active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} count={aiEngine.tasks.length} badge={aiEngine.isRunning ? 'RUNNING' : undefined} />
      </div>

      {/* CONFERENCES TAB */}
      {activeTab === 'conferences' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search conferences..."
                className="w-full bg-slate-900/60 border border-slate-700 rounded-md pl-9 pr-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600/50" />
            </div>
            <select value={tierFilter} onChange={e => setTierFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200">
              <option value="all">All Tiers</option>
              <option value="A*">A*</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
            <select value={fieldFilter} onChange={e => setFieldFilter(e.target.value)}
              className="bg-slate-900/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-200">
              <option value="all">All Fields</option>
              {fields.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            {filtered.map(conf => {
              const days = daysUntil(conf.deadline);
              const formatInfo = FORMAT_TEMPLATE_INFO[conf.formatTemplate];
              const expanded = expandedConf === conf.id;
              return (
                <div key={conf.id}>
                  <button onClick={() => setExpandedConf(expanded ? null : conf.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-md hover:bg-slate-800/80 transition-colors text-left">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${tierColors[conf.tier]}`}>{conf.tier}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-slate-200">{conf.acronym} 2025</h3>
                        <p className="text-xs text-slate-400 truncate">{conf.name}</p>
                        <div className="flex items-center space-x-3 mt-1.5 text-[10px] text-slate-500">
                          <span className="flex items-center space-x-1"><Calendar className="w-3 h-3" /><span>{conf.month}</span></span>
                          <span className="flex items-center space-x-1"><MapPin className="w-3 h-3" /><span>{conf.location.split(',')[0]}</span></span>
                          <span>{conf.field}</span>
                          <span>{conf.pageLimit} pages</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {days !== null && (
                          <div className={`text-sm font-bold ${days < 30 ? 'text-red-400' : days < 60 ? 'text-amber-400' : 'text-slate-300'}`}>
                            {days > 0 ? `${days}d` : days === 0 ? 'TODAY' : `${Math.abs(days)}d ago`}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500">{conf.deadline}</div>
                      </div>
                    </div>
                    {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2" />}
                  </button>
                  {expanded && (
                    <div className="mt-2 p-4 bg-slate-900/60 border border-slate-700/40 rounded-md space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase">Deadline</span>
                          <p className="text-sm text-slate-200">{conf.deadline}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase">Notification</span>
                          <p className="text-sm text-slate-200">{conf.notificationDate}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase">Camera Ready</span>
                          <p className="text-sm text-slate-200">{conf.cameraReadyDate}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 uppercase">Format</span>
                          <p className="text-sm text-slate-200">{conf.format.replace('_', ' ')}</p>
                        </div>
                      </div>

                      {formatInfo && (
                        <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                          <h4 className="text-xs font-semibold text-slate-400 mb-1">{formatInfo.name}</h4>
                          <p className="text-xs text-slate-500">{formatInfo.description}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <Badge variant="default">{formatInfo.fonts}</Badge>
                            <Badge variant="default">{formatInfo.packages.split(',')[0]}</Badge>
                            <Badge variant="default">{formatInfo.packages.split(',')[1]}</Badge>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => addMemoryItem({ type: 'paper', title: `Target: ${conf.acronym} 2025`, content: `${conf.name}\nDeadline: ${conf.deadline}\nFormat: ${conf.formatTemplate}\nTemplate: ${conf.templateUrl}`, tags: ['conference', conf.acronym] })}
                          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center space-x-1"
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Save</span>
                        </button>
                        <a href={conf.templateUrl} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 rounded transition-colors flex items-center space-x-1 inline-flex">
                          <ExternalLink className="w-3 h-3" />
                          <span>Template</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-slate-500">{filtered.length} of {conferences.length} conferences shown. Data is illustrative; verify deadlines on official websites.</p>
        </div>
      )}

      {/* SUBMISSIONS TAB */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowNewSub(!showNewSub)} className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded transition-colors">
              {showNewSub ? 'Cancel' : '+ Track Submission'}
            </button>
          </div>

          {showNewSub && (
            <Card title="Track New Submission">
              <div className="text-sm text-slate-400">To add a submission, use the Research Memory to save it as a "Paper" item with conference tags.</div>
            </Card>
          )}

          {submissions.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No submissions tracked yet. Submissions appear here when you associate them with a conference.</p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {submissions.map(sub => {
                const conf = conferences.find(c => c.id === sub.conferenceId);
                return (
                  <Card key={sub.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[sub.status]}`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                          {conf && <Badge variant={conf.tier === 'A*' ? 'success' : 'default'}>{conf.acronym}</Badge>}
                        </div>
                        <h3 className="text-sm font-semibold text-slate-200">{sub.title}</h3>
                        {sub.submittedAt && <p className="text-xs text-slate-500 mt-1">Submitted {new Date(sub.submittedAt).toLocaleDateString()}</p>}
                        {sub.deadline && <p className="text-xs text-slate-500">Deadline: {sub.deadline}</p>}
                        {sub.notes && <p className="text-xs text-slate-400 mt-1">{sub.notes}</p>}
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0">
                        {conf && (
                          <button
                            onClick={() => addMemoryItem({ type: 'finding', title: `Submission: ${sub.title}`, content: `Conference: ${conf.acronym}\nStatus: ${sub.status}\nNotes: ${sub.notes}`, tags: ['conference', conf.acronym] })}
                            className="p-1.5 text-slate-500 hover:text-slate-200 transition-colors">
                            <BookOpen className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AI ENGINE TAB */}
      {activeTab === 'engine' && (
        <div className="space-y-4">
          <Card title="AI Processing Engine" subtitle="Powerful local analysis engine — no API key needed">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Cpu className={`w-5 h-5 ${aiEngine.isRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-sm text-slate-300">{aiEngine.isRunning ? 'Processing...' : 'Ready'}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {aiEngine.totalTasksCompleted} tasks completed | {aiEngine.activeTaskCount} active
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={runAllTasks} disabled={aiEngine.isRunning}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-xs rounded transition-colors flex items-center space-x-1">
                  <Play className="w-3 h-3" />
                  <span>Run All Tasks</span>
                </button>
                <button onClick={clearTasks} disabled={aiEngine.tasks.length === 0}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-slate-200 text-xs rounded transition-colors flex items-center space-x-1">
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Available Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {AVAILABLE_TASKS.map(t => (
                <button key={t.type} onClick={() => queueTask(t.type, t.label)} disabled={aiEngine.isRunning}
                  className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md text-left hover:bg-slate-800/80 transition-colors disabled:opacity-40">
                  <div className="flex items-center space-x-2 mb-1">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-medium text-slate-200">{t.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">{t.description}</p>
                  <span className="text-[10px] text-slate-600 mt-1 block">{t.estimatedDuration}</span>
                </button>
              ))}
            </div>

            {/* Task Queue */}
            {aiEngine.tasks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase">Task Queue</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {aiEngine.tasks.map(task => (
                    <div key={task.id} className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {task.status === 'completed' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                          {task.status === 'running' && <Activity className="w-4 h-4 text-amber-400 animate-pulse" />}
                          {task.status === 'queued' && <Clock className="w-4 h-4 text-slate-400" />}
                          {task.status === 'failed' && <XCircle className="w-4 h-4 text-red-400" />}
                          <span className="text-sm text-slate-200">{task.label}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs ${
                            task.status === 'completed' ? 'text-emerald-400' :
                            task.status === 'running' ? 'text-amber-400' :
                            task.status === 'failed' ? 'text-red-400' : 'text-slate-500'
                          }`}>{task.status}</span>
                          {task.status !== 'running' && task.status !== 'queued' && (
                            <button onClick={() => removeTask(task.id)} className="text-slate-500 hover:text-red-400">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      {task.status === 'running' && (
                        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${task.progress}%` }} />
                        </div>
                      )}
                      {task.status === 'completed' && task.result && (
                        <pre className="mt-2 p-2 bg-slate-900/80 border border-slate-700/40 rounded text-[10px] text-slate-400 font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                          {task.result.slice(0, 600)}
                        </pre>
                      )}
                      {task.status === 'failed' && task.error && (
                        <div className="mt-2 p-2 bg-red-900/20 border border-red-800/40 rounded text-xs text-red-300">
                          {task.error}
                        </div>
                      )}
                      {task.completedAt && (
                        <p className="text-[10px] text-slate-600 mt-1">Completed {new Date(task.completedAt).toLocaleTimeString()}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiEngine.tasks.length === 0 && (
              <div className="text-center py-6">
                <Cpu className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Click a task above or "Run All Tasks" to start AI processing.</p>
                <p className="text-xs text-slate-600 mt-1">The AI Engine runs locally — no data leaves your browser.</p>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

function TabButton({ label, icon: Icon, active, onClick, count, badge }: {
  label: string; icon: typeof Globe; active: boolean; onClick: () => void; count: number; badge?: string;
}) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 text-sm rounded-t-md transition-colors flex items-center space-x-2 ${
        active ? 'bg-slate-800/80 text-slate-200 border border-slate-700/60 border-b-transparent' : 'text-slate-400 hover:text-slate-200'
      }`}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      <span className="text-[10px] text-slate-500">({count})</span>
      {badge && <span className="text-[10px] text-emerald-400 animate-pulse">{badge}</span>}
    </button>
  );
}