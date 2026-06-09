'use client';

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { GlobalDropzone } from './global-dropzone';
import { MergeDropzone } from './merge-dropzone';
import { MergeList } from './merge-list';
import { MergeResult } from './merge-result';
import { getPdfPageCount, mergePdfs } from '../lib/merge-pdfs';

export type MergeItem = {
  id: string;
  name: string;
  size: number;
  pageCount: number | null;
  bytes: ArrayBuffer | null;
  error: string | null;
};

type Status = 'idle' | 'merging' | 'done';

type ResultState = {
  blob: Blob;
  fileName: string;
  pageCount: number;
};

function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

export function PdfMerger() {
  const [items, setItems] = useState<MergeItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);

  const dropInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const lastDownloadUrl = useRef<string | null>(null);

  const addPdfBytes = useCallback(
    async (id: string, file: File) => {
      try {
        const bytes = await file.arrayBuffer();
        const pageCount = await getPdfPageCount(bytes);
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? { ...it, bytes, pageCount, error: null }
              : it,
          ),
        );
      } catch {
        setItems((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  error:
                    'Could not read this PDF. It may be password-protected or corrupted.',
                }
              : it,
          ),
        );
      }
    },
    [],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isPdfFile);
      if (files.length === 0) {
        setError('Please choose PDF files only.');
        return;
      }
      setError(null);
      const placeholders: MergeItem[] = files.map((file) => ({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `id-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
        size: file.size,
        pageCount: null,
        bytes: null,
        error: null,
      }));
      setItems((prev) => [...prev, ...placeholders]);
      for (let i = 0; i < files.length; i++) {
        void addPdfBytes(placeholders[i].id, files[i]);
      }
    },
    [addPdfBytes],
  );

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    if (e.dataTransfer.files.length > 0) {
      void addFiles(e.dataTransfer.files);
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

  const handleDropInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = '';
  };

  const handleAddMoreInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) void addFiles(e.target.files);
    e.target.value = '';
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (result) {
      if (lastDownloadUrl.current) {
        URL.revokeObjectURL(lastDownloadUrl.current);
        lastDownloadUrl.current = null;
      }
      setResult(null);
      setStatus('idle');
    }
  };

  const startOver = useCallback(() => {
    if (lastDownloadUrl.current) {
      URL.revokeObjectURL(lastDownloadUrl.current);
      lastDownloadUrl.current = null;
    }
    setItems([]);
    setStatus('idle');
    setProgress({ done: 0, total: 0 });
    setResult(null);
    setError(null);
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    if (from === to) return;
    setItems((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const validCount = useMemo(
    () => items.filter((it) => it.bytes !== null && it.error === null).length,
    [items],
  );
  const totalPages = useMemo(
    () =>
      items.reduce(
        (sum, it) => sum + (it.pageCount ?? 0),
        0,
      ),
    [items],
  );

  const handleMerge = useCallback(async () => {
    const validItems = items.filter(
      (it) => it.bytes !== null && it.error === null,
    );
    if (validItems.length < 2) {
      setError('Add at least 2 readable PDFs to merge.');
      return;
    }
    setError(null);
    setStatus('merging');
    setProgress({ done: 0, total: validItems.length });
    try {
      const blob = await mergePdfs(
        validItems.map((it) => ({ bytes: it.bytes as ArrayBuffer })),
        (done, total) => setProgress({ done, total }),
      );
      if (lastDownloadUrl.current) {
        URL.revokeObjectURL(lastDownloadUrl.current);
      }
      const url = URL.createObjectURL(blob);
      lastDownloadUrl.current = url;
      setResult({
        blob,
        fileName: 'merged.pdf',
        pageCount: totalPages,
      });
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to merge these PDFs. Please try again.');
      setStatus('idle');
    }
  }, [items, totalPages]);

  if (items.length === 0) {
    return (
      <MergeDropzone
        isDragging={isDropping}
        error={error}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPick={() => dropInputRef.current?.click()}
        inputRef={dropInputRef}
        onInputChange={handleDropInputChange}
      />
    );
  }

  const canMerge =
    status === 'idle' && validCount >= 2 && totalPages > 0;

  return (
    <GlobalDropzone
      show={items.length > 0}
      onDrop={(files) => {
        if (status === 'done') startOver();
        void addFiles(files);
      }}
      label="Drop PDFs to merge"
    >
    <div>
      <input
        ref={addMoreInputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={handleAddMoreInputChange}
        className="hidden"
      />

      <div className="mb-4 flex flex-col gap-2 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          <span className="font-medium">
            {items.length} {items.length === 1 ? 'PDF' : 'PDFs'}
          </span>{' '}
          <span className="opacity-60">·</span>{' '}
          <span className="opacity-60">
            {totalPages} {totalPages === 1 ? 'page' : 'pages'} total
          </span>
        </p>
        <button
          type="button"
          onClick={() => addMoreInputRef.current?.click()}
          disabled={status === 'merging'}
          className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          + Add more PDFs
        </button>
      </div>

      {result && status === 'done' ? (
        <MergeResult
          blob={result.blob}
          fileName={result.fileName}
          pageCount={result.pageCount}
          onStartOver={startOver}
        />
      ) : (
        <>
          <MergeList
            items={items}
            onReorder={reorder}
            onRemove={removeItem}
            disabled={status === 'merging'}
          />

          {status === 'merging' ? (
            <div
              className="mt-4 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Merging {progress.total}{' '}
                  {progress.total === 1 ? 'PDF' : 'PDFs'}…
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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm opacity-60">
              Drag to reorder. PDFs are merged top to bottom.
            </p>
            <button
              type="button"
              onClick={() => void handleMerge()}
              disabled={!canMerge}
              className="rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Merge {items.length} {items.length === 1 ? 'PDF' : 'PDFs'}
            </button>
          </div>
        </>
      )}
    </div>
    </GlobalDropzone>
  );
}
