'use client';

import type { OrganizePage } from '../lib/organize-pdf';

type Props = {
  page: OrganizePage;
  position: number;
  thumbnailUrl: string | null;
};

export function OrganizeDragPreview({ page, position, thumbnailUrl }: Props) {
  return (
    <div
      className="flex select-none flex-col items-center"
      style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
    >
      <div className="relative aspect-[3/4] w-[200px] rounded-2xl border-2 border-[#f44] bg-white shadow-2xl ring-4 ring-[#f44]/30">
        <div
          className="absolute inset-3 overflow-hidden rounded-md bg-white"
          style={{
            transform: `rotate(${page.kind === 'pdf' ? page.rotation : 0}deg)`,
            transition: 'transform 200ms ease-out',
          }}
        >
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={`Page ${position + 1}`}
              className="h-full w-full object-contain"
              draggable={false}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-white">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-black/20">
                Blank
              </span>
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-[#f44] px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm">
          {position + 1}
        </div>
      </div>
    </div>
  );
}
