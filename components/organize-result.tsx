import { DownloadIcon } from './download-icon';

type Props = {
  blob: Blob;
  fileName: string;
  pageCount: number;
  onStartOver: () => void;
};

export function OrganizeResult({
  blob,
  fileName,
  pageCount,
  onStartOver,
}: Props) {
  const url = URL.createObjectURL(blob);

  return (
    <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.02] sm:p-8">
      <div className="flex flex-col items-center gap-5 text-center sm:gap-6">
        <div>
          <p className="text-xl font-semibold sm:text-2xl">
            Your organized PDF is ready
          </p>
          <p className="mt-1 text-sm opacity-60">
            {pageCount} {pageCount === 1 ? 'page' : 'pages'} in total
          </p>
        </div>
        <a
          href={url}
          download={fileName}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#f44] px-6 py-4 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#f34] sm:w-auto sm:px-10 sm:text-lg"
        >
          <DownloadIcon className="h-5 w-5" />
          Download organized PDF
        </a>
        <button
          type="button"
          onClick={onStartOver}
          className="text-sm font-medium opacity-70 underline-offset-4 transition-opacity hover:opacity-100 hover:underline"
        >
          Start over
        </button>
      </div>
    </div>
  );
}
