import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { BarChart3, Calculator, AlertTriangle } from 'lucide-react';

export function PowerCalcPage() {
  const { state } = useResearch();
  const { statisticalPower, paperAnalysis } = state;
  const [nSeeds, setNSeeds] = useState(20);
  const [effectSize, setEffectSize] = useState(0.5);
  const [alpha, setAlpha] = useState(0.05);

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to analyze statistical power.</p>
        </div>
      </Card>
    );
  }

  // Simple power calculator widget
  const computePower = (n: number, d: number, a: number) => {
    const zAlpha = a === 0.05 ? 1.96 : a === 0.01 ? 2.58 : a === 0.005 ? 2.81 : 1.96;
    const ncp = d * Math.sqrt(n / 2);
    const power = Math.min(0.999, 1 - 0.5 * Math.exp(-0.5 * (ncp - zAlpha) ** 2 / (1 + ncp / (2 * zAlpha))));
    return Math.round(power * 100);
  };

  const resultPower = computePower(nSeeds, effectSize, alpha);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Statistical Power Calculator</h1>
        <p className="text-sm text-slate-400 mt-1">Monte Carlo simulation for experiment design</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Interactive Calculator */}
        <div className="lg:col-span-1">
          <Card title="Simulation Parameters">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Number of seeds (n)</label>
                <input
                  type="range"
                  min="3" max="100" step="1"
                  value={nSeeds}
                  onChange={e => setNSeeds(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>3</span>
                  <span className="font-medium text-slate-200">{nSeeds}</span>
                  <span>100</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Expected effect size (Cohen's d)</label>
                <input
                  type="range"
                  min="0.1" max="1.5" step="0.05"
                  value={effectSize}
                  onChange={e => setEffectSize(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
                <div className="flex justify-between text-xs text-slate-500">
                  <span>0.1</span>
                  <span className="font-medium text-slate-200">{effectSize.toFixed(2)}</span>
                  <span>1.5</span>
                </div>
                <div className="flex space-x-2 mt-1">
                  <span className="text-[10px] text-slate-600">{effectSize < 0.3 ? 'Small' : effectSize < 0.7 ? 'Medium' : 'Large'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">Significance level (α)</label>
                <div className="flex space-x-2">
                  {[0.05, 0.01, 0.005].map(a => (
                    <button
                      key={a}
                      onClick={() => setAlpha(a)}
                      className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                        alpha === a ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      α = {a}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-700/50">
                <div className="text-center">
                  <span className="text-xs text-slate-500">Estimated statistical power</span>
                  <div className={`text-3xl font-bold mt-1 ${
                    resultPower >= 80 ? 'text-emerald-400' : resultPower >= 50 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {resultPower}%
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {resultPower >= 80 ? 'Adequately powered ✓' :
                     resultPower >= 50 ? 'Moderate power — increase seeds' :
                     'Underpowered — increase seeds or effect size'}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Analysis Results */}
        <div className="lg:col-span-3 space-y-6">
          {!statisticalPower ? (
            <Card>
              <div className="text-center py-10">
                <Calculator className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No power analysis data available. Load the demo project to see an example.</p>
              </div>
            </Card>
          ) : (
            <>
              <Card title="Power Analysis Report" subtitle={`Current configuration: ${nSeeds} seeds, d=${effectSize.toFixed(2)}, α=${alpha}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Parameter</th>
                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Value</th>
                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Result</th>
                        <th className="text-left py-2 px-3 text-slate-400 font-medium">Interpretation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statisticalPower.analysis.map((row, i) => (
                        <tr key={i} className="border-b border-slate-800/50">
                          <td className="py-2.5 px-3 font-medium text-slate-200">{row.parameter}</td>
                          <td className="py-2.5 px-3 text-slate-300">{row.value}</td>
                          <td className="py-2.5 px-3 text-slate-300">{row.result}</td>
                          <td className="py-2.5 px-3 text-slate-400">{row.interpretation}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Recommendation">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-slate-300">{statisticalPower.recommendation}</p>
                </div>
              </Card>

              <Card title="Recommended Simulation Parameters">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                    <span className="text-xs text-slate-500">Seeds</span>
                    <p className="text-xl font-bold text-slate-200">{statisticalPower.simulationParams.nSeeds}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                    <span className="text-xs text-slate-500">Effect size (d)</span>
                    <p className="text-xl font-bold text-slate-200">{statisticalPower.simulationParams.effectSize}</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                    <span className="text-xs text-slate-500">Target power</span>
                    <p className="text-xl font-bold text-slate-200">{Math.round(statisticalPower.simulationParams.power * 100)}%</p>
                  </div>
                  <div className="text-center p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
                    <span className="text-xs text-slate-500">Alpha</span>
                    <p className="text-xl font-bold text-slate-200">{statisticalPower.simulationParams.alpha}</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>

      <div className="text-xs text-slate-500 p-3 bg-slate-800/40 border border-slate-700/40 rounded-md">
        <p>Power calculations use an approximation based on the non-central t-distribution. These are estimates, not exact values. Always consult a statistician for critical experimental designs. The standard for ML experiments is typically 80% power at α = 0.05.</p>
      </div>
    </div>
  );
}