import { DownloadIcon } from './download-icon';
import { formatBytes } from '../lib/format-bytes';
import type { CompressMethod } from '../lib/compress-pdf';

type Props = {
  blob: Blob;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
  method: CompressMethod;
  onStartOver: () => void;
};

export function CompressResult({
  blob,
  fileName,
  originalSize,
  compressedSize,
  pageCount,
  method,
  onStartOver,
}: Props) {
  const url = URL.createObjectURL(blob);
  const ratio = Math.max(0, 1 - compressedSize / originalSize);
  const percent = (ratio * 100).toFixed(0);
  const savedBytes = Math.max(0, originalSize - compressedSize);
  const grew = compressedSize >= originalSize;

  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.02] sm:p-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <p className="text-xl font-semibold sm:text-2xl">
            {grew ? 'Your compressed PDF is ready' : 'Your PDF is compressed'}
          </p>
          <p className="mt-1 text-sm opacity-60">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'} processed
          </p>
        </div>

        <div className="grid w-full max-w-md grid-cols-3 gap-3 text-left">
          <Stat label="Original" value={formatBytes(originalSize)} />
          <Stat label="Compressed" value={formatBytes(compressedSize)} highlight />
          <Stat
            label={grew ? 'Change' : 'Saved'}
            value={grew ? `+${formatBytes(savedBytes)}` : `${percent}%`}
            accent={grew ? 'warn' : 'good'}
          />
        </div>

        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs dark:border-white/10 dark:bg-white/[0.04]">
          <MethodIcon method={method} />
          <span className="font-medium">{METHOD_LABEL[method]}</span>
        </div>

        {grew ? (
          <p className="max-w-md text-sm opacity-70">
            This PDF is already as compressed as possible — we couldn&apos;t
            shrink it further without losing quality. The original is the
            smallest version.
          </p>
        ) : method === 'rasterized' ? (
          <p className="max-w-md text-sm opacity-70">
            Lossless re-saving and image re-encoding could not shrink this PDF,
            so every page was re-rendered as an image. Text is no longer
            selectable in the output.
          </p>
        ) : method === 'images-only' ? (
          <p className="max-w-md text-sm opacity-70">
            Text and vector content were left untouched. Only the embedded
            images were re-encoded as JPEG.
          </p>
        ) : null}

        <a
          href={url}
          download={fileName}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#f44] px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#f34] sm:w-auto sm:px-10 sm:text-lg"
        >
          <DownloadIcon className="h-5 w-5" />
          Download compressed PDF
        </a>
        <button
          type="button"
          onClick={onStartOver}
          className="text-sm font-medium opacity-70 underline-offset-4 transition-opacity hover:opacity-100 hover:underline"
        >
          Compress another file
        </button>
      </div>
    </div>
  );
}

const METHOD_LABEL: Record<CompressMethod, string> = {
  'lossless': 'Lossless optimization',
  'images-only': 'Images re-encoded, text preserved',
  'rasterized': 'Pages re-rendered as images',
};

function MethodIcon({ method }: { method: CompressMethod }) {
  if (method === 'lossless') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    );
  }
  if (method === 'images-only') {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <circle cx="9" cy="9" r="2" />
        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
      </svg>
    );
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function Stat({
  label,
  value,
  highlight = false,
  accent,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  accent?: 'good' | 'warn';
}) {
  const accentClass =
    accent === 'good'
      ? 'text-emerald-600 dark:text-emerald-400'
      : accent === 'warn'
        ? 'text-amber-600 dark:text-amber-400'
        : '';
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? 'border-[#f44]/30 bg-[#f44]/5'
          : 'border-black/10 dark:border-white/10'
      }`}
    >
      <p className="text-xs uppercase tracking-wide opacity-60">{label}</p>
      <p className={`mt-1 text-lg font-semibold tabular-nums ${accentClass}`}>
        {value}
      </p>
    </div>
  );
}
