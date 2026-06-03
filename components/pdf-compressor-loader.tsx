'use client';

import dynamic from 'next/dynamic';

const PdfCompressor = dynamic(
  () => import('./pdf-compressor').then((m) => m.PdfCompressor),
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

export function PdfCompressorLoader() {
  return <PdfCompressor />;
}
