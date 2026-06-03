'use client';

import { useCallback, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { CompressDropzone } from './compress-dropzone';
import { CompressResult } from './compress-result';
import { QualitySelector } from './quality-selector';
import { formatBytes } from '../lib/format-bytes';
import {
  compressPdf,
  getCompressPageCount,
  type CompressMethod,
  type CompressProgress,
  type CompressResult as CompressResultData,
  type CompressionLevel,
} from '../lib/compress-pdf';

type ResultState = CompressResultData & { fileName: string };

type Status = 'idle' | 'compressing' | 'done';

function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

function compressedFileName(name: string) {
  const base = name.replace(/\.[^.]+$/, '');
  return `${base}-compressed.pdf`;
}

export function PdfCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('smart');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState<CompressProgress>({
    phase: 'optimizing',
  });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [readError, setReadError] = useState<string | null>(null);

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
        const count = await getCompressPageCount(next);
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
    setResult(null);
    setError(null);
    setReadError(null);
  }, [resetDownload]);

  const handleCompress = useCallback(async () => {
    if (!file || pageCount === null) return;
    setError(null);
    setStatus('compressing');
    setProgress({ phase: 'optimizing' });
    try {
      const out = await compressPdf(file, level, setProgress);
      resetDownload();
      const url = URL.createObjectURL(out.blob);
      lastDownloadUrl.current = url;
      setResult({
        ...out,
        fileName: compressedFileName(file.name),
      });
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to compress this PDF. Please try again.');
      setStatus('idle');
    }
  }, [file, level, pageCount, resetDownload]);

  if (!file) {
    return (
      <CompressDropzone
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

  if (result && status === 'done') {
    return (
      <CompressResult
        blob={result.blob}
        fileName={result.fileName}
        originalSize={result.originalSize}
        compressedSize={result.compressedSize}
        pageCount={result.pageCount}
        method={result.method as CompressMethod}
        onStartOver={startOver}
      />
    );
  }

  const isCompressing = status === 'compressing';
  const canCompress = !isCompressing && pageCount !== null && readError === null;

  return (
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
            disabled={isCompressing}
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

      <div className="mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide opacity-70">
          Compression level
        </h2>
        <div className="mt-3">
          <QualitySelector
            value={level}
            onChange={setLevel}
            disabled={isCompressing}
          />
        </div>
        <p className="mt-3 text-xs opacity-60">
          <strong>Smart</strong> keeps your text and vector content exactly as
          it is, and only re-encodes the images inside the PDF. The other
          levels re-render every page as a flat image, which is useful for
          scanned PDFs but makes text unselectable.
        </p>
      </div>

      {isCompressing ? (
        <div
          className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]"
          role="status"
          aria-live="polite"
        >
          {progress.phase === 'optimizing' ? (
            <div className="flex items-center gap-3 text-sm">
              <span
                aria-hidden
                className="h-4 w-4 animate-spin rounded-full border-2 border-[#f44]/30 border-t-[#f44]"
              />
              <span className="font-medium">Optimizing losslessly…</span>
            </div>
          ) : progress.phase === 'images' ? (
            progress.total === 0 ? (
              <div className="flex items-center gap-3 text-sm">
                <span
                  aria-hidden
                  className="h-4 w-4 animate-spin rounded-full border-2 border-[#f44]/30 border-t-[#f44]"
                />
                <span className="font-medium">Scanning for images…</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    Re-encoding {progress.total}{' '}
                    {progress.total === 1 ? 'image' : 'images'}…
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
              </>
            )
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Re-encoding {progress.total}{' '}
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
            </>
          )}
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
          onClick={() => void handleCompress()}
          disabled={!canCompress}
          className="rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Compress PDF
        </button>
      </div>
    </div>
  );
}
