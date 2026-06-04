import * as mupdf from 'mupdf';
import { PDFDocument, degrees } from 'pdf-lib';

export type Rotation = 0 | 90 | 180 | 270;

export type BlankPage = {
  kind: 'blank';
  id: string;
  width: number;
  height: number;
};

export type PdfPageRef = {
  kind: 'pdf';
  id: string;
  sourceId: string;
  pageIndex: number;
  rotation: Rotation;
};

export type OrganizePage = PdfPageRef | BlankPage;

export type OrganizeInput = {
  pages: OrganizePage[];
  sources: Array<{ id: string; bytes: ArrayBuffer }>;
};

export type OrganizeProgress = (done: number, total: number) => void;

function ensureCopy(bytes: ArrayBuffer): Uint8Array {
  const source = new Uint8Array(bytes);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

export async function getOrganizePageCount(bytes: ArrayBuffer): Promise<number> {
  const sourceCopy = ensureCopy(bytes);
  const doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
  try {
    return doc.countPages();
  } finally {
    doc.destroy();
  }
}

export function getPageBounds(
  bytes: ArrayBuffer,
  pageIndex: number,
): { width: number; height: number } {
  const sourceCopy = ensureCopy(bytes);
  const doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
  try {
    const page = doc.loadPage(pageIndex);
    const bounds = page.getBounds();
    return { width: bounds[2] - bounds[0], height: bounds[3] - bounds[1] };
  } finally {
    doc.destroy();
  }
}

export async function renderPageThumbnail(
  bytes: ArrayBuffer,
  pageIndex: number,
  targetWidth: number,
): Promise<string> {
  const sourceCopy = ensureCopy(bytes);
  const doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
  try {
    const page = doc.loadPage(pageIndex);
    const bounds = page.getBounds();
    const pageWidth = bounds[2] - bounds[0];
    const scale = targetWidth / pageWidth;
    const matrix = mupdf.Matrix.scale(scale, scale);
    const pix = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false);
    try {
      const png = pix.asPNG();
      const copy = new Uint8Array(png.byteLength);
      copy.set(png);
      const blob = new Blob([copy as BlobPart], { type: 'image/png' });
      return URL.createObjectURL(blob);
    } finally {
      pix.destroy();
    }
  } finally {
    doc.destroy();
  }
}

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

export async function organizePdfs(
  input: OrganizeInput,
  onProgress?: OrganizeProgress,
): Promise<Blob> {
  const { pages, sources } = input;
  const sourceMap = new Map(sources.map((s) => [s.id, s.bytes]));
  const output = await PDFDocument.create();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    if (page.kind === 'blank') {
      const blank = output.addPage([page.width, page.height]);
      blank.setRotation(degrees(0));
    } else {
      const bytes = sourceMap.get(page.sourceId);
      if (!bytes) throw new Error(`Missing source for page ${i}.`);
      const sourceCopy = ensureCopy(bytes);
      const src = await PDFDocument.load(sourceCopy, { ignoreEncryption: true });
      const [copied] = await output.copyPages(src, [page.pageIndex]);
      if (page.rotation !== 0) {
        const current = copied.getRotation().angle;
        copied.setRotation(degrees((current + page.rotation) % 360));
      }
      output.addPage(copied);
    }
    onProgress?.(i + 1, pages.length);
  }

  const saved = await output.save();
  const copy = new Uint8Array(saved.byteLength);
  copy.set(saved);
  return new Blob([copy as BlobPart], { type: 'application/pdf' });
}

export const DEFAULT_BLANK_SIZE = { width: A4_WIDTH, height: A4_HEIGHT };
