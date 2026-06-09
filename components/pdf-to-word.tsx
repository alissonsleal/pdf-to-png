'use client';

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { GlobalDropzone } from './global-dropzone';
import { WordDropzone } from './word-dropzone';
import { WordResult } from './word-result';
import { formatBytes } from '../lib/format-bytes';
import {
  getPdfPageCount,
  pdfToDocx,
  type ConvertProgress,
} from '../lib/pdf-to-word';

type ResultState = {
  blob: Blob;
  fileName: string;
  pageCount: number;
  originalSize: number;
};

type Status = 'idle' | 'converting' | 'done';

function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

export function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastDownloadUrl = useRef<string | null>(null);

  const resetDownload = useCallback(() => {
    if (lastDownloadUrl.current) {
      URL.revokeObjectURL(lastDownloadUrl.current);
      lastDownloadUrl.current = null;
    }
  }, []);

  const loadFile = useCallback(
    async (next: File) => {
      resetDownload();
      setError(null);
      setReadError(null);
      setResult(null);
      setStatus('idle');
      setPageCount(null);
      setFile(next);
      try {
        const count = await getPdfPageCount(await next.arrayBuffer());
        setPageCount(count);
      } catch {
        setReadError(
          'Could not read this PDF. It may be password-protected or corrupted.',
        );
      }
    },
    [resetDownload],
  );

  const addFile = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isPdfFile);
      if (files.length === 0) {
        setError('Please choose a PDF file.');
        return;
      }
      void loadFile(files[0]);
    },
    [loadFile],
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    if (e.dataTransfer.files.length > 0) {
      addFile(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDropping) setIsDropping(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setIsDropping(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFile(e.target.files);
    e.target.value = '';
  };

  const startOver = useCallback(() => {
    resetDownload();
    setFile(null);
    setPageCount(null);
    setStatus('idle');
    setProgress({ done: 0, total: 0 });
    setResult(null);
    setError(null);
    setReadError(null);
  }, [resetDownload]);

  const handleConvert = useCallback(async () => {
    if (!file || pageCount === null) return;
    setError(null);
    setStatus('converting');
    setProgress({ done: 0, total: pageCount });
    try {
      const onProgress: ConvertProgress = (done, total) =>
        setProgress({ done, total });
      const out = await pdfToDocx(file, onProgress);
      resetDownload();
      const url = URL.createObjectURL(out.blob);
      lastDownloadUrl.current = url;
      setResult({
        blob: out.blob,
        fileName: out.fileName,
        pageCount: out.pageCount,
        originalSize: file.size,
      });
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to convert this PDF. Please try again.');
      setStatus('idle');
    }
  }, [file, pageCount, resetDownload]);

  if (!file) {
    return (
      <WordDropzone
        isDragging={isDropping}
        error={error}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPick={() => inputRef.current?.click()}
        inputRef={inputRef}
        onInputChange={handleInputChange}
      />
    );
  }

  const isConverting = status === 'converting';
  const canConvert = !isConverting && pageCount !== null && readError === null;

  return (
    <GlobalDropzone
      show={!!file}
      onDrop={(files) => addFile(files)}
      label="Drop a PDF to convert"
    >
    {result && status === 'done' ? (
      <WordResult
        blob={result.blob}
        fileName={result.fileName}
        pageCount={result.pageCount}
        originalSize={result.originalSize}
        onStartOver={startOver}
      />
    ) : (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleInputChange}
        className="hidden"
      />

      <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.02] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="truncate font-medium" title={file.name}>
              {file.name}
            </p>
            <p className="mt-0.5 text-sm opacity-60">
              {formatBytes(file.size)}
              {pageCount !== null ? (
                <>
                  <span className="opacity-50"> · </span>
                  {pageCount} {pageCount === 1 ? 'page' : 'pages'}
                </>
              ) : readError ? null : (
                <>
                  <span className="opacity-50"> · </span>
                  reading…
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={startOver}
            disabled={isConverting}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Choose another
          </button>
        </div>

        {readError ? (
          <p className="mt-4 text-sm text-red-500" role="alert">
            {readError}
          </p>
        ) : null}
      </div>

      {isConverting ? (
        <div
          className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">
              Converting {progress.total}{' '}
              {progress.total === 1 ? 'page' : 'pages'}…
            </span>
            <span className="tabular-nums opacity-60">
              {progress.done} / {progress.total}
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.05]">
            <div
              className="h-full bg-[#f44] transition-all duration-300"
              style={{
                width:
                  progress.total > 0
                    ? `${(progress.done / progress.total) * 100}%`
                    : '0%',
              }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={() => void handleConvert()}
          disabled={!canConvert}
          className="rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Convert to Word
        </button>
      </div>
    </div>
    )}
    </GlobalDropzone>
  );
}
