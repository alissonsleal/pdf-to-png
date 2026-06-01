'use client';

import dynamic from 'next/dynamic';

const PdfConverter = dynamic(
  () => import('./PdfConverter').then((m) => m.PdfConverter),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center">
        <div
          role="status"
          aria-label="Loading"
          className="h-16 w-16 animate-spin rounded-full border-8 border-gray-200 border-t-[#ff4444]"
        />
      </div>
    ),
  },
);

export default function Page() {
  return <PdfConverter />;
}
