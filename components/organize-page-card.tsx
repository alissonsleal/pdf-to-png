'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { OrganizePage } from '../lib/organize-pdf';

type Props = {
  page: OrganizePage;
  position: number;
  thumbnailUrl: string | null;
  disabled: boolean;
  onRotate: () => void;
  onRemove: () => void;
  onInsertBlankBefore: () => void;
  onInsertBlankAfter: () => void;
};

export function OrganizePageCard({
  page,
  position,
  thumbnailUrl,
  disabled,
  onRotate,
  onRemove,
  onInsertBlankBefore,
  onInsertBlankAfter,
}: Props) {
  const [deleteArmed, setDeleteArmed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: page.id,
    disabled,
  });

  useEffect(() => {
    if (!deleteArmed) return;
    const t = setTimeout(() => setDeleteArmed(false), 1500);
    return () => clearTimeout(t);
  }, [deleteArmed]);

  const outerStyle: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging || !transform ? 'none' : transition,
  };

  const pageStyle: CSSProperties = {
    transform: `rotate(${page.kind === 'pdf' ? page.rotation : 0}deg)`,
    transition: 'transform 200ms ease-out',
  };

  return (
    <div
      ref={setNodeRef}
      style={outerStyle}
      {...attributes}
      {...listeners}
      className={`group relative flex w-[200px] select-none touch-none flex-col items-center ${
        disabled ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
      } ${isDragging ? 'opacity-0' : ''}`}
    >
      <div
        className="relative aspect-[3/4] w-full select-none rounded-2xl border-2 border-[#fca5a5] bg-white shadow-sm dark:bg-white/95"
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        <div
          className="absolute inset-3 overflow-hidden rounded-md bg-white"
          style={pageStyle}
        >
          {page.kind === 'blank' ? (
            <div className="flex h-full w-full items-center justify-center bg-white">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-black/20">
                Blank
              </span>
            </div>
          ) : thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`Page ${position + 1}`}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-xs font-medium uppercase tracking-wider text-black/40">
                …
              </span>
            </div>
          )}
        </div>

        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#f44] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          {position + 1}
        </div>

        <div
          className="absolute -left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ActionButton
            onClick={onInsertBlankBefore}
            ariaLabel="Insert blank page before"
            tooltip="Add blank before"
            tooltipSide="left"
          >
            <PlusLeftIcon />
          </ActionButton>
          <ActionButton
            onClick={onRotate}
            ariaLabel="Rotate clockwise"
            tooltip="Rotate"
            tooltipSide="left"
          >
            <RotateIcon />
          </ActionButton>
        </div>

        <div
          className="absolute -right-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <ActionButton
            onClick={onInsertBlankAfter}
            ariaLabel="Insert blank page after"
            tooltip="Add blank after"
            tooltipSide="right"
          >
            <PlusRightIcon />
          </ActionButton>
          <ActionButton
            onClick={() => {
              if (deleteArmed) {
                onRemove();
                setDeleteArmed(false);
              } else {
                setDeleteArmed(true);
              }
            }}
            ariaLabel={
              deleteArmed
                ? `Confirm remove page ${position + 1}`
                : `Remove page ${position + 1}`
            }
            tooltip={deleteArmed ? 'Confirm remove' : 'Remove'}
            tooltipSide="right"
            variant={deleteArmed ? 'armed' : 'default'}
          >
            {deleteArmed ? <CheckIcon /> : <CloseIcon />}
          </ActionButton>
        </div>
      </div>

      <p className="mt-2 text-center text-xs opacity-60">
        {page.kind === 'blank' ? 'Blank page' : `Page ${page.pageIndex + 1}`}
      </p>
    </div>
  );
}

function ActionButton({
  onClick,
  ariaLabel,
  tooltip,
  tooltipSide = 'right',
  variant = 'default',
  children,
}: {
  onClick: () => void;
  ariaLabel: string;
  tooltip: string;
  tooltipSide?: 'left' | 'right';
  variant?: 'default' | 'armed';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={ariaLabel}
      title={tooltip}
      className={`group/btn relative flex h-8 w-8 items-center justify-center rounded-full shadow-md ring-1 ring-black/10 transition-all ${
        variant === 'armed'
          ? 'scale-110 bg-red-600 text-white ring-red-600'
          : 'bg-white text-black/70 hover:bg-black/5'
      }`}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute top-1/2 z-30 -translate-y-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-[10px] font-medium text-white opacity-0 shadow-sm transition-opacity duration-150 group-hover/btn:opacity-100 ${
          tooltipSide === 'right' ? 'left-full ml-2' : 'right-full mr-2'
        }`}
      >
        {tooltip}
      </span>
    </button>
  );
}

function RotateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 12a9 9 0 1 1-3.5-7.1" />
      <polyline points="21 4 21 9 16 9" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="m6 6 12 12M6 18 18 6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function PlusLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="4" width="12" height="16" rx="1.5" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <polyline points="4 12 6 10 6 14" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PlusRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="6" y="4" width="12" height="16" rx="1.5" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="9" y1="12" x2="15" y2="12" />
      <polyline points="20 12 18 10 18 14" fill="currentColor" stroke="none" />
    </svg>
  );
}
