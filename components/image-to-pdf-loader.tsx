'use client';

import dynamic from 'next/dynamic';

const ImageToPdf = dynamic(
  () => import('./image-to-pdf').then((m) => m.ImageToPdf),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[420px] items-center justify-center rounded-3xl border border-dashed border-black/15 dark:border-white/15">
        <div
          role="status"
          aria-label="Loading"
          className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff4444]"
        />
      </div>
    ),
  },
);

export function ImageToPdfLoader() {
  return <ImageToPdf />;
}
