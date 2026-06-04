import { PDFDocument } from 'pdf-lib';
import { pdfjs } from 'react-pdf';
import * as mupdf from 'mupdf';

export type CompressionLevel = 'smart' | 'light' | 'medium' | 'heavy';

type LevelConfig = {
  scale: number;
  jpegQuality: number;
  imageQuality: number;
};

const LEVEL_CONFIG: Record<CompressionLevel, LevelConfig> = {
  smart: { scale: 0, jpegQuality: 0, imageQuality: 50 },
  light: { scale: 2.0, jpegQuality: 0.85, imageQuality: 85 },
  medium: { scale: 1.5, jpegQuality: 0.7, imageQuality: 70 },
  heavy: { scale: 1.0, jpegQuality: 0.5, imageQuality: 55 },
};

const SMART_TARGET_DPI = 150;
const SMART_DOWNSAMPLE_THRESHOLD_DPI = 170;

export type CompressMethod = 'lossless' | 'images-only' | 'hybrid' | 'rasterized';

export type CompressResult = {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  pageCount: number;
  method: CompressMethod;
  level: CompressionLevel;
};

export type CompressProgress =
  | { phase: 'optimizing' }
  | { phase: 'images'; done: number; total: number }
  | { phase: 'rasterize'; done: number; total: number };

function ensurePdfjsWorker() {
  if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }
}

async function getPdfPageCount(bytes: ArrayBuffer): Promise<number> {
  ensurePdfjsWorker();
  const task = pdfjs.getDocument({ data: bytes.slice(0) });
  const pdf = await task.promise;
  const count = pdf.numPages;
  pdf.destroy();
  return count;
}

export async function getCompressPageCount(file: File): Promise<number> {
  return getPdfPageCount(await file.arrayBuffer());
}

async function tryLosslessOptimize(
  file: File,
): Promise<{ blob: Blob; pageCount: number } | null> {
  try {
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    const sourceCopy = new Uint8Array(sourceBytes.byteLength);
    sourceCopy.set(sourceBytes);

    const doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
    const pageCount = doc.countPages();
    const pdfDoc = doc.asPDF();
    if (!pdfDoc) {
      doc.destroy();
      return null;
    }
    const optimized = pdfDoc.saveToBuffer('garbage=1,compress=yes,clean=yes');
    const bytes = optimized.asUint8Array();
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy as BlobPart], { type: 'application/pdf' });
    pdfDoc.destroy();
    return { blob, pageCount };
  } catch {
    return null;
  }
}

type MupdfImage = InstanceType<typeof mupdf.Image>;
type MupdfPixmap = InstanceType<typeof mupdf.Pixmap>;
type MupdfPDFObject = InstanceType<typeof mupdf.PDFObject>;
type MupdfPDFPage = InstanceType<typeof mupdf.PDFPage>;
type MupdfPDFDocument = InstanceType<typeof mupdf.PDFDocument>;

function stripMetadataAndStructure(pdfDoc: MupdfPDFDocument): void {
  const catalog = pdfDoc.getTrailer().get('Root');
  if (!catalog) return;
  if (catalog.get('Metadata')) catalog.delete('Metadata');
  if (catalog.get('MarkInfo')) catalog.delete('MarkInfo');
  if (catalog.get('StructTreeRoot')) catalog.delete('StructTreeRoot');
  const pageCount = pdfDoc.countPages();
  for (let i = 0; i < pageCount; i++) {
    const pageObj = pdfDoc.loadPage(i).getObject();
    if (pageObj.get('StructParents')) pageObj.delete('StructParents');
  }
}

type PageBounds = [number, number, number, number];

function getPageBounds(page: MupdfPDFPage): PageBounds | null {
  try {
    const bounds = page.getBounds();
    return [bounds[0], bounds[1], bounds[2], bounds[3]];
  } catch {
    // fall through
  }
  return null;
}

function collectImageXObjectsWithPages(
  pdfDoc: MupdfPDFDocument,
): Array<{ xobject: MupdfPDFObject; pageBounds: PageBounds | null }> {
  const result: Array<{ xobject: MupdfPDFObject; pageBounds: PageBounds | null }> = [];
  const pageCount = pdfDoc.countPages();
  for (let i = 0; i < pageCount; i++) {
    const page = pdfDoc.loadPage(i);
    const pageBounds = getPageBounds(page);
    const resources = page.getObject().get('Resources');
    if (resources && resources.isDictionary()) {
      const xobjects = resources.get('XObject');
      if (xobjects && xobjects.isDictionary()) {
        xobjects.forEach((raw) => {
          if (!raw.isStream()) return;
          const subtype = raw.get('Subtype');
          if (!subtype || subtype.asName() !== 'Image') return;
          result.push({ xobject: raw, pageBounds });
        });
      }
    }
  }
  return result;
}

type DownsampleDecision = {
  width: number;
  height: number;
  downsample: boolean;
  effectiveDpi: number;
};

function computeDownsample(
  srcW: number,
  srcH: number,
  pageBounds: PageBounds,
): DownsampleDecision {
  const pageW = pageBounds[2] - pageBounds[0];
  const pageH = pageBounds[3] - pageBounds[1];
  const dpiX = (srcW * 72) / pageW;
  const dpiY = (srcH * 72) / pageH;
  const effectiveDpi = Math.max(dpiX, dpiY);
  if (effectiveDpi <= SMART_DOWNSAMPLE_THRESHOLD_DPI) {
    return { width: srcW, height: srcH, downsample: false, effectiveDpi };
  }
  const ratio = SMART_TARGET_DPI / effectiveDpi;
  return {
    width: Math.max(1, Math.round(srcW * ratio)),
    height: Math.max(1, Math.round(srcH * ratio)),
    downsample: true,
    effectiveDpi,
  };
}

async function downsamplePixmapToJpeg(
  srcPix: MupdfPixmap,
  dstW: number,
  dstH: number,
  quality: number,
): Promise<Uint8Array> {
  const srcW = srcPix.getWidth();
  const srcH = srcPix.getHeight();
  const warped = srcPix.warp(
    [
      [0, 0],
      [srcW, 0],
      [srcW, srcH],
      [0, srcH],
    ],
    dstW,
    dstH,
  );
  try {
    return warped.asJPEG(quality);
  } finally {
    warped.destroy();
  }
}

function flattenAlphaOntoWhite(
  srcPix: MupdfPixmap,
): MupdfPixmap {
  const width = srcPix.getWidth();
  const height = srcPix.getHeight();
  const dstPix = new mupdf.Pixmap(
    mupdf.ColorSpace.DeviceRGB,
    [0, 0, width, height],
    false,
  );
  dstPix.clear(255);
  const srcPixels = srcPix.getPixels();
  const srcStride = srcPix.getStride();
  const dstPixels = dstPix.getPixels();
  const dstStride = dstPix.getStride();
  const n = srcPix.getNumberOfComponents();
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const sIdx = y * srcStride + x * n;
      const dIdx = y * dstStride + x * 3;
      const a = n > 3 ? srcPixels[sIdx + 3] : 255;
      const af = a / 255;
      dstPixels[dIdx] = srcPixels[sIdx] * af + 255 * (1 - af);
      dstPixels[dIdx + 1] = srcPixels[sIdx + 1] * af + 255 * (1 - af);
      dstPixels[dIdx + 2] = srcPixels[sIdx + 2] * af + 255 * (1 - af);
    }
  }
  return dstPix;
}

async function tryImagesOnlyOptimize(
  file: File,
  quality: number,
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; pageCount: number } | null> {
  let sourceCopy: Uint8Array | null = null;
  let doc: InstanceType<typeof mupdf.Document> | null = null;
  try {
    const sourceBytes = new Uint8Array(await file.arrayBuffer());
    sourceCopy = new Uint8Array(sourceBytes.byteLength);
    sourceCopy.set(sourceBytes);

    doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
    const pdfDoc = doc.asPDF();
    if (!pdfDoc) {
      doc.destroy();
      doc = null;
      return null;
    }
    const pageCount = doc.countPages();

    const imageInfos = collectImageXObjectsWithPages(pdfDoc);
    onProgress?.(0, imageInfos.length);

    let reencoded = 0;
    for (let i = 0; i < imageInfos.length; i++) {
      const { xobject, pageBounds } = imageInfos[i];
      let image: MupdfImage | null = null;
      let srcPix: MupdfPixmap | null = null;
      let opaquePix: MupdfPixmap | null = null;
      try {
        const lengthObj = xobject.get('Length');
        const originalSize = lengthObj ? lengthObj.asNumber() : 0;
        if (originalSize <= 256) {
          onProgress?.(i + 1, imageInfos.length);
          continue;
        }
        image = pdfDoc.loadImage(xobject);
        srcPix = image.toPixmap();
        opaquePix =
          srcPix.getAlpha() > 0 ? flattenAlphaOntoWhite(srcPix) : srcPix;

        const n = srcPix.getNumberOfComponents();
        const isGray = n === 1;
        const srcW = srcPix.getWidth();
        const srcH = srcPix.getHeight();

        let decision: DownsampleDecision = {
          width: srcW,
          height: srcH,
          downsample: false,
          effectiveDpi: 0,
        };
        if (pageBounds) {
          decision = computeDownsample(srcW, srcH, pageBounds);
        }

        let jpegBytes: Uint8Array;
        if (decision.downsample) {
          jpegBytes = await downsamplePixmapToJpeg(
            opaquePix,
            decision.width,
            decision.height,
            quality,
          );
        } else {
          jpegBytes = opaquePix.asJPEG(quality);
        }

        if (jpegBytes.byteLength < originalSize) {
          xobject.put('Filter', 'DCTDecode');
          xobject.put('DecodeParms', { Quality: quality });
          xobject.put('BitsPerComponent', 8);
          xobject.put('ColorSpace', isGray ? 'DeviceGray' : 'DeviceRGB');
          if (decision.downsample) {
            xobject.put('Width', decision.width);
            xobject.put('Height', decision.height);
          }
          if (xobject.get('SMask')) xobject.delete('SMask');
          xobject.writeRawStream(jpegBytes);
          reencoded++;
        }
      } catch {
        // skip
      } finally {
        if (opaquePix && opaquePix !== srcPix) opaquePix.destroy();
        if (srcPix) srcPix.destroy();
        if (image) image.destroy();
      }
      onProgress?.(i + 1, imageInfos.length);
    }

    if (reencoded === 0) {
      pdfDoc.destroy();
      doc = null;
      return null;
    }

    stripMetadataAndStructure(pdfDoc);
    const optimized = pdfDoc.saveToBuffer('garbage=1,compress=yes,clean=yes');
    const bytes = optimized.asUint8Array();
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy as BlobPart], { type: 'application/pdf' });
    pdfDoc.destroy();
    doc = null;
    return { blob, pageCount };
  } catch {
    if (doc) {
      try {
        doc.destroy();
      } catch {
        // ignore
      }
    }
    return null;
  }
}

async function rasterizePdf(
  file: File,
  level: CompressionLevel,
  onProgress?: (done: number, total: number) => void,
): Promise<{ blob: Blob; pageCount: number }> {
  const { scale, jpegQuality } = LEVEL_CONFIG[level];
  const sourceBytes = new Uint8Array(await file.arrayBuffer());

  ensurePdfjsWorker();
  const loadingTask = pdfjs.getDocument({ data: sourceBytes.buffer.slice(0) });
  const sourcePdf = await loadingTask.promise;
  const pageCount = sourcePdf.numPages;

  const output = await PDFDocument.create();
  output.setTitle(file.name.replace(/\.[^.]+$/, ''));

  for (let i = 1; i <= pageCount; i++) {
    const page = await sourcePdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({ canvas, viewport }).promise;

    const jpegBlob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to encode page as JPEG.'));
        },
        'image/jpeg',
        jpegQuality,
      );
    });
    const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
    canvas.width = 0;
    canvas.height = 0;

    const jpg = await output.embedJpg(jpegBytes);
    const pageWidth = baseViewport.width;
    const pageHeight = baseViewport.height;
    const newPage = output.addPage([pageWidth, pageHeight]);
    newPage.drawImage(jpg, { x: 0, y: 0, width: pageWidth, height: pageHeight });

    page.cleanup();
    onProgress?.(i, pageCount);
  }

  sourcePdf.destroy();

  const saved = await output.save();
  const copy = new Uint8Array(saved.byteLength);
  copy.set(saved);
  return {
    blob: new Blob([copy as BlobPart], { type: 'application/pdf' }),
    pageCount,
  };
}

async function pageHasImageDraw(page: pdfjs.PDFPageProxy): Promise<boolean> {
  try {
    const OPS = pdfjs.OPS;
    const opList = await page.getOperatorList();
    for (let j = 0; j < opList.fnArray.length; j++) {
      const op = opList.fnArray[j];
      if (
        op === OPS.paintImageXObject ||
        op === OPS.paintImageXObjectRepeat ||
        op === OPS.paintInlineImageXObject ||
        op === OPS.paintInlineImageXObjectGroup
      ) {
        return true;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

async function pageHasText(page: pdfjs.PDFPageProxy): Promise<boolean> {
  try {
    const text = await page.getTextContent();
    return text.items.length > 0;
  } catch {
    return false;
  }
}

async function compressHybridSmart(
  sourceBytes: Uint8Array,
  jpegQuality: number,
  targetDpi: number,
  onProgress?: (p: CompressProgress) => void,
): Promise<{ blob: Blob; pageCount: number } | null> {
  let sourcePdf: pdfjs.PDFDocumentProxy | null = null;
  let sourcePdfLib: PDFDocument | null = null;
  try {
    ensurePdfjsWorker();
    const buffer = sourceBytes.buffer.slice(
      sourceBytes.byteOffset,
      sourceBytes.byteOffset + sourceBytes.byteLength,
    ) as ArrayBuffer;
    const loadingTask = pdfjs.getDocument({ data: buffer });
    sourcePdf = await loadingTask.promise;
    const pageCount = sourcePdf.numPages;

    sourcePdfLib = await PDFDocument.load(sourceBytes);

    const output = await PDFDocument.create();
    const scale = targetDpi / 72;
    let imageOnlyPages = 0;

    for (let i = 1; i <= pageCount; i++) {
      const page = await sourcePdf.getPage(i);
      const hasText = await pageHasText(page);
      const isImageOnly = !hasText && (await pageHasImageDraw(page));

      if (isImageOnly) {
        imageOnlyPages++;
        const baseViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvas, viewport }).promise;
          const jpegBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (b) =>
                b ? resolve(b) : reject(new Error('Failed to encode page.')),
              'image/jpeg',
              jpegQuality,
            );
          });
          const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
          const jpg = await output.embedJpg(jpegBytes);
          const newPage = output.addPage([baseViewport.width, baseViewport.height]);
          newPage.drawImage(jpg, {
            x: 0,
            y: 0,
            width: baseViewport.width,
            height: baseViewport.height,
          });
          canvas.width = 0;
          canvas.height = 0;
        } else {
          const [copied] = await output.copyPages(sourcePdfLib, [i - 1]);
          output.addPage(copied);
        }
      } else {
        const [copied] = await output.copyPages(sourcePdfLib, [i - 1]);
        output.addPage(copied);
      }

      page.cleanup();
      onProgress?.({ phase: 'rasterize', done: i, total: pageCount });
    }

    if (imageOnlyPages === 0) {
      return null;
    }

    const saved = await output.save();
    const copy = new Uint8Array(saved.byteLength);
    copy.set(saved);
    return {
      blob: new Blob([copy as BlobPart], { type: 'application/pdf' }),
      pageCount,
    };
  } catch {
    return null;
  } finally {
    if (sourcePdf) {
      try {
        sourcePdf.destroy();
      } catch {
        // ignore
      }
    }
  }
}

export async function compressPdf(
  file: File,
  level: CompressionLevel,
  onProgress?: (p: CompressProgress) => void,
): Promise<CompressResult> {
  const originalSize = file.size;
  const config = LEVEL_CONFIG[level];

  onProgress?.({ phase: 'optimizing' });
  const lossless = await tryLosslessOptimize(file);
  const losslessHelped =
    lossless !== null && lossless.blob.size <= originalSize * 0.95;
  if (losslessHelped) {
    return {
      blob: lossless.blob,
      originalSize,
      compressedSize: lossless.blob.size,
      pageCount: lossless.pageCount,
      method: 'lossless',
      level,
    };
  }

  if (level === 'smart') {
    onProgress?.({ phase: 'images', done: 0, total: 0 });
    const imagesOnly = await tryImagesOnlyOptimize(
      file,
      config.imageQuality,
      (done, total) => onProgress?.({ phase: 'images', done, total }),
    );

    type SmartResult = {
      blob: Blob;
      compressedSize: number;
      pageCount: number;
      method: CompressMethod;
    };
    const imagesOnlyResult: SmartResult | null =
      imagesOnly && imagesOnly.blob.size < originalSize
        ? {
            blob: imagesOnly.blob,
            compressedSize: imagesOnly.blob.size,
            pageCount: imagesOnly.pageCount,
            method: 'images-only',
          }
        : null;

    let bestResult: SmartResult | null = imagesOnlyResult;
    if (
      !imagesOnlyResult ||
      imagesOnlyResult.compressedSize > originalSize * 0.7
    ) {
      onProgress?.({ phase: 'rasterize', done: 0, total: 0 });
      const sourceBytes = new Uint8Array(await file.arrayBuffer());
      const hybrid = await compressHybridSmart(
        sourceBytes,
        config.imageQuality / 100,
        SMART_TARGET_DPI,
        (p) => onProgress?.(p),
      );
      if (hybrid && hybrid.blob.size < originalSize) {
        const hybridResult: SmartResult = {
          blob: hybrid.blob,
          compressedSize: hybrid.blob.size,
          pageCount: hybrid.pageCount,
          method: 'hybrid',
        };
        if (
          !bestResult ||
          hybridResult.compressedSize < bestResult.compressedSize
        ) {
          bestResult = hybridResult;
        }
      }
    }

    if (bestResult) {
      return {
        blob: bestResult.blob,
        originalSize,
        compressedSize: bestResult.compressedSize,
        pageCount: bestResult.pageCount,
        method: bestResult.method,
        level,
      };
    }
    return {
      blob: new Blob([await file.arrayBuffer()], { type: 'application/pdf' }),
      originalSize,
      compressedSize: originalSize,
      pageCount: lossless?.pageCount ?? 0,
      method: 'lossless',
      level,
    };
  }

  const pageCount = await getPdfPageCount(await file.arrayBuffer());
  onProgress?.({ phase: 'rasterize', done: 0, total: pageCount });
  const rasterized = await rasterizePdf(file, level, (done, total) => {
    onProgress?.({ phase: 'rasterize', done, total });
  });

  return {
    blob: rasterized.blob,
    originalSize,
    compressedSize: rasterized.blob.size,
    pageCount: rasterized.pageCount,
    method: 'rasterized',
    level,
  };
}

export function compressionRatio(original: number, compressed: number): number {
  if (original <= 0) return 0;
  return Math.max(0, 1 - compressed / original);
}
