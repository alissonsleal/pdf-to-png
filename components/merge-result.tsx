import { DownloadIcon } from './download-icon';

type Props = {
  blob: Blob;
  fileName: string;
  pageCount: number;
  onStartOver: () => void;
};

export function MergeResult({
  blob,
  fileName,
  pageCount,
  onStartOver,
}: Props) {
  const url = URL.createObjectURL(blob);

  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.02] sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium">Your merged PDF is ready</p>
          <p className="text-sm opacity-60">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'} in total
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={url}
            download={fileName}
            className="flex items-center gap-2 rounded-lg bg-[#f44] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#f34]"
          >
            <DownloadIcon />
            Download merged PDF
          </a>
          <button
            type="button"
            onClick={onStartOver}
            className="rounded-lg border border-black/15 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/[0.04] dark:border-white/15 dark:hover:bg-white/[0.06]"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
}
