import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Share2, GitBranch, Lightbulb, AlertTriangle, Zap, ArrowRight } from 'lucide-react';

export function ResearchGraphPage() {
  const { state } = useResearch();
  const { researchGraph, paperAnalysis } = state;
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [view, setView] = useState<'graph' | 'insights' | 'clusters'>('graph');

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12"><Share2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload papers to build a research graph.</p>
        </div>
      </Card>
    );
  }

  if (!researchGraph) {
    return (
      <Card>
        <div className="text-center py-10">
          <GitBranch className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Load the demo project to see an interactive research graph.</p>
        </div>
      </Card>
    );
  }

  const selectedConnections = selectedNode
    ? researchGraph.edges.filter(e => e.from === selectedNode || e.to === selectedNode)
    : [];

  const getNodeColor = (type: string) => {
    const map: Record<string, string> = { paper: 'bg-emerald-900/40 border-emerald-700/50 text-emerald-300', method: 'bg-blue-900/40 border-blue-700/50 text-blue-300', dataset: 'bg-amber-900/40 border-amber-700/50 text-amber-300', concept: 'bg-purple-900/40 border-purple-700/50 text-purple-300' };
    return map[type] || 'bg-slate-800/60 border-slate-700/50 text-slate-300';
  };

  const typeCounts = researchGraph.nodes.reduce<Record<string, number>>((acc, n) => { acc[n.type] = (acc[n.type] || 0) + 1; return acc; }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Research Graph Intelligence</h1>
        <p className="text-sm text-slate-400 mt-1">Interactive methodology and citation network</p>
      </div>

      <div className="flex items-center space-x-2">
        <TabBtn label="Graph View" active={view === 'graph'} onClick={() => setView('graph')} />
        <TabBtn label="Insights" active={view === 'insights'} onClick={() => setView('insights')} />
        <TabBtn label="Clusters & Gaps" active={view === 'clusters'} onClick={() => setView('clusters')} />
      </div>

      {view === 'graph' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Card title="Knowledge Graph" subtitle={`${researchGraph.nodes.length} nodes · ${researchGraph.edges.length} edges`}>
              <div className="relative bg-slate-900/80 border border-slate-700/50 rounded-lg p-4 min-h-[400px]">
                <div className="flex flex-wrap gap-2 mb-3">
                  {researchGraph.nodes.map(node => (
                    <button key={node.id} onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                      className={`px-2.5 py-1 rounded-md text-xs border transition-all ${getNodeColor(node.type)} ${selectedNode === node.id ? 'ring-2 ring-emerald-400 scale-105' : 'opacity-80 hover:opacity-100'}`}
                    >
                      {node.label.length > 30 ? node.label.slice(0, 28) + '…' : node.label}
                      <span className="ml-1 text-[10px] opacity-60">({node.type})</span>
                    </button>
                  ))}
                </div>
                {selectedNode && selectedConnections.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-800/80 border border-slate-700/50 rounded-md">
                    <h4 className="text-xs font-semibold text-slate-400 mb-2">Connections</h4>
                    <div className="space-y-1.5">
                      {selectedConnections.map((edge, i) => {
                        const target = edge.from === selectedNode ? edge.to : edge.from;
                        const tNode = researchGraph.nodes.find(n => n.id === target);
                        const provenance = (edge as any).provenance || 'unknown';
                        const provLabels: Record<string, string> = { sourced: 'source-supported', inferred: 'inferred', unknown: 'unknown provenance' };
                        const provColors: Record<string, string> = { sourced: 'text-emerald-400', inferred: 'text-amber-400', unknown: 'text-slate-500' };
                        return (
                          <div key={i} className="text-xs">
                            <div className="flex items-center space-x-2">
                              <span className="text-emerald-400">◆</span>
                              <span className="text-slate-300">{edge.label}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                              <span className="text-slate-400">{tNode?.label || target}</span>
                            </div>
                            <span className={`text-[10px] ${provColors[provenance]}`}>{provLabels[provenance]}</span>
                            {(edge as any).sourceReference && <span className="text-[10px] text-slate-600 ml-1">— {(edge as any).sourceReference}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
          <div className="space-y-3">
            <Card title="Graph Summary">
              <div className="space-y-2">
                {Object.entries(typeCounts).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate-400 capitalize">{type}s</span>
                    <span className="text-slate-200 font-bold">{count}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700/50">
                  <span className="text-slate-400">Total edges</span>
                  <span className="text-slate-200 font-bold">{researchGraph.edges.length}</span>
                </div>
              </div>
            </Card>
            <Card title="Edge Provenance">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-emerald-400">Sourced</span>
                  <span className="text-slate-400">{researchGraph.edges.filter(e => (e as any).provenance === 'sourced').length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-amber-400">Inferred</span>
                  <span className="text-slate-400">{researchGraph.edges.filter(e => (e as any).provenance === 'inferred').length}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Unknown</span>
                  <span className="text-slate-400">{researchGraph.edges.filter(e => !(e as any).provenance || (e as any).provenance === 'unknown').length}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {view === 'insights' && (
        <Card title="Graph Intelligence Insights" subtitle="AI-generated findings from the research landscape">
          <div className="space-y-4">
            {researchGraph.insights.map((insight, i) => (
              <div key={i} className="flex items-start space-x-3 p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                <Lightbulb className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{insight}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {view === 'clusters' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Methodology Clusters" subtitle="Related research areas">
            <div className="space-y-3">
              {researchGraph.methodologyClusters.map((cluster, i) => (
                <div key={i} className="flex items-start space-x-2 p-2.5 bg-blue-900/15 border border-blue-800/30 rounded-md">
                  <Zap className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300">{cluster}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card title="Missing Links" subtitle="Connections not present in the current graph">
            <div className="space-y-3">
              {researchGraph.missingLinks.map((link, i) => (
                <div key={i} className="flex items-start space-x-2 p-2.5 bg-amber-900/15 border border-amber-800/30 rounded-md">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-200/80">{link}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`px-3 py-1.5 text-xs rounded-md transition-colors ${active ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'}`}>{label}</button>;
}