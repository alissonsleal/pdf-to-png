'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatBytes } from '../lib/format-bytes';
import type { MergeItem } from './pdf-merger';
import type { CSSProperties, KeyboardEvent } from 'react';

type Props = {
  item: MergeItem;
  index: number;
  disabled: boolean;
  onRemove: () => void;
};

export function MergeListItem({ item, index, disabled, onRemove }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: item.id,
    disabled,
  });

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging || !transform ? 'none' : transition,
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLLIElement>) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (e.metaKey || e.ctrlKey) {
        e.preventDefault();
        onRemove();
      }
    }
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      aria-label={`${item.name}, position ${index + 1} of its group. Use the move handle to drag, or press arrow keys to reorder.`}
      className={`rounded-xl border bg-white p-3 transition-all dark:bg-black/40 ${
        isDragging
          ? 'opacity-0'
          : 'border-black/10 dark:border-white/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
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
