'use client';

import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { PDFDocument } from 'pdf-lib';
import { GlobalDropzone } from './global-dropzone';
import { ImageToPdfDropzone } from './image-to-pdf-dropzone';
import { ImageToPdfResult } from './image-to-pdf-result';

type ImageItem = {
  id: string;
  file: File;
  preview: string;
};

type Status = 'idle' | 'converting' | 'done';

function isImageFile(file: File) {
  return file.type.startsWith('image/');
}

function readAsArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(blob);
  });
}

async function convertToPng(
  buffer: ArrayBuffer,
  mimeType: string,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        (pngBlob) => {
          URL.revokeObjectURL(url);
          if (pngBlob) {
            void readAsArrayBuffer(pngBlob).then((buf) =>
              resolve(new Uint8Array(buf)),
            );
          } else {
            reject(new Error('Failed to convert image to PNG'));
          }
        },
        'image/png',
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function ImageToPdf() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDropping, setIsDropping] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const lastDownloadUrl = useRef<string | null>(null);
  const idCounter = useRef(0);

  const resetDownload = useCallback(() => {
    if (lastDownloadUrl.current) {
      URL.revokeObjectURL(lastDownloadUrl.current);
      lastDownloadUrl.current = null;
    }
  }, []);

  const addFiles = useCallback(
    (fileList: FileList | File[]) => {
      const valid = Array.from(fileList).filter(isImageFile);
      if (valid.length === 0) {
        setError('Please choose an image file (PNG, JPEG, WebP, etc.).');
        return;
      }
      setError(null);
      setResultBlob(null);
      setStatus('idle');

      const newImages: ImageItem[] = valid.map((file) => ({
        id: String(++idCounter.current),
        file,
        preview: URL.createObjectURL(file),
      }));

      setImages((prev) => [...prev, ...newImages]);
    },
    [],
  );

  const removeImage = useCallback((id: string) => {
    setImages((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDropping(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDropping) setIsDropping(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.currentTarget === e.target) setIsDropping(false);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = '';
  };

  const startOver = useCallback(() => {
    resetDownload();
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
    setStatus('idle');
    setProgress({ done: 0, total: 0 });
    setResultBlob(null);
    setError(null);
  }, [resetDownload, images]);

  const handleConvert = useCallback(async () => {
    if (images.length === 0) return;
    setError(null);
    setStatus('converting');
    setProgress({ done: 0, total: images.length });

    try {
      const doc = await PDFDocument.create();

      for (let i = 0; i < images.length; i++) {
        const buffer = await readAsArrayBuffer(images[i].file);
        const bytes = new Uint8Array(buffer);
        const file = images[i].file;

        let image;
        if (file.type === 'image/png') {
          image = await doc.embedPng(bytes);
        } else if (
          file.type === 'image/jpeg' ||
          file.type === 'image/jpg'
        ) {
          image = await doc.embedJpg(bytes);
        } else {
          const pngBytes = await convertToPng(buffer, file.type);
          image = await doc.embedPng(pngBytes);
        }

        const page = doc.addPage([image.width, image.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: image.width,
          height: image.height,
        });

        setProgress({ done: i + 1, total: images.length });
      }

      const pdfBytes = await doc.save();
      const copy = new Uint8Array(pdfBytes.byteLength);
      copy.set(pdfBytes);
      const blob = new Blob([copy as BlobPart], { type: 'application/pdf' });

      resetDownload();
      setResultBlob(blob);
      setStatus('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('Failed to create PDF. Please try again.');
      setStatus('idle');
    }
  }, [images, resetDownload]);

  if (images.length === 0) {
    return (
      <ImageToPdfDropzone
        isDragging={isDropping}
        error={error}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPick={() => inputRef.current?.click()}
        inputRef={inputRef}
        onInputChange={handleInputChange}
      />
    );
  }

  const isConverting = status === 'converting';

  return (
    <GlobalDropzone
      show={images.length > 0}
      onDrop={(files) => addFiles(files)}
      label="Drop images to add"
    >
      {resultBlob && status === 'done' ? (
        <ImageToPdfResult
          blob={resultBlob}
          imageCount={images.length}
          onStartOver={startOver}
        />
      ) : (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-medium">
                {images.length}{' '}
                {images.length === 1 ? 'image' : 'images'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={isConverting}
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  Add more
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  disabled={isConverting}
                  className="rounded-lg border border-black/15 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:hover:bg-white/[0.06]"
                >
                  Start over
                </button>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4">
            {images.map((img) => (
              <div key={img.id} className="group relative">
                <div className="aspect-[3/4] overflow-hidden rounded-xl border border-black/10 bg-black/[0.02] dark:border-white/10 dark:bg-white/[0.02]">
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  disabled={isConverting}
                  className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100 disabled:opacity-0"
                  aria-label={`Remove ${img.file.name}`}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
                <p
                  className="mt-1 truncate text-xs opacity-60"
                  title={img.file.name}
                >
                  {img.file.name}
                </p>
              </div>
            ))}
          </div>

          {isConverting ? (
            <div
              className="mt-6 rounded-2xl border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]"
              role="status"
              aria-live="polite"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Creating PDF… {progress.done} / {progress.total}
                </span>
                <span className="tabular-nums opacity-60">
                  {progress.done} / {progress.total}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-black/[0.05] dark:bg-white/[0.05]">
                <div
                  className="h-full bg-[#f44] transition-all duration-300"
                  style={{
                    width:
                      progress.total > 0
                        ? `${(progress.done / progress.total) * 100}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          ) : null}

          {error ? (
            <p className="mt-3 text-sm text-red-500" role="alert">
              {error}
            </p>
          ) : null}

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={isConverting || images.length === 0}
              className="rounded-lg bg-[#f44] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[#f34] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Create PDF
            </button>
          </div>
        </div>
      )}
    </GlobalDropzone>
  );
}
