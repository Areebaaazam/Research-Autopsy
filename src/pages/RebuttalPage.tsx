import { useState } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { FileText, Download, AlertTriangle, Copy } from 'lucide-react';

export function RebuttalPage() {
  const { state } = useResearch();
  const { rebuttalLetter, paperAnalysis } = state;
  const [copied, setCopied] = useState(false);

  if (!paperAnalysis && !state.demoMode) {
    return (
      <Card>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-slate-400">No Research Loaded</h2>
          <p className="text-sm text-slate-500 mt-1">Upload or load a paper to generate rebuttal letters.</p>
        </div>
      </Card>
    );
  }

  if (!rebuttalLetter) {
    return (
      <Card>
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">No rebuttal letter available. Load the demo project to see an example.</p>
        </div>
      </Card>
    );
  }

  const fullLetter = [
    rebuttalLetter.editorSalutation,
    '',
    rebuttalLetter.opening,
    '',
    ...rebuttalLetter.pointByPoint.flatMap(p => [
      `Concern: ${p.concern}`,
      '',
      `Response: ${p.response}`,
      '',
      `Changes made: ${p.changesMade}`,
      '',
      '---',
      '',
    ]),
    rebuttalLetter.closing,
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([fullLetter], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rebuttal-letter-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Rebuttal Letter Generator</h1>
          <p className="text-sm text-slate-400 mt-1">Draft reviewer responses from response plans</p>
        </div>
        <div className="flex items-center space-x-2">
          <button onClick={handleCopy} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm rounded-md transition-colors flex items-center space-x-1">
            <Copy className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button onClick={handleDownload} className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white text-sm rounded-md transition-colors flex items-center space-x-1">
            <Download className="w-4 h-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      <Card className="border-red-700/40 bg-red-900/10">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-amber-300">Draft — Requires Your Review</h4>
            <p className="text-sm text-amber-200/70 mt-1">
              This is a machine-generated draft. Proposed experiments and changes are based on response plans you recorded.
              <strong> Do not claim experiments were conducted unless you have actually performed them.</strong>
              Review every statement before submission.
            </p>
          </div>
        </div>
      </Card>

      {/* Generated Letter */}
      <Card title="Draft Rebuttal Letter" subtitle="Edit before use" className="bg-slate-900/60">
        <div className="space-y-4 font-mono text-sm leading-relaxed">
          <p className="text-slate-300">{rebuttalLetter.editorSalutation}</p>
          <p className="text-slate-300">{rebuttalLetter.opening}</p>

          {rebuttalLetter.pointByPoint.map((point, i) => (
            <div key={i} className="p-4 bg-slate-800/60 border border-slate-700/50 rounded-md space-y-2">
              <div className="flex items-start space-x-2">
                <span className="text-red-400 font-bold flex-shrink-0">Concern:</span>
                <p className="text-slate-200">{point.concern}</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-emerald-400 font-bold flex-shrink-0">Response:</span>
                <p className="text-slate-300">{point.response}</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-blue-400 font-bold flex-shrink-0">Changes:</span>
                <p className="text-slate-300">{point.changesMade}</p>
              </div>
              <div className="flex justify-end">
                <Badge variant={point.confidence === 'high' ? 'success' : point.confidence === 'moderate' ? 'warning' : 'danger'}>
                  {point.confidence.toUpperCase()} confidence in this response
                </Badge>
              </div>
            </div>
          ))}

          <p className="text-slate-300">{rebuttalLetter.closing}</p>
        </div>
      </Card>

      <div className="text-xs text-slate-500 p-3 bg-slate-800/40 border border-slate-700/40 rounded-md flex items-start space-x-2">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
        <p>This draft is generated from your reviewer response plans. Verify all claims of completed work. Modify the "changes made" sections to reflect your actual revisions. Never claim an experiment was run unless you have the results to show for it.</p>
      </div>
    </div>
  );
}