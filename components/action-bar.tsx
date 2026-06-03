import { DownloadIcon } from './download-icon';
import type { FileKind } from '../lib/use-source-pages';

type Props = {
  fileName: string;
  numPages: number | null;
  readyCount: number;
  fileKind: FileKind | null;
  allReady: boolean;
  isZipping: boolean;
  onDownloadAll: () => void;
  onReset: () => void;
};

export function ActionBar({
  fileName,
  numPages,
  readyCount,
  fileKind,
  allReady,
  isZipping,
  onDownloadAll,
  onReset,
}: Props) {
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
