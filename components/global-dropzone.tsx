'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

type Props = {
  onDrop: (files: FileList) => void;
  show: boolean;
  children: ReactNode;
  label?: string;
};

export function GlobalDropzone({ onDrop, show, children, label = 'Drop to convert' }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const counterRef = useRef(0);
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  useEffect(() => {
    if (!show) {
      counterRef.current = 0;
      setIsDragging(false);
      return;
    }

    const isFileDrag = (e: globalThis.DragEvent) =>
      e.dataTransfer?.types?.includes('Files');

    const handleDragEnter = (e: globalThis.DragEvent) => {
      if (!isFileDrag(e)) return;
      counterRef.current++;
      if (counterRef.current === 1) {
        setIsDragging(true);
      }
    };

    const handleDragLeave = () => {
      if (counterRef.current === 0) return;
      counterRef.current--;
      if (counterRef.current <= 0) {
        counterRef.current = 0;
        setIsDragging(false);
      }
    };

    const handleDragOver = (e: globalThis.DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
    };

    const handleDrop = (e: globalThis.DragEvent) => {
      if (!isFileDrag(e)) return;
      e.preventDefault();
      counterRef.current = 0;
      setIsDragging(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        onDropRef.current(e.dataTransfer.files);
      }
    };

    document.addEventListener('dragenter', handleDragEnter);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    return () => {
      document.removeEventListener('dragenter', handleDragEnter);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('drop', handleDrop);
    };
  }, [show]);

  return (
    <>
      {children}
      {isDragging && show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 animate-fade-in">
          <div className="rounded-3xl border-2 border-dashed border-[#f44] bg-white p-12 text-center dark:bg-[#181a1b]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f44] text-white">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="mt-5 text-xl font-semibold sm:text-2xl">
              {label}
            </p>
            <p className="mt-2 text-sm opacity-60">
              Drop your file here to get started
            </p>
          </div>
        </div>
      )}
    </>
  );
}
