import { DownloadIcon } from './download-icon';

type Props = {
  url: string | undefined;
  label: string;
  downloadName: string;
  onOpen?: () => void;
  large?: boolean;
};

export function ImageCard({
  url,
  label,
  downloadName,
  onOpen,
  large = false,
}: Props) {
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
