'use client';

import { useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

const RENDER_WIDTH_PX = 1024;

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export type FileKind = 'pdf' | 'image';
export type PageImage = { url: string; blob: Blob };

function isPdf(file: File) {
  return file.type === 'application/pdf';
}

function isImage(file: File) {
  return file.type.startsWith('image/');
}

function disposePages(list: (PageImage | undefined)[]) {
  list.forEach((p) => p && URL.revokeObjectURL(p.url));
}

export function useSourcePages() {
  const [file, setFile] = useState<File | null>(null);
  const [fileKind, setFileKind] = useState<FileKind | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pages, setPages] = useState<(PageImage | undefined)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const hiddenRef = useRef<HTMLDivElement>(null);

  const setSource = (next: File) => {
    disposePages(pages);
    setNumPages(null);
    setPages([]);
    setError(null);

    if (isPdf(next)) {
      setFile(next);
      setFileKind('pdf');
    } else if (isImage(next)) {
      const url = URL.createObjectURL(next);
      setFile(next);
      setFileKind('image');
      setPages([{ url, blob: next }]);
      setNumPages(1);
    } else {
      setError('Please choose a PDF or an image file.');
    }
  };

  const reset = () => {
    disposePages(pages);
    setFile(null);
    setFileKind(null);
    setNumPages(null);
    setPages([]);
    setError(null);
  };

  const onPageRenderSuccess = (pageIndex: number) => {
    const canvas = hiddenRef.current?.querySelector<HTMLCanvasElement>(
      `.pdf-page-${pageIndex + 1} canvas`,
    );
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      setPages((prev) => {
        if (prev[pageIndex]) return prev;
        const next = [...prev];
        next[pageIndex] = { url: URL.createObjectURL(blob), blob };
        return next;
      });
    });
  };

  const hiddenHarness =
    fileKind === 'pdf' && file ? (
      <div
        ref={hiddenRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 -z-10 opacity-0"
        style={{ width: RENDER_WIDTH_PX }}
      >
        <Document
          file={file}
          onLoadSuccess={({ numPages: n }) => {
            setNumPages(n);
            setPages(Array.from({ length: n }, () => undefined));
          }}
          onLoadError={() => setError('Failed to load PDF. Is the file valid?')}
        >
          {numPages !== null &&
            Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i}
                pageNumber={i + 1}
                className={`pdf-page-${i + 1}`}
                width={RENDER_WIDTH_PX}
                onRenderSuccess={() => onPageRenderSuccess(i)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
        </Document>
      </div>
    ) : null;

  return {
    file,
    fileKind,
    numPages,
    pages,
    readyCount: pages.filter(Boolean).length,
    error,
    setSource,
    reset,
    hiddenHarness,
  };
}
