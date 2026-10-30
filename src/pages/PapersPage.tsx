import { useCallback, useState, useRef } from 'react';
import { useResearch } from '../context/ResearchContext';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { PaperHealthScorecard } from '../components/PaperHealthScorecard';
import { FileText, Upload, AlertCircle, FileUp, X, CheckCircle, FileSpreadsheet, Layers } from 'lucide-react';

export function PapersPage() {
  const { state, uploadPaper, findGaps, setModule, loadPaperSnapshot } = useResearch();
  const { paperAnalysis, isLoading, error, paperSnapshots } = state;
  const [inputText, setInputText] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [uploadErrorMsg, setUploadErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Keep local refs to the analysis and text for the gap button,
  // avoiding stale captured state from the useCallback closure.
  const analysisRef = useRef<typeof paperAnalysis>(null);
  const textRef = useRef('');

  // Keep refs in sync with the latest analysis
  analysisRef.current = paperAnalysis;
  textRef.current = state.paperText;

  const handleAnalyze = useCallback(() => {
    if (inputText.trim()) uploadPaper(inputText.trim());
  }, [inputText, uploadPaper]);

  const handleFileSelect = (file: File) => {
    const validExts = ['.pdf', '.docx'];
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
    if (!validExts.includes(ext)) {
      setUploadStatus('error');
      setUploadErrorMsg('Unsupported file type. Only .pdf and .docx files are accepted.');
      return;
    }
    setUploadedFile(file);
    setUploadStatus('idle');
    setUploadErrorMsg('');
  };

  const handleUpload = useCallback(async () => {
    if (!uploadedFile) return;
    setUploadStatus('uploading');
    setUploadErrorMsg('');
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);
      const res = await fetch('/api/upload-doc', { method: 'POST', body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadStatus('error');
        setUploadErrorMsg(data?.error || `Server error (HTTP ${res.status})`);
        return;
      }
      if (data.text) {
        setInputText(data.text);
        uploadPaper(data.text);
        setUploadStatus('done');
      } else {
        setUploadStatus('error');
        setUploadErrorMsg('No text could be extracted from this file.');
      }
    } catch (err: any) {
      setUploadStatus('error');
      setUploadErrorMsg('Connection error. Is the server running?');
    }
  }, [uploadedFile, uploadPaper]);

  const clearFile = () => {
    setUploadedFile(null);
    setUploadStatus('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRunGaps = useCallback(async () => {
    // Use refs to get the latest analysis, avoiding stale captured state
    const analysis = analysisRef.current;
    const text = textRef.current;
    if (!analysis || !text) return;
    await findGaps(analysis, text);
    setModule('gaps');
  }, [findGaps, setModule]);

  const isDocx = uploadedFile?.name.endsWith('.docx');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Paper Analyzer</h1>
          <p className="text-sm text-slate-400 mt-1">Upload a research paper (PDF or DOCX) for analysis</p>
        </div>
        {paperSnapshots.length > 0 && (
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-300 font-medium hidden sm:inline">Active Snapshot:</span>
            <select
              value={state.paperTextHash || ''}
              onChange={e => loadPaperSnapshot(e.target.value)}
              className="bg-slate-900 text-slate-200 border border-slate-700 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 font-mono text-xs">
              <option value="">Current Analysis</option>
              {paperSnapshots.map(snap => (
                <option key={snap.id} value={snap.textHash}>
                  {snap.label} ({snap.textHash.slice(0, 6)})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <Card title="Upload Research Paper">
        <div className="space-y-5">
          {/* File Upload */}
          <div
            onDragOver={e => { e.preventDefault(); }}
            onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-700/60 rounded-lg p-8 text-center cursor-pointer transition-colors"
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.docx" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
            {uploadedFile ? (
              <div className="flex items-center justify-center space-x-2">
                {isDocx ? <FileSpreadsheet className="w-5 h-5 text-blue-400" /> : <FileText className="w-5 h-5 text-red-400" />}
                <span className="text-sm text-slate-300">{uploadedFile.name}</span>
                <span className="text-xs text-slate-500">({(uploadedFile.size / 1024).toFixed(0)} KB)</span>
                <button onClick={e => { e.stopPropagation(); clearFile(); }} className="p-1 text-slate-500 hover:text-red-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <FileUp className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm text-slate-400">Drop a PDF or Word document here</p>
                <p className="text-xs text-slate-600">Supports .pdf and .docx — arXiv papers, conference proceedings, thesis drafts</p>
              </div>
            )}
          </div>

          {uploadedFile && uploadStatus !== 'done' && (
            <button onClick={handleUpload} disabled={uploadStatus === 'uploading'}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
              {uploadStatus === 'uploading' ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : <Upload className="w-4 h-4" />}
              <span>{uploadStatus === 'uploading' ? 'Extracting text...' : 'Upload & Extract Text'}</span>
            </button>
          )}
          {uploadStatus === 'done' && (
            <div className="flex items-center space-x-1 text-xs text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>Text extracted and analysis started.</span>
            </div>
          )}
          {uploadStatus === 'error' && uploadErrorMsg && (
            <p className="text-xs text-red-400">{uploadErrorMsg}</p>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700/50" /></div>
            <div className="relative flex justify-center"><span className="bg-slate-800/80 px-2 text-xs text-slate-500">or paste text directly</span></div>
          </div>

          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Paste the full text of a research paper here..."
            className="w-full h-48 bg-slate-900/60 border border-slate-700 rounded-md p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-600/50 font-mono"
          />
          <div className="flex items-center space-x-3">
            <button onClick={handleAnalyze} disabled={isLoading || !inputText.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
              {isLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FileText className="w-4 h-4" />}
              <span>{isLoading ? 'Analyzing...' : 'Analyze Paper'}</span>
            </button>
            <span className="text-xs text-slate-500">{inputText.split(/\s+/).filter(Boolean).length} words</span>
          </div>
          {error && (
            <div className="flex items-start space-x-2 p-3 bg-red-900/30 border border-red-800/50 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>
      </Card>

      {isLoading && <LoadingSpinner text="Analyzing research paper..." />}

      {paperAnalysis && !isLoading && (
        <>
          <PaperHealthScorecard />

          <Card title={paperAnalysis.title} subtitle="Paper Analysis">
            <div className="space-y-5">
              <Section label="Abstract" content={paperAnalysis.abstract} />
              <Section label="Research Problem" content={paperAnalysis.researchProblem} />
              <Section label="Research Question" content={paperAnalysis.researchQuestion} />
              <Section label="Hypothesis" content={paperAnalysis.hypothesis} />
              <Section label="Methodology" content={paperAnalysis.methodology} />
              <div><h4 className="text-sm font-semibold text-slate-300 mb-2">Datasets</h4>
                <div className="flex flex-wrap gap-2">{paperAnalysis.datasets.map(d => <Badge key={d} variant="info">{d}</Badge>)}</div>
              </div>
              <div><h4 className="text-sm font-semibold text-slate-300 mb-2">Models</h4>
                <div className="flex flex-wrap gap-2">{paperAnalysis.models.map(m => <Badge key={m} variant="default">{m}</Badge>)}</div>
              </div>
              <Section label="Experimental Setup" content={paperAnalysis.experimentalSetup} />
              <div><h4 className="text-sm font-semibold text-slate-300 mb-2">Evaluation Metrics</h4>
                <div className="flex flex-wrap gap-2">{paperAnalysis.evaluationMetrics.map(m => <Badge key={m} variant="warning">{m}</Badge>)}</div>
              </div>
              <Section label="Main Results" content={paperAnalysis.mainResults} />
              <div><h4 className="text-sm font-semibold text-slate-300 mb-2">Claimed Contributions</h4>
                {paperAnalysis.claimedContributions.length > 0 ? (
                  <ul className="space-y-1.5">{paperAnalysis.claimedContributions.map((c, i) => (
                    <li key={i} className="text-sm text-slate-300 flex items-start space-x-2"><span className="text-emerald-400 mt-0.5">◆</span><span>{c}</span></li>
                  ))}</ul>
                ) : <p className="text-sm text-slate-500 italic">Could not reliably extract from the supplied text.</p>}
              </div>
              <div><h4 className="text-sm font-semibold text-slate-300 mb-2">Limitations</h4>
                {paperAnalysis.limitations.length > 0 ? (
                  <ul className="space-y-1.5">{paperAnalysis.limitations.map((l, i) => (
                    <li key={i} className="text-sm text-amber-300 flex items-start space-x-2"><span className="text-amber-400 mt-0.5">⚠</span><span>{l}</span></li>
                  ))}</ul>
                ) : <p className="text-sm text-slate-500 italic">Could not reliably extract from the supplied text.</p>}
              </div>
              {paperAnalysis.futureWork.length > 0 && <Section label="Future Work" content={paperAnalysis.futureWork.join('; ')} />}
              {paperAnalysis.importantCitations.length > 0 && (
                <div><h4 className="text-sm font-semibold text-slate-300 mb-2">Important Citations</h4>
                  <ul className="space-y-1">{paperAnalysis.importantCitations.map((c, i) => (
                    <li key={i} className="text-sm text-slate-400">{c}</li>
                  ))}</ul>
                </div>
              )}
            </div>
          </Card>

          <Card title="Evidence Breakdown" subtitle="What authors claim vs what evidence shows">
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wider pb-2 border-b border-slate-700">
                <span>Claim</span><span>Evidence</span><span>Source</span>
              </div>
              {paperAnalysis.evidenceBreakdown.map((item, i) => (
                <div key={i} className="grid grid-cols-3 gap-3 text-sm py-2 border-b border-slate-700/50 last:border-0">
                  <span className="text-slate-200 font-medium">{item.claim}</span>
                  <span className="text-slate-400">{item.evidence}</span>
                  <span className="text-emerald-400 text-xs">{item.sourceSection}</span>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-center">
            <button onClick={handleRunGaps} disabled={isLoading}
              className="px-6 py-3 bg-amber-700 hover:bg-amber-600 disabled:bg-slate-700 text-white text-sm rounded-md transition-colors flex items-center space-x-2">
              <AlertCircle className="w-4 h-4" />
              <span>Identify Research Gaps →</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ label, content }: { label: string; content: string }) {
  if (!content) return null;
  return (
    <div><h4 className="text-sm font-semibold text-slate-300 mb-1.5">{label}</h4>
      <p className="text-sm text-slate-400 leading-relaxed">{content}</p>
    </div>
  );
}