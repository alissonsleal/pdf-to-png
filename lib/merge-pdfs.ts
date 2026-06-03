import { PDFDocument } from 'pdf-lib';

export type MergeInput = {
  bytes: ArrayBuffer;
};

export type MergeProgress = (done: number, total: number) => void;

export async function getPdfPageCount(bytes: ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

export async function mergePdfs(
  inputs: MergeInput[],
  onProgress?: MergeProgress,
): Promise<Blob> {
  const merged = await PDFDocument.create();
  for (let i = 0; i < inputs.length; i++) {
    const src = await PDFDocument.load(inputs[i].bytes, {
      ignoreEncryption: true,
    });
    const indices = src.getPageIndices();
    const pages = await merged.copyPages(src, indices);
    pages.forEach((p) => merged.addPage(p));
    onProgress?.(i + 1, inputs.length);
  }
  const bytes = await merged.save();
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: 'application/pdf' });
}
