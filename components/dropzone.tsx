import type { ChangeEvent, DragEvent } from 'react';

type Props = {
  isDragging: boolean;
  error: string | null;
  onDrop: (e: DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: DragEvent<HTMLDivElement>) => void;
  onPick: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function Dropzone({
  isDragging,
  error,
  onDrop,
  onDragOver,
  onDragLeave,
  onPick,
  inputRef,
  onInputChange,
}: Props) {
  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={onPick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPick();
        }
      }}
      className={`group flex min-h-[360px] cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-12 text-center transition-colors sm:min-h-[420px] ${
        isDragging
          ? 'border-[#f44] bg-[#f44]/5'
          : 'border-black/15 hover:border-[#f44]/60 hover:bg-black/[0.02] dark:border-white/15 dark:hover:bg-white/[0.02]'
      }`}
    >
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
          isDragging
            ? 'bg-[#f44] text-white'
            : 'bg-black/[0.05] text-black/70 group-hover:bg-[#f44] group-hover:text-white dark:bg-white/[0.08] dark:text-white/70'
        }`}
      >
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
        {isDragging ? 'Drop to convert' : 'Drop your PDF here'}
      </p>
      <p className="mt-2 text-sm opacity-60 sm:text-base">
        or click anywhere in this area to choose a file
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onPick();
        }}
        className="mt-6 rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34]"
      >
        Choose a file
      </button>
      <p className="mt-6 text-xs opacity-50">
        PDF or image · nothing is uploaded
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/*"
        onChange={onInputChange}
        className="hidden"
      />

      {error && (
        <p className="mt-4 text-sm text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
