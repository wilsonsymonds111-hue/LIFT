import { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { queryClientInstance } from '@/lib/query-client';
import { invalidateWorkoutTemplates } from '../hooks/useWorkoutTemplates';
import StrongExportGuide from './StrongExportGuide';

export default function ImportStrongModal({ onClose }) {
  const [status, setStatus] = useState('idle'); // idle | uploading | importing | success | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [showGuide, setShowGuide] = useState(true);
  const fileInputRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus('uploading');
    setError('');

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      setStatus('importing');
      const response = await base44.functions.invoke('importStrongData', { file_url });
      const data = response.data || response;

      if (data.error) {
        setStatus('error');
        setError(data.error);
        return;
      }

      setResult(data);
      setStatus('success');
      invalidateWorkoutTemplates(queryClientInstance);
    } catch (err) {
      setStatus('error');
      setError(err.message || 'Import failed. Please try again.');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative bg-card rounded-t-3xl w-full px-5 pt-5 shadow-2xl flex flex-col gap-4 overflow-y-auto"
        style={{ maxHeight: '85vh', paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-center mb-1">
          <div className="w-10 h-1 rounded-full bg-muted" />
        </div>

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-extrabold text-foreground">Import from Strong</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-muted">
            <X className="w-4 h-4 text-foreground" />
          </button>
        </div>

        {status === 'success' && result ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            <p className="font-bold text-foreground">Import Complete!</p>
            <div className="w-full bg-muted rounded-2xl p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Workouts imported</span>
                <span className="text-sm font-bold text-foreground">{result.workoutsImported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Exercises imported</span>
                <span className="text-sm font-bold text-foreground">{result.exercisesImported}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Total sets logged</span>
                <span className="text-sm font-bold text-foreground">{result.totalSets}</span>
              </div>
            </div>
            <button onClick={onClose} className="w-full py-3 bg-blue-500 text-white rounded-xl font-semibold text-sm transition active:scale-95">
              Done
            </button>
          </div>
        ) : status === 'error' ? (
          <div className="flex flex-col items-center py-6 gap-3">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="font-bold text-foreground">Import Failed</p>
            <p className="text-sm text-muted-foreground text-center px-4">{error}</p>
            <button onClick={() => setStatus('idle')} className="w-full py-3 bg-muted text-foreground rounded-xl font-semibold text-sm transition active:scale-95">
              Try Again
            </button>
          </div>
        ) : showGuide ? (
          <>
            <p className="text-xs text-muted-foreground text-center -mt-1">
              Follow these steps in the Strong app to get your export file.
            </p>
            <StrongExportGuide onComplete={() => { setShowGuide(false); setTimeout(() => fileInputRef.current?.click(), 100); }} />
            <button
              onClick={() => setShowGuide(false)}
              className="text-xs text-muted-foreground text-center w-full pt-1"
            >
              Skip guide — I already have my file
            </button>
          </>
        ) : (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFile}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'uploading' || status === 'importing'}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-50 transition active:scale-95"
            >
              {status === 'uploading' || status === 'importing' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {status === 'uploading' ? 'Uploading…' : 'Importing your data…'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Select CSV File
                </>
              )}
            </button>

            <button
              onClick={() => setShowGuide(true)}
              className="text-xs text-blue-500 text-center w-full"
            >
              Show the guide again
            </button>

            <p className="text-xs text-muted-foreground text-center">
              Your workout history, exercises, and personal records will be imported.
            </p>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}