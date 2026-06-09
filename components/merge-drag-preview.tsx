import { formatBytes } from '../lib/format-bytes';
import type { MergeItem } from './pdf-merger';

type Props = {
  item: MergeItem;
  index: number;
};

export function MergeDragPreview({ item, index }: Props) {
  return (
    <div className="rounded-xl border border-[#f44] bg-white p-3 shadow-2xl ring-4 ring-[#f44]/30 dark:bg-black/40">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-black/[0.05] text-sm font-semibold tabular-nums text-black/70 dark:bg-white/[0.08] dark:text-white/70">
          {index + 1}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{item.name}</p>
          <p className="text-xs opacity-60">
            {item.pageCount !== null
              ? `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'} · ${formatBytes(item.size)}`
              : 'Reading…'}
          </p>
        </div>
      </div>
    </div>
  );
}
