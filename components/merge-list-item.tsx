import type { DragEvent, KeyboardEvent } from 'react';
import { formatBytes } from '../lib/format-bytes';
import type { MergeItem } from './pdf-merger';

type Props = {
  item: MergeItem;
  index: number;
  isDragging: boolean;
  isOver: boolean;
  disabled: boolean;
  onDragStart: (e: DragEvent<HTMLButtonElement>) => void;
  onDragOver: (e: DragEvent<HTMLLIElement>) => void;
  onDrop: (e: DragEvent<HTMLLIElement>) => void;
  onDragEnd: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLLIElement>) => void;
  onRemove: () => void;
};

export function MergeListItem({
  item,
  index,
  isDragging,
  isOver,
  disabled,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onKeyDown,
  onRemove,
}: Props) {
  return (
    <li
      onDragOver={onDragOver}
      onDrop={onDrop}
      onKeyDown={onKeyDown}
      tabIndex={disabled ? -1 : 0}
      aria-label={`${item.name}, position ${index + 1} of its group. Use the move handle to drag, or press arrow keys to reorder.`}
      className={`rounded-xl border bg-white p-3 transition-all dark:bg-black/40 ${
        isOver
          ? 'border-[#f44] ring-2 ring-[#f44]/40'
          : 'border-black/10 dark:border-white/10'
      } ${isDragging ? 'cursor-grabbing opacity-40' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          draggable={!disabled}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          disabled={disabled}
          aria-label={`Move ${item.name}`}
          className="flex h-9 w-9 flex-none cursor-grab items-center justify-center rounded-md text-black/40 transition-colors hover:bg-black/[0.05] hover:text-black/70 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/40 dark:hover:bg-white/[0.06] dark:hover:text-white/70"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
            aria-hidden
          >
            <circle cx="9" cy="6" r="1.5" />
            <circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" />
            <circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" />
            <circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>

        <div className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-black/[0.05] text-sm font-semibold tabular-nums text-black/70 dark:bg-white/[0.08] dark:text-white/70">
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium" title={item.name}>
            {item.name}
          </p>
          <p className="text-xs opacity-60">
            {item.error
              ? item.error
              : item.pageCount === null
                ? 'Reading…'
                : `${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'} · ${formatBytes(item.size)}`}
          </p>
        </div>

        {item.pageCount === null && !item.error ? (
          <div
            role="status"
            aria-label="Reading PDF"
            className="h-5 w-5 flex-none animate-spin rounded-full border-2 border-black/10 border-t-[#f44] dark:border-white/10"
          />
        ) : null}

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${item.name}`}
          className="flex h-9 w-9 flex-none items-center justify-center rounded-md text-black/50 transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-30 dark:text-white/50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
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
    </li>
  );
}
