import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { BookOpen, BookMarked, ArrowRight } from 'lucide-react';

export function RelatedWorkPage() {
  const { state } = useResearch();
  const { relatedWork, paperAnalysis } = state;

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to explore the related work matrix.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Related Work Matrix</h1>
        <p className="text-sm text-slate-400 mt-1">Extracted related work comparison from the paper</p>
      </div>

      {!relatedWork ? (
        <Card>
          <div className="text-center py-10">
            <BookMarked className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No related work data available. Load the demo project to see an example.</p>
          </div>
        </Card>
      ) : (
        <>
          <Card title="Comparison Matrix" subtitle="Cited methods compared across key dimensions">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-3 text-slate-400 font-medium min-w-[200px]">Citation</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Method</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Task</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Key Difference</th>
                    <th className="text-left py-2 px-3 text-slate-400 font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {relatedWork.entries.map((entry, i) => (
                    <tr key={i} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="py-2.5 px-3 text-slate-200 font-medium">{entry.citation}</td>
                      <td className="py-2.5 px-3 text-slate-300">{entry.method}</td>
                      <td className="py-2.5 px-3 text-slate-300">{entry.task}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs">{entry.keyDifference}</td>
                      <td className="py-2.5 px-3 text-slate-300">{entry.performance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card title="Positioning Summary" subtitle="How the paper differentiates from prior work">
            <p className="text-sm text-slate-300 leading-relaxed">{relatedWork.summary}</p>
          </Card>

          <Card title="Suggested Comparisons" subtitle="Missing baselines that would strengthen the paper">
            <ul className="space-y-2">
              {relatedWork.suggestedComparisons.map((cmp, i) => (
                <li key={i} className="flex items-start space-x-2 text-sm">
                  <ArrowRight className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">{cmp}</span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="text-xs text-slate-500 p-3 bg-slate-800/40 border border-slate-700/40 rounded-md">
            <p>Related work entries are extracted from the paper text. This is not a systematic literature review. Always verify against the original cited papers. Suggested comparisons are inferences based on the current landscape, not verified research directions.</p>
          </div>
        </>
      )}
    </div>
  );
}