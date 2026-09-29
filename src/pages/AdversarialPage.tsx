import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Shield, ShieldAlert, ShieldCheck, ChevronDown, ChevronRight, Target, Swords } from 'lucide-react';

export function AdversarialPage() {
  const { state } = useResearch();
  const { adversarial, paperAnalysis } = state;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Swords className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to stress-test it with adversarial cases.</p>
        </div>
      </Card>
    );
  }

  const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  const vulnIcons: Record<string, React.ReactNode> = {
    high: <ShieldAlert className="w-4 h-4 text-red-400" />,
    medium: <Shield className="w-4 h-4 text-amber-400" />,
    low: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    none: <ShieldCheck className="w-4 h-4 text-slate-400" />,
  };

  const vulnColors: Record<string, string> = {
    high: 'border-red-800/50 bg-red-900/20',
    medium: 'border-amber-800/50 bg-amber-900/20',
    low: 'border-emerald-800/50 bg-emerald-900/20',
    none: 'border-slate-700/50 bg-slate-800/50',
  };

  const vulnLabels: Record<string, string> = {
    high: 'Vulnerable',
    medium: 'Moderate risk',
    low: 'Low risk',
    none: 'Not vulnerable',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Adversarial Attack Simulator</h1>
        <p className="text-sm text-slate-400 mt-1">Stress-test your research against adversarial edge cases</p>
      </div>

      <Card className="border-red-700/40 bg-red-900/10">
        <div className="flex items-start space-x-3">
          <Target className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-red-300">What is this?</h4>
            <p className="text-sm text-red-200/70 mt-1">
              Each adversarial case describes a potential attack on the paper's claims. The "Paper's Defense"
              shows how the method would respond. The vulnerability rating indicates how confident we are
              that the defense would hold under rigorous testing.
            </p>
          </div>
        </div>
      </Card>

      {!adversarial ? (
        <Card>
          <div className="text-center py-10">
            <Swords className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">No adversarial analysis available. Load the demo project to see examples.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card title="Overall Resilience" subtitle="System-level robustness">
              <div className="text-center">
                <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-md border text-sm font-medium ${
                  adversarial.overallResilience === 'strong' ? 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20' :
                  adversarial.overallResilience === 'moderate' ? 'text-amber-400 border-amber-700/50 bg-amber-900/20' :
                  'text-red-400 border-red-700/50 bg-red-900/20'
                }`}>
                  {adversarial.overallResilience.toUpperCase()}
                </div>
              </div>
            </Card>
            <Card title="Weakest Areas">
              <ul className="space-y-1.5">
                {adversarial.weakestAreas.map((area, i) => (
                  <li key={i} className="text-sm text-red-300 flex items-start space-x-2">
                    <span className="text-red-400">!</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card title="Strongest Areas">
              <ul className="space-y-1.5">
                {adversarial.strongestAreas.map((area, i) => (
                  <li key={i} className="text-sm text-emerald-300 flex items-start space-x-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{area}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <div className="space-y-3">
            {adversarial.cases.map(ac => (
              <div key={ac.id}>
                <button
                  onClick={() => toggle(ac.id)}
                  className={`w-full flex items-center justify-between p-4 border rounded-md transition-colors text-left ${vulnColors[ac.vulnerability]}`}
                >
                  <div className="flex items-center space-x-3">
                    {vulnIcons[ac.vulnerability]}
                    <div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="default">{ac.category}</Badge>
                        <span className={`text-xs font-semibold ${
                          ac.vulnerability === 'high' ? 'text-red-400' :
                          ac.vulnerability === 'medium' ? 'text-amber-400' :
                          'text-emerald-400'
                        }`}>
                          {vulnLabels[ac.vulnerability]}
                        </span>
                      </div>
                      <h4 className="text-sm font-medium text-slate-200 mt-1">{ac.attack.slice(0, 120)}...</h4>
                    </div>
                  </div>
                  {expanded[ac.id] ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </button>
                {expanded[ac.id] && (
                  <div className="mt-2 p-4 bg-slate-900/60 border border-slate-700/40 rounded-md space-y-3">
                    <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-md">
                      <h5 className="text-xs font-semibold text-red-400 uppercase mb-1">Attack</h5>
                      <p className="text-sm text-slate-300">{ac.attack}</p>
                    </div>
                    <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-md">
                      <h5 className="text-xs font-semibold text-emerald-400 uppercase mb-1">Paper's Defense</h5>
                      <p className="text-sm text-slate-300">{ac.paperDefense}</p>
                    </div>
                    <div className="p-3 bg-amber-900/15 border border-amber-800/30 rounded-md">
                      <h5 className="text-xs font-semibold text-amber-400 uppercase mb-1">Vulnerability Assessment</h5>
                      <p className="text-sm text-amber-200/80">{ac.explanation}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}