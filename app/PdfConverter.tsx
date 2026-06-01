'use client';

import { useState, type ChangeEvent } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type FileKind = 'pdf' | 'image';

export function PdfConverter() {
  const [isLoading, setIsLoading] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const handleImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageUrls([]);
    setNumPages(null);

    if (file.type === 'application/pdf') {
      setIsLoading(true);
      setPdfFile(file);
      setFileKind('pdf');
    } else if (file.type.startsWith('image/')) {
      setFileKind('image');
      setImageUrls([URL.createObjectURL(file)]);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  const onPageRenderSuccess = (pageIndex: number) => {
    const canvas = document.querySelector<HTMLCanvasElement>(
      `.pdf-page-${pageIndex + 1} canvas`,
    );
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      setImageUrls((prev) => {
        if (prev[pageIndex]) return prev;
        const next = [...prev];
        next[pageIndex] = URL.createObjectURL(blob);
        return next;
      });
    });
  };

  return (
    <main className="flex min-h-screen flex-col items-center px-2 py-20 text-center">
      <h1 className="mb-8 text-3xl font-bold">PDF to PNG client-side conversion</h1>

      <label
        htmlFor="upload"
        className="w-full max-w-xs cursor-pointer rounded-lg bg-[#f44] px-8 py-4 text-white transition-colors hover:bg-[#f34]"
      >
        Upload file
      </label>
      <input
        id="upload"
        type="file"
        accept="application/pdf,image/*"
        onChange={handleImage}
        className="hidden"
      />

      {isLoading && (
        <div
          role="status"
          aria-label="Loading"
          className="mt-8 h-16 w-16 animate-spin rounded-full border-8 border-gray-200 border-t-[#ff4444]"
        />
      )}

      {pdfFile && fileKind === 'pdf' && (
        <Document
          file={pdfFile}
          onLoadSuccess={onDocumentLoadSuccess}
          error={<div className="mt-8">Failed to load PDF.</div>}
          className="mt-8 flex w-full flex-col items-center"
        >
          {Array.from({ length: numPages ?? 0 }, (_, index) => (
            <div
              key={`page_${index + 1}`}
              className="mb-12 flex w-full flex-col items-center"
            >
              <Page
                pageNumber={index + 1}
                className={`pdf-page-${index + 1} w-[90vw] max-w-[590px] rounded-2xl`}
                onRenderSuccess={() => onPageRenderSuccess(index)}
                width={1024}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                error={<div>Failed to render page.</div>}
              />
              {imageUrls[index] ? (
                <a
                  className="mt-4 w-full max-w-xs cursor-pointer rounded-lg bg-[#f44] px-8 py-4 text-white transition-colors hover:bg-[#f34]"
                  href={imageUrls[index]}
                  download={`page-${index + 1}.png`}
                >
                  Download page {index + 1}
                </a>
              ) : (
                <span className="mt-4 text-sm opacity-60">Rendering…</span>
              )}
            </div>
          ))}
        </Document>
      )}

      {fileKind === 'image' &&
        imageUrls.map((url, index) => (
          <div
            key={`image_${index}`}
            className="mt-8 flex w-full flex-col items-center"
          >
            <img
              className="w-[90vw] max-w-[590px] rounded-2xl"
              src={url}
              alt=""
            />
            <a
              className="mt-4 w-full max-w-xs cursor-pointer rounded-lg bg-[#f44] px-8 py-4 text-white transition-colors hover:bg-[#f34]"
              href={url}
              download
            >
              Download file
            </a>
          </div>
        ))}
    </main>
  );
}
