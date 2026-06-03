'use client';

import { useEffect } from 'react';
import { DownloadIcon } from './download-icon';
import type { FileKind, PageImage } from '../lib/use-source-pages';
import { pageDownloadName } from '../lib/page-filename';

type Props = {
  pages: (PageImage | undefined)[];
  index: number;
  fileKind: FileKind | null;
  fileName: string;
  baseName: string;
  onClose: () => void;
  onIndexChange: (index: number) => void;
};

export function Lightbox({
  pages,
  index,
  fileKind,
  fileName,
  baseName,
  onClose,
  onIndexChange,
}: Props) {
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
  const downloadName = isPdf ? pageDownloadName(baseName, index) : fileName;

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
