'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import JSZip from 'jszip';
import { ActionBar } from './action-bar';
import { Dropzone } from './dropzone';
import { GlobalDropzone } from './global-dropzone';
import { ImageCard } from './image-card';
import { Lightbox } from './lightbox';
import { ResultsGrid } from './results-grid';
import {
  archiveName,
  baseNameFromFile,
  pageArchiveName,
} from '../lib/page-filename';
import { useSourcePages } from '../lib/use-source-pages';

export function PdfConverter() {
  const source = useSourcePages();
  const [isDragging, setIsDragging] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const f = event.target.files?.[0];
    if (f) source.setSource(f);
    event.target.value = '';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const f = event.dataTransfer.files?.[0];
    if (f) source.setSource(f);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.currentTarget === event.target) setIsDragging(false);
  };

  const handleReset = () => {
    source.reset();
    setLightboxIndex(null);
    setIsZipping(false);
  };

  const allReady =
    source.numPages !== null && source.readyCount === source.numPages;
  const baseName = baseNameFromFile(source.file);

  const downloadAll = async () => {
    if (!allReady) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      source.pages.forEach((p, i) => {
        if (p) zip.file(pageArchiveName(i), p.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = archiveName(baseName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  if (!source.file) {
    return (
      <Dropzone
        isDragging={isDragging}
        error={source.error}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onPick={() => inputRef.current?.click()}
        inputRef={inputRef}
        onInputChange={handleInputChange}
      />
    );
  }

  return (
    <GlobalDropzone
      show={!!source.file}
      onDrop={(files) => {
        const f = files[0];
        if (f) source.setSource(f);
      }}
    >
    <div>
      <ActionBar
        fileName={source.file.name}
        numPages={source.numPages}
        readyCount={source.readyCount}
        fileKind={source.fileKind}
        allReady={allReady}
        isZipping={isZipping}
        onDownloadAll={downloadAll}
        onReset={handleReset}
      />

      {source.fileKind === 'image' && source.pages[0] ? (
        <div className="mt-6 flex justify-center">
          <ImageCard
            url={source.pages[0].url}
            label={source.file.name}
            downloadName={source.file.name}
            onOpen={() => setLightboxIndex(0)}
            large
          />
        </div>
      ) : (
        <ResultsGrid
          numPages={source.numPages}
          pages={source.pages}
          baseName={baseName}
          onOpen={setLightboxIndex}
        />
      )}

      {source.hiddenHarness}

      {source.error && (
        <p className="mt-4 text-center text-sm text-red-500">{source.error}</p>
      )}

      {lightboxIndex !== null && (
        <Lightbox
          pages={source.pages}
          index={lightboxIndex}
          fileKind={source.fileKind}
          fileName={source.file.name}
          baseName={baseName}
          onClose={() => setLightboxIndex(null)}
          onIndexChange={setLightboxIndex}
        />
      )}
    </div>
    </GlobalDropzone>
  );
}
