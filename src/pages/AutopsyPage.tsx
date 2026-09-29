import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Skull, AlertTriangle, Crosshair, ChevronDown, ChevronRight, Lightbulb, Sword, Target, Beaker, ArrowRight } from 'lucide-react';

export function AutopsyPage() {
  const { state, setModule, runAutopsy, runReviewer } = useResearch();
  const { paperAnalysis, autopsyResult, nextSteps, isLoading, loadingText, demoMode } = state;
  const [expandedRisks, setExpandedRisks] = useState<Record<number, boolean>>({});
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    risks: true, reviewer: true, nextSteps: true
  });

  if (!paperAnalysis && !demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Skull className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research to Autopsy</h2>
          <p className="text-sm text-slate-500 mt-1">Upload a paper or load a demo project to stress-test the research.</p>
        </div>
      </Card>
    );
  }

  const toggleRisk = (idx: number) => setExpandedRisks(prev => ({ ...prev, [idx]: !prev[idx] }));
  const toggleSection = (key: string) => setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));

  const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  const sortedRisks = autopsyResult
    ? [...autopsyResult.failureRisks].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    : [];

  const severityColors: Record<string, string> = {
    HIGH: 'text-red-400 border-red-800/50 bg-red-900/20',
    MEDIUM: 'text-amber-400 border-amber-800/50 bg-amber-900/20',
    LOW: 'text-yellow-400 border-yellow-800/50 bg-yellow-900/20'
  };

  const severityDots: Record<string, string> = {
    HIGH: '🔴',
    MEDIUM: '🟠',
    LOW: '🟡'
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Research Autopsy &amp; Reviewer #2</h1>
        <p className="text-sm text-slate-400 mt-1">Stress-test your research for potential failures</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={runAutopsy}
          disabled={isLoading}
          className="px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
        >
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Skull className="w-4 h-4" />
          )}
          <span>Assume This Research is Wrong</span>
        </button>
        <button
          onClick={runReviewer}
          disabled={isLoading}
          className="px-5 py-2.5 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
        >
          <Sword className="w-4 h-4" />
          <span>Attack My Research</span>
        </button>
      </div>

      {isLoading && <LoadingSpinner text={loadingText || 'Performing research autopsy...'} />}

      {autopsyResult && !isLoading && (
        <>
          {/* Failure Risks */}
          <button
            onClick={() => toggleSection('risks')}
            className="w-full flex items-center justify-between px-5 py-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-left"
          >
            <h2 className="text-base font-semibold text-slate-100">Failure Risk Analysis</h2>
            {expandedSections.risks ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.risks && (
            <div className="space-y-3">
              {sortedRisks.map((risk, i) => (
                <div key={i}>
                  <button
                    onClick={() => toggleRisk(i)}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700/60 rounded-md hover:bg-slate-800/80 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm">{severityDots[risk.severity]}</span>
                      <div>
                        <span className={`text-xs font-semibold uppercase ${severityColors[risk.severity].split(' ')[0]}`}>
                          {risk.severity}
                        </span>
                        <h4 className="text-sm font-medium text-slate-200 mt-0.5">{risk.title}</h4>
                      </div>
                    </div>
                    {expandedRisks[i] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                  </button>
                  {expandedRisks[i] && (
                    <div className="mt-2 p-4 bg-slate-900/60 border border-slate-700/40 rounded-md space-y-3">
                      <p className="text-sm text-slate-300">{risk.explanation}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-md">
                          <h5 className="text-xs font-semibold text-red-400 uppercase mb-1">Why This Could Invalidate the Claim</h5>
                          <p className="text-sm text-red-200/80">{risk.couldInvalidate}</p>
                        </div>
                        <div className="p-3 bg-emerald-900/20 border border-emerald-800/40 rounded-md">
                          <h5 className="text-xs font-semibold text-emerald-400 uppercase mb-1">Experiment to Rule It Out</h5>
                          <p className="text-sm text-emerald-200/80">{risk.rulingOutExperiment}</p>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button
                          onClick={() => setModule('experiments')}
                          className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                        >
                          <Beaker className="w-3 h-3" />
                          <span>Plan this experiment</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end">
                <button
                  onClick={() => setModule('experiments')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                >
                  <Beaker className="w-3 h-3" />
                  <span>Go to Experiment Planner</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Reviewer Report */}
          <button
            onClick={() => toggleSection('reviewer')}
            className="w-full flex items-center justify-between px-5 py-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-left"
          >
            <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
              <span>Reviewer #2 Report</span>
              <span className={`text-sm font-bold ${autopsyResult.reviewerReport.overallScore >= 7 ? 'text-emerald-400' : autopsyResult.reviewerReport.overallScore >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                ({autopsyResult.reviewerReport.overallScore}/10)
              </span>
            </h2>
            {expandedSections.reviewer ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
          </button>

          {expandedSections.reviewer && (
            <div className="space-y-6 px-1">
              {autopsyResult.reviewerReport.scoreLabel && (
                <p className="text-xs text-slate-500 italic">{autopsyResult.reviewerReport.scoreLabel}</p>
              )}

              <div>
                <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Major Concerns</span>
                </h3>
                <ol className="space-y-2">
                  {autopsyResult.reviewerReport.majorConcerns.map((c, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm">
                      <span className="text-red-400 font-bold flex-shrink-0">{i + 1}.</span>
                      <span className="text-slate-300">{c}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-3">Minor Concerns</h3>
                <ol className="space-y-2">
                  {autopsyResult.reviewerReport.minorConcerns.map((c, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm">
                      <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                      <span className="text-slate-300">{c}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-blue-400 mb-3">Questions the Reviewer Would Ask</h3>
                <ul className="space-y-2">
                  {autopsyResult.reviewerReport.questions.map((q, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm">
                      <Crosshair className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-emerald-400 mb-3">What Evidence Would Convince the Reviewer?</h3>
                <ul className="space-y-2">
                  {autopsyResult.reviewerReport.convincingEvidence.map((e, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm">
                      <Target className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-300">{e}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 bg-purple-900/20 border border-purple-800/40 rounded-md">
                <h3 className="text-sm font-semibold text-purple-400 mb-2 flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4" />
                  <span>How Should I Strengthen This?</span>
                </h3>
                <ul className="space-y-2">
                  {autopsyResult.reviewerReport.strengtheningAdvice.map((a, i) => (
                    <li key={i} className="flex items-start space-x-2 text-sm">
                      <span className="text-purple-400 font-bold flex-shrink-0">{i + 1}.</span>
                      <span className="text-purple-200/80">{a}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setModule('reviewerWorkspace')}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                >
                  <Sword className="w-3 h-3" />
                  <span>Create response plans for these concerns</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Next Steps */}
          {nextSteps && (
            <>
              <button
                onClick={() => toggleSection('nextSteps')}
                className="w-full flex items-center justify-between px-5 py-3 bg-slate-800/80 border border-slate-700/60 rounded-lg text-left"
              >
                <h2 className="text-base font-semibold text-slate-100">Your Research Next Steps</h2>
                {expandedSections.nextSteps ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
              </button>

              {expandedSections.nextSteps && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center space-x-2">
                      <span>🔴</span>
                      <span>Fix First</span>
                    </h3>
                    <ul className="space-y-2">
                      {nextSteps.fixFirst.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 p-2.5 bg-red-900/15 border border-red-800/30 rounded-md text-sm text-slate-300">
                          <span className="text-red-400 font-bold flex-shrink-0">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-amber-400 mb-3 flex items-center space-x-2">
                      <span>🟠</span>
                      <span>Investigate</span>
                    </h3>
                    <ul className="space-y-2">
                      {nextSteps.investigate.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 p-2.5 bg-amber-900/15 border border-amber-800/30 rounded-md text-sm text-slate-300">
                          <span className="text-amber-400 font-bold flex-shrink-0">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center space-x-2">
                      <span>🟢</span>
                      <span>Strong Areas</span>
                    </h3>
                    <ul className="space-y-2">
                      {nextSteps.strongAreas.map((item, i) => (
                        <li key={i} className="flex items-start space-x-2 p-2.5 bg-emerald-900/15 border border-emerald-800/30 rounded-md text-sm text-slate-300">
                          <span className="text-emerald-400 font-bold flex-shrink-0">{i + 1}.</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-900/15 border border-blue-800/30 rounded-md">
                      <h3 className="text-sm font-semibold text-blue-400 mb-3 flex items-center space-x-2">
                        <span>🧪</span>
                        <span>Experiments To Run</span>
                      </h3>
                      <ul className="space-y-1.5">
                        {nextSteps.experimentsToRun.map((item, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start space-x-2">
                            <span className="text-blue-400 flex-shrink-0">{i + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 bg-purple-900/15 border border-purple-800/30 rounded-md">
                      <h3 className="text-sm font-semibold text-purple-400 mb-3 flex items-center space-x-2">
                        <span>📚</span>
                        <span>Literature To Investigate</span>
                      </h3>
                      <ul className="space-y-1.5">
                        {nextSteps.literatureToInvestigate.map((item, i) => (
                          <li key={i} className="text-sm text-slate-300 flex items-start space-x-2">
                            <span className="text-purple-400 flex-shrink-0">{i + 1}.</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <button
              onClick={() => setModule('claimExplorer')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md transition-colors flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Explore Claim–Evidence</span>
            </button>
            <button
              onClick={() => setModule('experiments')}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
            >
              <Beaker className="w-4 h-4" />
              <span>Plan Experiments</span>
            </button>
            <button
              onClick={() => setModule('reviewerWorkspace')}
              className="px-4 py-2 bg-amber-700 hover:bg-amber-600 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
            >
              <Sword className="w-4 h-4" />
              <span>Respond to Reviewer</span>
            </button>
          </div>
        </>
      )}

      {!autopsyResult && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <Skull className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Click "Assume This Research is Wrong" to begin the autopsy.</p>
          </div>
        </Card>
      )}
    </div>
  );
}