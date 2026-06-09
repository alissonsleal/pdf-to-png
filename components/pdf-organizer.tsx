'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { GlobalDropzone } from './global-dropzone';
import { OrganizeDropzone } from './organize-dropzone';
import { OrganizePageGrid } from './organize-page-grid';
import { OrganizeResult } from './organize-result';
import {
  DEFAULT_BLANK_SIZE,
  getOrganizePageCount,
  getPageBounds,
  organizePdfs,
  renderPageThumbnail,
  type OrganizePage,
  type Rotation,
} from '../lib/organize-pdf';

type Source = {
  id: string;
  name: string;
  bytes: ArrayBuffer | null;
  pageCount: number | null;
  pageSize: { width: number; height: number } | null;
  error: string | null;
};

type Status = 'idle' | 'building' | 'done';

type ResultState = {
  blob: Blob;
  fileName: string;
  pageCount: number;
};

type ThumbnailMap = Record<string, string | null>;

const THUMB_TARGET_WIDTH = 200;

function isPdfFile(file: File) {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

function newId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function nextRotation(current: Rotation): Rotation {
  switch (current) {
    case 0:
      return 90;
    case 90:
      return 180;
    case 180:
      return 270;
    case 270:
      return 0;
  }
}

export function PdfOrganizer() {
  const [sources, setSources] = useState<Source[]>([]);
  const [pages, setPages] = useState<OrganizePage[]>([]);
  const [thumbnails, setThumbnails] = useState<ThumbnailMap>({});
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<ResultState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const dropInputRef = useRef<HTMLInputElement>(null);
  const addMoreInputRef = useRef<HTMLInputElement>(null);
  const lastDownloadUrl = useRef<string | null>(null);
  const thumbnailCacheRef = useRef<ThumbnailMap>({});

  const sourceById = useMemo(() => {
    const map = new Map<string, Source>();
    sources.forEach((s) => map.set(s.id, s));
    return map;
  }, [sources]);

  const validSources = useMemo(
    () => sources.filter((s) => s.bytes !== null && s.error === null),
    [sources],
  );

  useEffect(() => {
    return () => {
      if (lastDownloadUrl.current) {
        URL.revokeObjectURL(lastDownloadUrl.current);
        lastDownloadUrl.current = null;
      }
      Object.values(thumbnailCacheRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      thumbnailCacheRef.current = {};
    };
  }, []);

  const renderThumbnailsForSource = useCallback(
    async (sourceId: string, bytes: ArrayBuffer, count: number) => {
      for (let i = 0; i < count; i++) {
        const key = `${sourceId}-${i}`;
        if (thumbnailCacheRef.current[key] !== undefined) {
          setThumbnails((prev) => ({
            ...prev,
            [key]: thumbnailCacheRef.current[key] ?? null,
          }));
          continue;
        }
        try {
          const url = await renderPageThumbnail(
            bytes,
            i,
            THUMB_TARGET_WIDTH,
          );
          thumbnailCacheRef.current[key] = url;
          setThumbnails((prev) => ({ ...prev, [key]: url }));
        } catch {
          thumbnailCacheRef.current[key] = null;
          setThumbnails((prev) => ({ ...prev, [key]: null }));
        }
      }
    },
    [],
  );

  const loadSource = useCallback(
    async (id: string, file: File) => {
      try {
        const bytes = await file.arrayBuffer();
        const count = await getOrganizePageCount(bytes);
        let pageSize: { width: number; height: number } | null = null;
        if (count > 0) {
          try {
            pageSize = getPageBounds(bytes, 0);
          } catch {
            pageSize = null;
          }
        }
        setSources((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  bytes,
                  pageCount: count,
                  pageSize,
                  error: null,
                }
              : s,
          ),
        );
        const newPageEntries: OrganizePage[] = [];
        for (let i = 0; i < count; i++) {
          newPageEntries.push({
            kind: 'pdf',
            id: newId(),
            sourceId: id,
            pageIndex: i,
            rotation: 0 as Rotation,
          });
        }
        setPages((prev) => [...prev, ...newPageEntries]);
        void renderThumbnailsForSource(id, bytes, count);
      } catch {
        setSources((prev) =>
          prev.map((s) =>
            s.id === id
              ? {
                  ...s,
                  error:
                    'Could not read this PDF. It may be password-protected or corrupted.',
                }
              : s,
          ),
        );
      }
    },
    [renderThumbnailsForSource],
  );

  const addFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList).filter(isPdfFile);
      if (files.length === 0) {
        setError('Please choose PDF files only.');
        return;
      }
      setError(null);
      setLoadError(null);
      if (result) {
        if (lastDownloadUrl.current) {
          URL.revokeObjectURL(lastDownloadUrl.current);
          lastDownloadUrl.current = null;
        }
        setResult(null);
        setStatus('idle');
      }
      const placeholders: Source[] = files.map((file) => ({
        id: newId(),
        name: file.name,
        bytes: null,
        pageCount: null,
        pageSize: null,
        error: null,
      }));
      setSources((prev) => [...prev, ...placeholders]);
      for (let i = 0; i < files.length; i++) {
        void loadSource(placeholders[i].id, files[i]);
      }
    },
    [loadSource, result],
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

  const startOver = useCallback(() => {
    if (lastDownloadUrl.current) {
      URL.revokeObjectURL(lastDownloadUrl.current);
      lastDownloadUrl.current = null;
    }
    Object.values(thumbnailCacheRef.current).forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    thumbnailCacheRef.current = {};
    setSources([]);
    setPages([]);
    setThumbnails({});
    setStatus('idle');
    setProgress({ done: 0, total: 0 });
    setResult(null);
    setError(null);
    setLoadError(null);
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    if (from === to) return;
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const rotatePage = useCallback((index: number) => {
    setPages((prev) =>
      prev.map((p, i) => {
        if (i !== index || p.kind !== 'pdf') return p;
        return { ...p, rotation: nextRotation(p.rotation) };
      }),
    );
  }, []);

  const removePage = useCallback((index: number) => {
    setPages((prev) => prev.filter((_, i) => i !== index));
    if (result) {
      if (lastDownloadUrl.current) {
        URL.revokeObjectURL(lastDownloadUrl.current);
        lastDownloadUrl.current = null;
      }
      setResult(null);
      setStatus('idle');
    }
  }, [result]);

  const insertBlank = useCallback(
    (index: number, position: 'before' | 'after') => {
      const ref = pages[index];
      let size = DEFAULT_BLANK_SIZE;
      if (ref && ref.kind === 'pdf') {
        const src = sourceById.get(ref.sourceId);
        if (src?.pageSize) {
          let w = src.pageSize.width;
          let h = src.pageSize.height;
          if (ref.rotation === 90 || ref.rotation === 270) {
            [w, h] = [h, w];
          }
          size = { width: w, height: h };
        }
      }
      const blank: OrganizePage = {
        kind: 'blank',
        id: newId(),
        width: size.width,
        height: size.height,
      };
      setPages((prev) => {
        const next = [...prev];
        const at = position === 'before' ? index : index + 1;
        next.splice(at, 0, blank);
        return next;
      });
      if (result) {
        if (lastDownloadUrl.current) {
          URL.revokeObjectURL(lastDownloadUrl.current);
          lastDownloadUrl.current = null;
        }
        setResult(null);
        setStatus('idle');
      }
    },
    [pages, result, sourceById],
  );

  const sortByPageNumber = useCallback(
    (direction: 'asc' | 'desc') => {
      setPages((prev) => {
        const groups = new Map<string, OrganizePage[]>();
        prev.forEach((p) => {
          if (p.kind !== 'pdf') return;
          const list = groups.get(p.sourceId) ?? [];
          list.push(p);
          groups.set(p.sourceId, list);
        });
        groups.forEach((list) => {
          list.sort((a, b) => {
            if (a.kind !== 'pdf' || b.kind !== 'pdf') return 0;
            return a.pageIndex - b.pageIndex;
          });
        });
        const ordered: OrganizePage[] = [];
        const groupKeys = Array.from(groups.keys());
        const maxLen = Math.max(
          0,
          ...Array.from(groups.values()).map((g) => g.length),
        );
        for (let i = 0; i < maxLen; i++) {
          for (const key of groupKeys) {
            const list = groups.get(key);
            if (list && list[i]) ordered.push(list[i]);
          }
        }
        if (direction === 'desc') ordered.reverse();
        return ordered;
      });
      if (result) {
        if (lastDownloadUrl.current) {
          URL.revokeObjectURL(lastDownloadUrl.current);
          lastDownloadUrl.current = null;
        }
        setResult(null);
        setStatus('idle');
      }
    },
    [result],
  );

  const handleBuild = useCallback(async () => {
    if (pages.length === 0) {
      setError('Add at least one page to build a PDF.');
      return;
    }
    const sourcesForBuild = sources
      .filter((s) => s.bytes !== null && s.error === null)
      .map((s) => ({ id: s.id, bytes: s.bytes as ArrayBuffer }));
    if (sourcesForBuild.length === 0 && pages.some((p) => p.kind === 'pdf')) {
      setError('Some pages reference unreadable sources. Remove them and try again.');
      return;
    }
    setError(null);
    setStatus('building');
    setProgress({ done: 0, total: pages.length });
    try {
      const blob = await organizePdfs(
        { pages, sources: sourcesForBuild },
        (done, total) => setProgress({ done, total }),
      );
      if (lastDownloadUrl.current) {
        URL.revokeObjectURL(lastDownloadUrl.current);
      }
      const url = URL.createObjectURL(blob);
      lastDownloadUrl.current = url;
      setResult({
        blob,
        fileName: 'organized.pdf',
        pageCount: pages.length,
      });
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to build this PDF. Please try again.');
      setStatus('idle');
    }
  }, [pages, sources]);

  if (sources.length === 0) {
    return (
      <OrganizeDropzone
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

  const canBuild = status === 'idle' && pages.length > 0 && loadError === null;
  const pageCount = pages.length;

  return (
    <GlobalDropzone
      show={sources.length > 0}
      onDrop={(files) => void addFiles(files)}
      label="Drop PDFs to organize"
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
            {validSources.length}{' '}
            {validSources.length === 1 ? 'PDF' : 'PDFs'}
          </span>{' '}
          <span className="opacity-60">·</span>{' '}
          <span className="opacity-60">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => addMoreInputRef.current?.click()}
            disabled={status === 'building'}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            + Add more PDFs
          </button>
          <button
            type="button"
            onClick={startOver}
            disabled={status === 'building'}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Start over
          </button>
        </div>
      </div>

      {result && status === 'done' ? (
        <OrganizeResult
          blob={result.blob}
          fileName={result.fileName}
          pageCount={result.pageCount}
          onStartOver={startOver}
        />
      ) : (
        <>
          <div className="relative">
            <OrganizePageGrid
              pages={pages}
              thumbnails={thumbnails}
              disabled={status === 'building'}
              onReorder={reorder}
              onRotate={rotatePage}
              onRemove={removePage}
              onInsertBlank={insertBlank}
            />

            <div className="pointer-events-none absolute top-0 right-2 z-10 flex flex-col gap-2">
              <FloatingAction
                label={`+${pageCount} pages`}
                tone="primary"
                ariaLabel="Add more PDFs"
                onClick={() => addMoreInputRef.current?.click()}
                disabled={status === 'building'}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </FloatingAction>
              <FloatingAction
                label="1→A"
                ariaLabel="Sort ascending by page number"
                onClick={() => sortByPageNumber('asc')}
                disabled={status === 'building' || pages.length < 2}
              >
                <span className="text-sm font-bold">1→A</span>
              </FloatingAction>
              <FloatingAction
                label="A→1"
                ariaLabel="Sort descending by page number"
                onClick={() => sortByPageNumber('desc')}
                disabled={status === 'building' || pages.length < 2}
              >
                <span className="text-sm font-bold">A→1</span>
              </FloatingAction>
            </div>
          </div>

          {status === 'building' ? (
            <div
              className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Building {progress.total}{' '}
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

          {loadError ? (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {loadError}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm opacity-60">
              Drag to reorder · use the red icons on each thumbnail to rotate,
              insert a blank page, or delete.
            </p>
            <button
              type="button"
              onClick={() => void handleBuild()}
              disabled={!canBuild}
              className="rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Build PDF
            </button>
          </div>
        </>
      )}
    </div>
    </GlobalDropzone>
  );
}

function FloatingAction({
  children,
  label,
  ariaLabel,
  onClick,
  disabled,
  tone = 'default',
}: {
  children: React.ReactNode;
  label?: string;
  ariaLabel?: string;
  onClick: () => void;
  disabled: boolean;
  tone?: 'default' | 'primary';
}) {
  return (
    <div className="pointer-events-auto flex items-center gap-2">
      <span className="hidden rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white shadow-sm sm:inline">
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel ?? label}
        className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
          tone === 'primary'
            ? 'bg-[#f44] hover:bg-[#f34]'
            : 'bg-white text-black ring-1 ring-black/10 hover:bg-black/[0.04] dark:bg-white/90 dark:text-black'
        }`}
      >
        {children}
      </button>
    </div>
  );
}
