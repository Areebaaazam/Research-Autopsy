import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Search, CheckCircle, AlertCircle, HelpCircle, ThumbsUp, ThumbsDown, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import type { ClaimEvidence } from '../types';

const assessmentColors: Record<string, string> = {
  supported: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
  partially_supported: 'text-amber-400 border-amber-700/50 bg-amber-900/20',
  unsupported_in_text: 'text-red-400 border-red-700/50 bg-red-900/20',
  unclear: 'text-slate-400 border-slate-700/50 bg-slate-800/50'
};

const typeLabels: Record<string, string> = {
  direct_quotation: 'Direct Quotation',
  paraphrase: 'Paraphrase',
  numerical_result: 'Numerical Result',
  method_description: 'Method Description'
};

export function ClaimExplorerPage() {
  const { state, extractClaimEvidence } = useResearch();
  const { claimEvidence, paperAnalysis, isLoading } = state;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterAssessment, setFilterAssessment] = useState<string>('all');

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Paper Analyzed</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to explore claim-evidence pairs.</p>
        </div>
      </Card>
    );
  }

  const filtered = filterAssessment === 'all'
    ? claimEvidence
    : claimEvidence.filter(ce => ce.assessment === filterAssessment);

  const counts = {
    all: claimEvidence.length,
    supported: claimEvidence.filter(ce => ce.assessment === 'supported').length,
    partially_supported: claimEvidence.filter(ce => ce.assessment === 'partially_supported').length,
    unsupported_in_text: claimEvidence.filter(ce => ce.assessment === 'unsupported_in_text').length,
    unclear: claimEvidence.filter(ce => ce.assessment === 'unclear').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Claim–Evidence Explorer</h1>
          <p className="text-sm text-slate-400 mt-1">Interactive view of claims and their supporting evidence</p>
        </div>
        {claimEvidence.length === 0 && (
          <button
            onClick={extractClaimEvidence}
            disabled={isLoading}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2"
          >
            <Search className="w-4 h-4" />
            <span>{isLoading ? 'Extracting...' : 'Extract Claim–Evidence Pairs'}</span>
          </button>
        )}
      </div>

      {claimEvidence.length > 0 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          <FilterButton label={`All (${counts.all})`} active={filterAssessment === 'all'} onClick={() => setFilterAssessment('all')} />
          <FilterButton label={`Supported (${counts.supported})`} active={filterAssessment === 'supported'} onClick={() => setFilterAssessment('supported')} color="emerald" />
          <FilterButton label={`Partial (${counts.partially_supported})`} active={filterAssessment === 'partially_supported'} onClick={() => setFilterAssessment('partially_supported')} color="amber" />
          <FilterButton label={`Unsupported (${counts.unsupported_in_text})`} active={filterAssessment === 'unsupported_in_text'} onClick={() => setFilterAssessment('unsupported_in_text')} color="red" />
          <FilterButton label={`Unclear (${counts.unclear})`} active={filterAssessment === 'unclear'} onClick={() => setFilterAssessment('unclear')} color="slate" />
        </div>
      )}

      {claimEvidence.length === 0 && !isLoading && (
        <Card>
          <div className="text-center py-8">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Click "Extract Claim–Evidence Pairs" to analyze the loaded paper.</p>
          </div>
        </Card>
      )}

      {isLoading && (
        <Card>
          <div className="flex flex-col items-center py-8">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-slate-400">Extracting claims and evidence...</p>
          </div>
        </Card>
      )}

      <div className="space-y-3">
        {filtered.map(ce => (
          <ClaimEvidenceCard
            key={ce.id}
            evidence={ce}
            expanded={expandedId === ce.id}
            onToggle={() => setExpandedId(expandedId === ce.id ? null : ce.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterButton({ label, active, onClick, color = 'slate' }: { label: string; active: boolean; onClick: () => void; color?: string }) {
  const activeColors: Record<string, string> = {
    emerald: 'bg-emerald-900/40 text-emerald-300 border-emerald-800/50',
    amber: 'bg-amber-900/40 text-amber-300 border-amber-800/50',
    red: 'bg-red-900/40 text-red-300 border-red-800/50',
    slate: 'bg-slate-800/60 text-slate-300 border-slate-700/50',
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-xs rounded-md transition-colors whitespace-nowrap border ${
        active ? activeColors[color] : 'bg-slate-800/30 text-slate-500 hover:text-slate-300 border-transparent'
      }`}
    >
      {label}
    </button>
  );
}

function ClaimEvidenceCard({ evidence, expanded, onToggle }: { evidence: ClaimEvidence; expanded: boolean; onToggle: () => void }) {
  const [annotation, setAnnotation] = useState(evidence.userAnnotation);

  const assessmentIcons: Record<string, React.ReactNode> = {
    supported: <CheckCircle className="w-4 h-4 text-emerald-400" />,
    partially_supported: <AlertCircle className="w-4 h-4 text-amber-400" />,
    unsupported_in_text: <AlertCircle className="w-4 h-4 text-red-400" />,
    unclear: <HelpCircle className="w-4 h-4 text-slate-400" />
  };

  const assessmentLabels: Record<string, string> = {
    supported: 'Supported',
    partially_supported: 'Partially Supported',
    unsupported_in_text: 'Unsupported',
    unclear: 'Unclear'
  };

  return (
    <Card className="py-0">
      <button onClick={onToggle} className="w-full flex items-start justify-between p-4 text-left">
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center space-x-2 mb-1">
            {assessmentIcons[evidence.assessment]}
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${assessmentColors[evidence.assessment]?.split(' ')[0] || ''}`}>
              {assessmentLabels[evidence.assessment]}
            </span>
            <Badge variant="default">{typeLabels[evidence.evidenceType] || evidence.evidenceType}</Badge>
            {!evidence.passageValidated && (
              <Badge variant="warning">Quotation not verified</Badge>
            )}
          </div>
          <p className="text-sm font-medium text-slate-200">{evidence.claim}</p>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-700/50 pt-3">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Source Passage</h4>
            <div className={`p-3 rounded-md text-sm ${evidence.passageValidated ? 'bg-slate-800/60 border border-slate-700/50' : 'bg-amber-900/15 border border-amber-800/30'}`}>
              <p className="text-slate-300">{evidence.supportingPassage}</p>
              {!evidence.passageValidated && (
                <p className="text-xs text-amber-400 mt-1">Note: This passage was not found verbatim in the source text.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-slate-800/50 border border-slate-700/60 rounded-md">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">Assessment Reason</h4>
              <p className="text-sm text-slate-300">{evidence.assessmentReason}</p>
            </div>
            <div className="p-3 bg-blue-900/20 border border-blue-800/40 rounded-md">
              <h4 className="text-xs font-semibold text-blue-400 uppercase mb-1">What Additional Evidence Would Help</h4>
              <p className="text-sm text-blue-200/80">{evidence.whatWouldHelp}</p>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Your Annotation</h4>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAnnotation('useful')}
                className={`px-3 py-1.5 text-xs rounded-md flex items-center space-x-1 transition-colors ${
                  annotation === 'useful' ? 'bg-emerald-900/40 text-emerald-300 border border-emerald-800/50' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>Useful</span>
              </button>
              <button
                onClick={() => setAnnotation('incorrect')}
                className={`px-3 py-1.5 text-xs rounded-md flex items-center space-x-1 transition-colors ${
                  annotation === 'incorrect' ? 'bg-red-900/40 text-red-300 border border-red-800/50' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                <span>Incorrect</span>
              </button>
              <button
                onClick={() => setAnnotation('needs_investigation')}
                className={`px-3 py-1.5 text-xs rounded-md flex items-center space-x-1 transition-colors ${
                  annotation === 'needs_investigation' ? 'bg-amber-900/40 text-amber-300 border border-amber-800/50' : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3 h-3" />
                <span>Needs Investigation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}