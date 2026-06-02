'use client';

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import JSZip from 'jszip';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type PageImage = { url: string; blob: Blob };
type FileKind = 'pdf' | 'image';

export function PdfConverter() {
  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pages, setPages] = useState<(PageImage | undefined)[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const acceptFile = (f: File) => {
    pages.forEach((p) => p && URL.revokeObjectURL(p.url));
    setPages([]);
    setNumPages(null);
    setError(null);

    if (f.type === 'application/pdf') {
      setFile(f);
      setFileKind('pdf');
    } else if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setFile(f);
      setFileKind('image');
      setPages([{ url, blob: f }]);
      setNumPages(1);
    } else {
      setError('Please choose a PDF or an image file.');
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (f) acceptFile(f);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const f = event.dataTransfer.files?.[0];
    if (f) acceptFile(f);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget === event.target) setIsDragging(false);
  };

  const reset = () => {
    pages.forEach((p) => p && URL.revokeObjectURL(p.url));
    setFile(null);
    setFileKind(null);
    setNumPages(null);
    setPages([]);
    setError(null);
    setLightboxIndex(null);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPages(Array.from({ length: numPages }, () => undefined));
  };

  const onPageRenderSuccess = (pageIndex: number) => {
    const canvas = hiddenRef.current?.querySelector<HTMLCanvasElement>(
      `.pdf-page-${pageIndex + 1} canvas`,
    );
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPages((prev) => {
        if (prev[pageIndex]) return prev;
        const next = [...prev];
        next[pageIndex] = { url: URL.createObjectURL(blob), blob };
        return next;
      });
    });
  };

  const readyCount = pages.filter(Boolean).length;
  const allReady = numPages !== null && readyCount === numPages;
  const baseName = file?.name.replace(/\.[^.]+$/, '') ?? 'pages';

  const downloadAll = async () => {
    if (!allReady) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      pages.forEach((p, i) => {
        if (p) zip.file(`page-${i + 1}.png`, p.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        isDragging={isDragging}
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

  return (
    <div>
      <ActionBar
        fileName={file.name}
        numPages={numPages}
        readyCount={readyCount}
        fileKind={fileKind}
        allReady={allReady}
        isZipping={isZipping}
        onDownloadAll={downloadAll}
        onReset={reset}
      />

      {fileKind === 'image' && pages[0] ? (
        <div className="mt-6 flex justify-center">
          <ImageCard
            url={pages[0].url}
            label={file.name}
            downloadName={file.name}
            onOpen={() => setLightboxIndex(0)}
            large
          />
        </div>
      ) : (
        <ResultsGrid
          numPages={numPages}
          pages={pages}
          baseName={baseName}
          onOpen={setLightboxIndex}
        />
      )}

      {fileKind === 'pdf' && (
        <div
          ref={hiddenRef}
          aria-hidden
          className="pointer-events-none fixed top-0 left-0 -z-10 opacity-0"
          style={{ width: 1024 }}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={() =>
              setError('Failed to load PDF. Is the file valid?')
            }
          >
            {Array.from({ length: numPages ?? 0 }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                className={`pdf-page-${index + 1}`}
                width={1024}
                onRenderSuccess={() => onPageRenderSuccess(index)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </Document>
        </div>
      )}

      {error && (
        <p className="mt-4 text-center text-sm text-red-500">{error}</p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          pages={pages}
          index={lightboxIndex}
          fileKind={fileKind}
          fileName={file.name}
          baseName={baseName}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
  );
}

function Dropzone({
  isDragging,
  error,
  onDrop,
  onDragOver,
  onDragLeave,
  onPick,
  inputRef,
  onInputChange,
}: {
  isDragging: boolean;
  error: string | null;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onPick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      }}
      className={`group flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors sm:min-h-[420px] ${
        isDragging
          ? 'border-[#f44] bg-[#f44]/5'
          : 'border-black/15 hover:border-[#f44]/60 hover:bg-black/[0.02] dark:border-white/15 dark:hover:bg-white/[0.02]'
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          isDragging
            ? 'bg-[#f44] text-white'
            : 'bg-black/[0.05] text-black/70 group-hover:bg-[#f44] group-hover:text-white dark:bg-white/[0.08] dark:text-white/70'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>

      <p className="mt-5 text-xl font-semibold sm:text-2xl">
        {isDragging ? 'Drop to convert' : 'Drop your PDF here'}
      </p>
      <p className="mt-2 text-sm opacity-60 sm:text-base">
        or click anywhere in this area to choose a file
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        className="mt-6 rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34]"
      >
        Choose a file
      </button>
      <p className="mt-6 text-xs opacity-50">
        PDF or image · nothing is uploaded
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {error && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ActionBar({
  fileName,
  numPages,
  readyCount,
  fileKind,
  allReady,
  isZipping,
  onDownloadAll,
  onReset,
}: {
  fileName: string;
  numPages: number | null;
  readyCount: number;
  fileKind: FileKind | null;
  allReady: boolean;
  isZipping: boolean;
  onDownloadAll: () => void;
  onReset: () => void;
}) {
  const progress =
    fileKind === 'pdf' && numPages
      ? allReady
        ? `${numPages} page${numPages === 1 ? '' : 's'} ready`
        : `Converting… ${readyCount} / ${numPages}`
      : '';

  const showZip = fileKind === 'pdf' && numPages !== null && numPages > 1;

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate font-medium" title={fileName}>
          {fileName}
        </p>
        {progress && <p className="text-sm opacity-60">{progress}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {showZip && (
          <button
            type="button"
            onClick={onDownloadAll}
            disabled={!allReady || isZipping}
            className="flex items-center gap-2 rounded-lg bg-[#f44] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#f34] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isZipping ? (
              <span
                aria-label="Zipping"
                className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              />
            ) : (
              <DownloadIcon />
            )}
            {isZipping ? 'Zipping…' : 'Download all (.zip)'}
          </button>
        )}
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
        >
          Choose another
        </button>
      </div>
    </div>
  );
}

function ResultsGrid({
  numPages,
  pages,
  baseName,
  onOpen,
}: {
  numPages: number | null;
  pages: (PageImage | undefined)[];
  baseName: string;
  onOpen: (index: number) => void;
}) {
  if (numPages === null) {
    return (
      <div className="mt-6 flex justify-center py-16">
        <div
          role="status"
          aria-label="Loading"
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff4444]"
        />
      </div>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: numPages }, (_, i) => {
        const page = pages[i];
        const label = `Page ${i + 1}`;
        const downloadName = `${baseName}-page-${i + 1}.png`;
        return (
          <li key={i}>
            <ImageCard
              url={page?.url}
              label={label}
              downloadName={downloadName}
              onOpen={() => onOpen(i)}
            />
          </li>
        );
      })}
    </ul>
  );
}

function ImageCard({
  url,
  label,
  downloadName,
  onOpen,
  large = false,
}: {
  url: string | undefined;
  label: string;
  downloadName: string;
  onOpen?: () => void;
  large?: boolean;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.03] ${
        large ? 'w-full max-w-2xl' : ''
      }`}
    >
      <div
        className={`flex items-center justify-center ${
          large ? 'min-h-[200px]' : 'aspect-[1/1.3]'
        } bg-white dark:bg-black/40`}
      >
        {url ? (
          <button
            type="button"
            onClick={onOpen}
            aria-label={`Open ${label} preview`}
            className="group flex h-full w-full cursor-zoom-in items-center justify-center"
          >
            <img
              src={url}
              alt={label}
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
            />
          </button>
        ) : (
          <div
            role="status"
            aria-label={`Rendering ${label}`}
            className="h-7 w-7 animate-spin rounded-full border-[3px] border-gray-200 border-t-[#ff4444]"
          />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="truncate text-sm opacity-70">{label}</span>
        {url ? (
          <a
            href={url}
            download={downloadName}
            aria-label={`Download ${label}`}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md bg-[#f44] text-white transition-colors hover:bg-[#f34]"
          >
            <DownloadIcon className="h-4 w-4" />
          </a>
        ) : (
          <span className="text-xs opacity-50">Rendering…</span>
        )}
      </div>
    </div>
  );
}

function DownloadIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function Lightbox({
  pages,
  index,
  fileKind,
  fileName,
  baseName,
  onClose,
  onIndexChange,
}: {
  pages: (PageImage | undefined)[];
  index: number;
  fileKind: FileKind | null;
  fileName: string;
  baseName: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}) {
  const page = pages[index];
  const total = pages.length;
  const hasPrev = index > 0;
  const hasNext = index < total - 1;
  const isPdf = fileKind === 'pdf';

  const goPrev = () => {
    if (hasPrev) onIndexChange(index - 1);
  };
  const goNext = () => {
    if (hasNext) onIndexChange(index + 1);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && hasPrev) onIndexChange(index - 1);
      else if (e.key === 'ArrowRight' && hasNext) onIndexChange(index + 1);
    };
    window.addEventListener('keydown', handler);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [index, hasPrev, hasNext, onClose, onIndexChange]);

  const label = isPdf ? `Page ${index + 1}` : fileName;
  const downloadName = isPdf ? `${baseName}-page-${index + 1}.png` : fileName;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} preview`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex animate-fade-in flex-col bg-black/85 backdrop-blur-sm"
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 text-white sm:px-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-w-0 text-sm">
          {isPdf ? (
            <span className="font-medium">
              {index + 1}
              <span className="opacity-50"> / {total}</span>
            </span>
          ) : (
            <span className="truncate font-medium">{fileName}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {page ? (
            <a
              href={page.url}
              download={downloadName}
              aria-label={`Download ${label}`}
              className="flex items-center gap-2 rounded-lg bg-[#f44] px-3 py-2 text-sm font-medium transition-colors hover:bg-[#f34]"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </a>
          ) : (
            <span
              aria-hidden
              className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm font-medium opacity-50"
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m6 6 12 12M6 18 18 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 pb-6 sm:px-12">
        {isPdf && hasPrev && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            aria-label="Previous page"
            className="absolute left-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        )}

        {page ? (
          <img
            src={page.url}
            alt={label}
            onClick={(e) => e.stopPropagation()}
            className="max-h-full max-w-full cursor-default rounded-lg object-contain shadow-2xl"
          />
        ) : (
          <div
            role="status"
            aria-label={`Rendering ${label}`}
            onClick={(e) => e.stopPropagation()}
            className="h-12 w-12 animate-spin rounded-full border-4 border-white/20 border-t-white"
          />
        )}

        {isPdf && hasNext && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            aria-label="Next page"
            className="absolute right-2 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
