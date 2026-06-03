'use client';

import { useState, type DragEvent, type KeyboardEvent } from 'react';
import { MergeListItem } from './merge-list-item';
import type { MergeItem } from './pdf-merger';

type Props = {
  items: MergeItem[];
  onReorder: (from: number, to: number) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
};

export function MergeList({ items, onReorder, onRemove, disabled }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const clearDrag = () => {
    setDraggingId(null);
    setOverIndex(null);
  };

  const handleDragStart =
    (id: string) => (e: DragEvent<HTMLButtonElement>) => {
      if (disabled) return;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      setDraggingId(id);
    };

  const handleDragOver =
    (index: number) => (e: DragEvent<HTMLLIElement>) => {
      if (disabled) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIndex !== index) setOverIndex(index);
    };

  const handleDrop = (index: number) => (e: DragEvent<HTMLLIElement>) => {
    if (disabled) return;
    e.preventDefault();
    if (draggingId) {
      const fromIndex = items.findIndex((it) => it.id === draggingId);
      if (fromIndex !== -1 && fromIndex !== index) {
        onReorder(fromIndex, index);
      }
    }
    clearDrag();
  };

  const handleDragEnd = () => {
    clearDrag();
  };

  const handleKeyDown =
    (index: number) => (e: KeyboardEvent<HTMLLIElement>) => {
      if (disabled) return;
      if (e.key === 'ArrowUp' && index > 0) {
        e.preventDefault();
        onReorder(index, index - 1);
      } else if (e.key === 'ArrowDown' && index < items.length - 1) {
        e.preventDefault();
        onReorder(index, index + 1);
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          onRemove(items[index].id);
        }
      }
    };

  return (
    <ol className="space-y-2" aria-label="PDFs to merge, in order">
      {items.map((item, i) => (
        <MergeListItem
          key={item.id}
          item={item}
          index={i}
          isDragging={draggingId === item.id}
          isOver={overIndex === i && draggingId !== null && draggingId !== item.id}
          disabled={disabled}
          onDragStart={handleDragStart(item.id)}
          onDragOver={handleDragOver(i)}
          onDrop={handleDrop(i)}
          onDragEnd={handleDragEnd}
          onKeyDown={handleKeyDown(i)}
          onRemove={() => onRemove(item.id)}
        />
      ))}
    </ol>
  );
}
