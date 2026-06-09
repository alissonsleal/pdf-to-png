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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { MergeListItem } from './merge-list-item';
import { MergeDragPreview } from './merge-drag-preview';
import type { MergeItem } from './pdf-merger';

type Props = {
  items: MergeItem[];
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
};

export function MergeList({ items, onReorder, onRemove, disabled }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(() => items.map((it) => it.id), [items]);

  const activeItem = useMemo(
    () => (activeId ? items.find((it) => it.id === activeId) ?? null : null),
    [activeId, items],
  );

  const activeIndex = useMemo(
    () => (activeItem ? items.indexOf(activeItem) : -1),
    [activeItem, items],
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const fromIndex = itemIds.indexOf(String(active.id));
    const toIndex = itemIds.indexOf(String(over.id));
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
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2" aria-label="PDFs to merge, in order">
          {items.map((item, i) => (
            <MergeListItem
              key={item.id}
              item={item}
              index={i}
              disabled={disabled}
              onRemove={() => onRemove(item.id)}
            />
          ))}
        </ol>
      </SortableContext>

      <DragOverlay dropAnimation={null}>
        {activeItem ? (
          <MergeDragPreview item={activeItem} index={activeIndex} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
