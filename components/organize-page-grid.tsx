'use client';

import { useMemo, useState } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { OrganizePageCard } from './organize-page-card';
import { OrganizeDragPreview } from './organize-drag-preview';
import type { OrganizePage } from '../lib/organize-pdf';

type ThumbnailMap = Record<string, string | null>;

type Props = {
  pages: OrganizePage[];
  thumbnails: ThumbnailMap;
  disabled: boolean;
  onReorder: (from: number, to: number) => void;
  onRotate: (index: number) => void;
  onRemove: (index: number) => void;
  onInsertBlank: (index: number, position: 'before' | 'after') => void;
};

export function OrganizePageGrid({
  pages,
  thumbnails,
  disabled,
  onReorder,
  onRotate,
  onRemove,
  onInsertBlank,
}: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const pageIds = useMemo(() => pages.map((p) => p.id), [pages]);

  const activePage = useMemo(
    () => (activeId ? pages.find((p) => p.id === activeId) ?? null : null),
    [activeId, pages],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const fromIndex = pageIds.indexOf(String(active.id));
    const toIndex = pageIds.indexOf(String(over.id));
    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex);
    }
  };

  const handleDragCancel = (_event: DragCancelEvent) => {
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="relative">
        <SortableContext items={pageIds} strategy={rectSortingStrategy}>
          <div
            className="flex flex-wrap items-start justify-center gap-6 pr-20 sm:pr-24"
            aria-label="Pages in the new PDF, in order"
          >
            {pages.map((page, i) => {
              const thumbKey =
                page.kind === 'blank'
                  ? page.id
                  : `${page.sourceId}-${page.pageIndex}`;
              return (
                <OrganizePageCard
                  key={page.id}
                  page={page}
                  position={i}
                  thumbnailUrl={thumbnails[thumbKey] ?? null}
                  disabled={disabled}
                  onRotate={() => onRotate(i)}
                  onRemove={() => onRemove(i)}
                  onInsertBlankBefore={() => onInsertBlank(i, 'before')}
                  onInsertBlankAfter={() => onInsertBlank(i, 'after')}
                />
              );
            })}
          </div>
        </SortableContext>
      </div>

      <DragOverlay dropAnimation={null}>
        {activePage ? (
          <OrganizeDragPreview
            page={activePage}
            position={pageIds.indexOf(activePage.id)}
            thumbnailUrl={
              activePage.kind === 'blank'
                ? null
                : (thumbnails[`${activePage.sourceId}-${activePage.pageIndex}`] ?? null)
            }
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
