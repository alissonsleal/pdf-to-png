import * as mupdf from 'mupdf';
import {
  AlignmentType,
  Document,
  Header,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';

type MupdfImage = InstanceType<typeof mupdf.Image>;
type MupdfPage = InstanceType<typeof mupdf.Page>;
type MupdfStructuredText = InstanceType<typeof mupdf.StructuredText>;

export type ConvertProgress = (done: number, total: number) => void;

export type ConvertResult = {
  blob: Blob;
  pageCount: number;
  fileName: string;
};

type BBox = { x: number; y: number; w: number; h: number };

type RawFont = {
  name: string;
  family: string;
  weight: string;
  style: string;
  size: number;
};

type RawLine = {
  bbox: BBox;
  font: RawFont;
  text: string;
  wmode: number;
  x: number;
  y: number;
};

type RawBlock = {
  type: 'text';
  bbox: BBox;
  lines: RawLine[];
};

type ImageItem = {
  bbox: BBox;
  data: Uint8Array;
  format: 'png' | 'jpg';
};

type PageData = {
  pageIndex: number;
  pageWidth: number;
  pageHeight: number;
  yFlipped: boolean;
  blocks: RawBlock[];
  images: ImageItem[];
  headerRegion: BBox | null;
  bodyStartY: number;
  bodyXLeft: number;
  bodyXRight: number;
  tableRegions: TableRegion[];
};

type CommonHeader = {
  data: Uint8Array;
  format: 'png' | 'jpg';
  width: number;
  height: number;
};

type PageLineRef = {
  blockIdx: number;
  lineIdx: number;
  line: RawLine;
};

type TableRegion = {
  bbox: BBox;
  columnXs: number[];
  rows: PageLineRef[][];
};

type ResolvedTableCell = {
  bbox: BBox;
  lines: ResolvedLine[];
  alignment: 'left' | 'center' | 'right';
};

type ResolvedTableRow = {
  bbox: BBox;
  cells: ResolvedTableCell[];
};

type ResolvedTable = {
  bbox: BBox;
  columnXs: number[];
  columnWidths: number[];
  rows: ResolvedTableRow[];
};

type ResolvedLine = {
  text: string;
  fontName: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  bbox: BBox;
  baselineY: number;
};

type ResolvedRow = {
  bbox: BBox;
  lines: ResolvedLine[];
  isBullet: boolean;
};

type ResolvedParagraph = {
  bbox: BBox;
  rows: ResolvedRow[];
  text: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
  leftIndent: number;
  rightIndent: number;
  firstLineIndent: number;
  hangingIndent: number;
  isHeading: boolean;
  isListItem: boolean;
  headingLevel: 1 | 2 | 3;
  fontSize: number;
  bold: boolean;
};

const POINTS_TO_TWIPS = 20;
const POINTS_TO_EMU = 12700;
const POINTS_TO_PIXELS = 96 / 72;

function pointsToTwips(p: number): number {
  return Math.max(1, Math.round(p * POINTS_TO_TWIPS));
}

function pointsToEmu(p: number): number {
  return Math.max(1, Math.round(p * POINTS_TO_EMU));
}

function pointsToPixels(p: number): number {
  return Math.max(1, Math.round(p * POINTS_TO_PIXELS));
}

function halfPoints(p: number): number {
  return Math.max(8, Math.round(p * 2));
}

function ensureSourceCopy(bytes: ArrayBuffer): Uint8Array {
  const source = new Uint8Array(bytes);
  const copy = new Uint8Array(source.byteLength);
  copy.set(source);
  return copy;
}

export async function getPdfPageCount(bytes: ArrayBuffer): Promise<number> {
  const sourceCopy = ensureSourceCopy(bytes);
  const doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
  try {
    return doc.countPages();
  } finally {
    doc.destroy();
  }
}

function fontNameFromMupdf(name: string, family: string): string {
  const lower = (name || '').toLowerCase();
  if (lower.includes('symbol')) return 'Symbol';
  if (lower.includes('wingding')) return 'Wingdings';
  if (
    lower.includes('arial') ||
    lower.includes('helvetica') ||
    lower.includes('sans') ||
    lower.includes('bcdeee') ||
    lower.includes('bcdfee')
  ) {
    return 'Arial';
  }
  if (lower.includes('times')) return 'Times New Roman';
  if (lower.includes('courier')) return 'Courier New';
  if (lower.includes('georgia')) return 'Georgia';
  if (lower.includes('verdana')) return 'Verdana';
  if (name) return name;
  if (family === 'serif') return 'Times New Roman';
  if (family === 'sans-serif') return 'Arial';
  if (family === 'monospace') return 'Courier New';
  return 'Times New Roman';
}

function isBold(weight: string): boolean {
  return weight === 'bold' || weight === 'black' || weight === 'heavy';
}

function isItalic(style: string): boolean {
  return style === 'italic' || style === 'oblique';
}

function extractPageData(page: MupdfPage, pageIndex: number): PageData {
  const bounds = page.getBounds();
  const pageWidth = bounds[2] - bounds[0];
  const pageHeight = bounds[3] - bounds[1];
  const transform = (page as mupdf.PDFPage).getTransform();
  const yFlipped = transform[3] < 0;

  const stext = page.toStructuredText();

  const json = stext.asJSON(1.0);
  const data = JSON.parse(json) as { blocks?: RawBlock[] };

  const blocks: RawBlock[] = [];
  for (const raw of data.blocks ?? []) {
    if (raw.type !== 'text') continue;
    const lines: RawLine[] = [];
    for (const l of raw.lines ?? []) {
      const text = (l.text ?? '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      lines.push({
        bbox: l.bbox,
        font: l.font,
        text,
        wmode: l.wmode ?? 0,
        x: l.x ?? l.bbox.x,
        y: l.y ?? l.bbox.y + l.bbox.h,
      });
    }
    if (lines.length === 0) continue;
    const xs = lines.map((l) => l.bbox.x);
    const ys = lines.map((l) => l.bbox.y);
    const x2s = lines.map((l) => l.bbox.x + l.bbox.w);
    const y2s = lines.map((l) => l.bbox.y + l.bbox.h);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const bbox: BBox = {
      x: minX,
      y: minY,
      w: Math.max(...x2s) - minX,
      h: Math.max(...y2s) - minY,
    };
    blocks.push({ type: 'text', bbox, lines });
  }

  blocks.sort((a, b) => {
    if (Math.abs(a.bbox.y - b.bbox.y) > 2) return a.bbox.y - b.bbox.y;
    return a.bbox.x - b.bbox.x;
  });

  const images: ImageItem[] = [];
  stext.walk({
    onImageBlock: (rawBbox, _transform, image) => {
      try {
        let pix: InstanceType<typeof mupdf.Pixmap> | null = null;
        try {
          pix = image.toPixmap();
        } catch {
          return;
        }
        let bytes: Uint8Array;
        let format: 'png' | 'jpg';
        try {
          bytes = pix.asPNG();
          format = 'png';
        } catch {
          try {
            bytes = pix.asJPEG(85);
            format = 'jpg';
          } catch {
            pix.destroy();
            return;
          }
        }
        pix.destroy();
        const b = rawBbox as unknown as number[];
        const bbox: BBox = { x: b[0], y: b[1], w: b[2] - b[0], h: b[3] - b[1] };
        images.push({ bbox, data: bytes, format });
      } catch {
        // skip
      }
    },
  });

  const bodyXLeft =
    blocks.length > 0 ? Math.min(...blocks.map((b) => b.bbox.x)) : 0;
  const bodyXRight =
    blocks.length > 0
      ? Math.max(...blocks.map((b) => b.bbox.x + b.bbox.w))
      : pageWidth;

  return {
    pageIndex,
    pageWidth,
    pageHeight,
    yFlipped,
    blocks,
    images,
    headerRegion: null,
    bodyStartY: 0,
    bodyXLeft,
    bodyXRight,
    tableRegions: [],
  };
}

function detectHeaderRegion(pageData: PageData): void {
  const { blocks, pageHeight } = pageData;
  if (blocks.length < 2) return;

  const topRegion = pageHeight * 0.3;

  const blockHeights = blocks
    .map((b) => b.bbox.h)
    .filter((h) => h > 0)
    .sort((a, b) => a - b);
  if (blockHeights.length === 0) return;
  const medianHeight = blockHeights[Math.floor(blockHeights.length / 2)];

  const allGaps: number[] = [];
  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const cur = blocks[i];
    const gap = cur.bbox.y - (prev.bbox.y + prev.bbox.h);
    if (gap > 0) allGaps.push(gap);
  }
  if (allGaps.length === 0) return;
  allGaps.sort((a, b) => a - b);
  const medianGap = allGaps[Math.floor(allGaps.length / 2)];

  const gapThreshold = Math.max(medianHeight * 1.5, medianGap * 3, 14);

  for (let i = 1; i < blocks.length; i++) {
    const prev = blocks[i - 1];
    const cur = blocks[i];
    if (cur.bbox.y > topRegion) break;
    const gap = cur.bbox.y - (prev.bbox.y + prev.bbox.h);
    if (gap >= gapThreshold) {
      const headerEndY = prev.bbox.y + prev.bbox.h;
      pageData.headerRegion = {
        x: 0,
        y: 0,
        w: pageData.pageWidth,
        h: headerEndY,
      };
      pageData.bodyStartY = headerEndY;
      return;
    }
  }
}

function rasterizeHeaderRegion(
  page: MupdfPage,
  pageWidth: number,
  region: BBox,
  yFlipped: boolean,
): CommonHeader | null {
  const scale = 2;
  const matrix = mupdf.Matrix.scale(scale, scale);
  const colorspace = mupdf.ColorSpace.DeviceRGB;

  let pix: InstanceType<typeof mupdf.Pixmap>;
  try {
    pix = page.toPixmap(matrix, colorspace, false, false);
  } catch {
    return null;
  }

  const fullWidth = pix.getWidth();
  const fullHeight = pix.getHeight();
  const regionPixelH = Math.min(
    Math.ceil(region.h * scale),
    fullHeight,
  );

  let srcYStart: number;
  if (yFlipped) {
    srcYStart = 0;
  } else {
    srcYStart = fullHeight - regionPixelH;
  }

  const cropPix = new mupdf.Pixmap(
    colorspace,
    [0, 0, fullWidth, regionPixelH],
    false,
  );
  const srcPixels = pix.getPixels();
  const srcStride = pix.getStride();
  const dstPixels = cropPix.getPixels();
  const dstStride = cropPix.getStride();
  const n = pix.getNumberOfComponents();
  for (let py = 0; py < regionPixelH; py++) {
    const srcY = srcYStart + py;
    for (let px = 0; px < fullWidth; px++) {
      const sIdx = srcY * srcStride + px * n;
      const dIdx = py * dstStride + px * n;
      for (let c = 0; c < n; c++) {
        dstPixels[dIdx + c] = srcPixels[sIdx + c];
      }
    }
  }
  let bytes: Uint8Array;
  let format: 'png' | 'jpg';
  try {
    bytes = cropPix.asPNG();
    format = 'png';
  } catch {
    try {
      bytes = cropPix.asJPEG(90);
      format = 'jpg';
    } catch {
      cropPix.destroy();
      pix.destroy();
      return null;
    }
  }
  cropPix.destroy();
  pix.destroy();
  return {
    data: bytes,
    format,
    width: pageWidth,
    height: region.h,
  };
}

function detectTableRegions(blocks: RawBlock[]): TableRegion[] {
  const allLines: PageLineRef[] = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    for (let li = 0; li < block.lines.length; li++) {
      allLines.push({ blockIdx: bi, lineIdx: li, line: block.lines[li] });
    }
  }
  if (allLines.length === 0) return [];

  allLines.sort((a, b) => {
    const ya = a.line.bbox.y;
    const yb = b.line.bbox.y;
    if (Math.abs(ya - yb) > 2) return ya - yb;
    return a.line.bbox.x - b.line.bbox.x;
  });

  const ROW_BAND_SPACING = 10;
  const yBands: PageLineRef[][] = [];
  for (const pl of allLines) {
    const last = yBands[yBands.length - 1];
    if (last) {
      const lastBottom = Math.max(
        ...last.map((p) => p.line.bbox.y + p.line.bbox.h),
      );
      if (pl.line.bbox.y - lastBottom <= ROW_BAND_SPACING) {
        last.push(pl);
        continue;
      }
    }
    yBands.push([pl]);
  }

  const COLUMN_GAP_THRESHOLD = 30;
  const COLUMN_SPREAD_MIN = 30;
  const MIN_COLUMNS = 3;
  const nonFlowBands: { band: PageLineRef[]; top: number; bottom: number }[] =
    [];
  for (const band of yBands) {
    if (band.length < 2) continue;
    const xs = band.map((p) => p.line.bbox.x);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    if (maxX - minX < COLUMN_SPREAD_MIN) continue;

    const sortedXs = [
      ...new Set(xs.map((x) => Math.round(x))),
    ].sort((a, b) => a - b);
    let maxGap = 0;
    for (let i = 1; i < sortedXs.length; i++) {
      maxGap = Math.max(maxGap, sortedXs[i] - sortedXs[i - 1]);
    }
    if (maxGap < COLUMN_GAP_THRESHOLD) continue;

    const colClusters = clusterColumnXs(xs);
    if (colClusters.length < MIN_COLUMNS) continue;

    nonFlowBands.push({
      band,
      top: Math.min(...band.map((p) => p.line.bbox.y)),
      bottom: Math.max(
        ...band.map((p) => p.line.bbox.y + p.line.bbox.h),
      ),
    });
  }

  const gaps: number[] = [];
  for (let i = 1; i < nonFlowBands.length; i++) {
    const gap =
      nonFlowBands[i].top - nonFlowBands[i - 1].bottom;
    if (gap > 0) gaps.push(gap);
  }
  gaps.sort((a, b) => a - b);
  const medianGap =
    gaps.length > 0 ? gaps[Math.floor(gaps.length / 2)] : 0;
  const tableBandGap = Math.max(20, medianGap * 1.6);

  const regions: {
    bands: { band: PageLineRef[]; top: number; bottom: number }[];
    top: number;
    bottom: number;
  }[] = [];
  let current: typeof nonFlowBands | null = null;
  for (const nfb of nonFlowBands) {
    if (current === null) {
      current = [nfb];
      continue;
    }
    const last = current[current.length - 1];
    if (nfb.top - last.bottom <= tableBandGap) {
      current.push(nfb);
    } else {
      regions.push({
        bands: current,
        top: current[0].top,
        bottom: current[current.length - 1].bottom,
      });
      current = [nfb];
    }
  }
  if (current) {
    regions.push({
      bands: current,
      top: current[0].top,
      bottom: current[current.length - 1].bottom,
    });
  }

  return regions.map((r) => {
    const all = r.bands.flatMap((b) => b.band);
    const xs = all.map((p) => p.line.bbox.x);
    const xRights = all.map((p) => p.line.bbox.x + p.line.bbox.w);
    const columnXs = clusterColumnXs(xs);
    const rows: PageLineRef[][] = r.bands.map((b) =>
      [...b.band].sort((a, c) => a.line.bbox.x - c.line.bbox.x),
    );
    return {
      bbox: {
        x: Math.min(...xs),
        y: r.top,
        w: Math.max(...xRights) - Math.min(...xs),
        h: r.bottom - r.top,
      },
      columnXs,
      rows,
    };
  });
}

function clusterColumnXs(xs: number[]): number[] {
  if (xs.length === 0) return [];
  const CLUSTER_TOL = 25;
  const sorted = [...new Set(xs.map((x) => Math.round(x)))].sort(
    (a, b) => a - b,
  );
  const clusters: number[][] = [[sorted[0]]];
  for (let i = 1; i < sorted.length; i++) {
    const last = clusters[clusters.length - 1];
    if (sorted[i] - last[last.length - 1] <= CLUSTER_TOL) {
      last.push(sorted[i]);
    } else {
      clusters.push([sorted[i]]);
    }
  }
  return clusters.map((c) => c[Math.floor(c.length / 2)]);
}

function groupLinesIntoRows(blocks: RawBlock[]): ResolvedRow[] {
  const rows: ResolvedRow[] = [];

  for (const block of blocks) {
    for (const line of block.lines) {
      const trimmedText = line.text.trim();
      const isBulletChar = /^[•·●○◦▪▫–—]$/.test(trimmedText);
      rows.push({
        bbox: line.bbox,
        lines: [
          {
            text: line.text,
            fontName: fontNameFromMupdf(line.font.name, line.font.family),
            fontSize: line.font.size,
            bold: isBold(line.font.weight),
            italic: isItalic(line.font.style),
            bbox: line.bbox,
            baselineY: line.y,
          },
        ],
        isBullet: isBulletChar,
      });
    }
  }

  if (rows.length === 0) return rows;

  rows.sort((a, b) => {
    if (Math.abs(a.bbox.y - b.bbox.y) > 2) return a.bbox.y - b.bbox.y;
    return a.bbox.x - b.bbox.x;
  });

  const merged: ResolvedRow[] = [];
  for (const row of rows) {
    const last = merged[merged.length - 1];
    if (
      last &&
      Math.abs(last.bbox.y - row.bbox.y) <= 2 &&
      Math.abs(last.bbox.h - row.bbox.h) <= 2
    ) {
      const x2 = Math.max(last.bbox.x + last.bbox.w, row.bbox.x + row.bbox.w);
      const x1 = Math.min(last.bbox.x, row.bbox.x);
      const y1 = Math.min(last.bbox.y, row.bbox.y);
      const y2 = Math.max(last.bbox.y + last.bbox.h, row.bbox.y + row.bbox.h);
      last.bbox = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
      const rowLinesSorted = [...row.lines].sort(
        (a, b) => a.bbox.x - b.bbox.x,
      );
      const lastLinesSorted = [...last.lines].sort(
        (a, b) => a.bbox.x - b.bbox.x,
      );
      const newLines: ResolvedLine[] = [];
      let i = 0;
      let j = 0;
      while (i < lastLinesSorted.length && j < rowLinesSorted.length) {
        const a = lastLinesSorted[i];
        const b = rowLinesSorted[j];
        if (a.bbox.x < b.bbox.x) {
          newLines.push(a);
          i++;
        } else {
          newLines.push(b);
          j++;
        }
      }
      while (i < lastLinesSorted.length) {
        newLines.push(lastLinesSorted[i]);
        i++;
      }
      while (j < rowLinesSorted.length) {
        newLines.push(rowLinesSorted[j]);
        j++;
      }
      last.lines = newLines;
      last.isBullet = last.isBullet || row.isBullet;
    } else {
      merged.push({ ...row });
    }
  }

  for (const row of merged) {
    row.lines.sort((a, b) => a.bbox.x - b.bbox.x);
    const combined = row.lines
      .map((l, i) => {
        if (i === 0) return l.text;
        const prev = row.lines[i - 1];
        const gap = l.bbox.x - (prev.bbox.x + prev.bbox.w);
        if (gap > l.fontSize * 0.3) return ' ' + l.text;
        if (
          l.text.length > 0 &&
          prev.text.length > 0 &&
          !prev.text.endsWith(' ') &&
          !l.text.startsWith(' ') &&
          gap > 0
        ) {
          return ' ' + l.text;
        }
        return l.text;
      })
      .join('');
    row.lines = [
      {
        text: combined,
        fontName: row.lines[0].fontName,
        fontSize: row.lines[0].fontSize,
        bold: row.lines.some((l) => l.bold),
        italic: row.lines.every((l) => l.italic) && row.lines.length > 0,
        bbox: row.bbox,
        baselineY: row.lines[0].baselineY,
      },
    ];
  }

  return merged;
}

const NUMBERED_HEADING = /^\d+(\.\d+)*\.?$/;
const SECTION_NUMBER_PREFIX = /^\d+(\.\d+)*\.?\s+\S/;

function groupRowsIntoParagraphs(
  rows: ResolvedRow[],
  bodyXLeft: number,
  bodyXRight: number,
): ResolvedParagraph[] {
  if (rows.length === 0) return [];

  const avgHeight =
    rows.reduce((s, r) => s + r.bbox.h, 0) / rows.length;
  const lineSpacing = Math.max(2, avgHeight * 0.5);
  const xChangeThreshold = Math.max(8, avgHeight * 0.5);

  const splitIndices: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = rows[i - 1];
    const cur = rows[i];
    const gap = cur.bbox.y - (prev.bbox.y + prev.bbox.h);
    const xChange = Math.abs(cur.bbox.x - prev.bbox.x);
    if (
      prev.isBullet ||
      cur.isBullet ||
      gap > lineSpacing * 1.8 ||
      xChange > xChangeThreshold
    ) {
      splitIndices.push(i);
    }
  }

  const groups: ResolvedRow[][] = [];
  let start = 0;
  for (const idx of splitIndices) {
    groups.push(rows.slice(start, idx));
    start = idx;
  }
  groups.push(rows.slice(start));

  const paragraphs: ResolvedParagraph[] = groups
    .filter((g) => g.length > 0)
    .map((g) => analyzeParagraphGroup(g, bodyXLeft, bodyXRight));

  const merged: ResolvedParagraph[] = [];
  for (const p of paragraphs) {
    const last = merged[merged.length - 1];
    if (
      last &&
      !last.isHeading &&
      !p.isHeading &&
      !last.isListItem &&
      !p.isListItem &&
      last.rows.length === 1 &&
      p.rows.length === 1 &&
      last.rows[0].lines[0].fontSize === p.rows[0].lines[0].fontSize &&
      last.alignment === p.alignment &&
      last.alignment === 'left' &&
      Math.abs(last.bbox.x - p.bbox.x) < 1 &&
      Math.abs(last.bbox.x + last.bbox.w - (p.bbox.x + p.bbox.w)) < 3 &&
      p.rows[0].bbox.y -
        (last.rows[last.rows.length - 1].bbox.y +
          last.rows[last.rows.length - 1].bbox.h) <
        lineSpacing * 0.5
    ) {
      const firstText = last.rows[0].lines[0].text.trim();
      const lastText = last.rows[last.rows.length - 1].lines[0].text.trim();
      const curText = p.rows[0].lines[0].text.trim();
      if (
        NUMBERED_HEADING.test(firstText) &&
        p.rows[0].lines[0].bold
      ) {
        last.rows[last.rows.length - 1].lines[0].text =
          lastText + ' ' + curText;
        last.text = last.rows.map((r) => r.lines[0].text).join(' ');
        const x1 = Math.min(last.bbox.x, p.bbox.x);
        const y1 = Math.min(last.bbox.y, p.bbox.y);
        const x2 = Math.max(last.bbox.x + last.bbox.w, p.bbox.x + p.bbox.w);
        const y2 = Math.max(
          last.bbox.y + last.bbox.h,
          p.bbox.y + p.bbox.h,
        );
        last.bbox = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
        continue;
      }
    }
    merged.push(p);
  }

  return merged;
}

function analyzeParagraphGroup(
  rows: ResolvedRow[],
  bodyXLeft: number,
  bodyXRight: number,
): ResolvedParagraph {
  const xLefts = rows.map((r) => r.bbox.x);
  const xRights = rows.map((r) => r.bbox.x + r.bbox.w);
  const yTops = rows.map((r) => r.bbox.y);
  const yBottoms = rows.map((r) => r.bbox.y + r.bbox.h);
  const bbox: BBox = {
    x: Math.min(...xLefts),
    y: Math.min(...yTops),
    w: Math.max(...xRights) - Math.min(...xLefts),
    h: Math.max(...yBottoms) - Math.min(...yTops),
  };
  const leftIndent = Math.max(0, Math.min(...xLefts) - bodyXLeft);
  const minXRight = Math.max(...xRights);

  const firstLineIndent = Math.max(0, rows[0].bbox.x - bodyXLeft - leftIndent);
  const lastLineIndent = Math.max(
    0,
    rows[rows.length - 1].bbox.x - bodyXLeft - leftIndent,
  );
  const hangingIndent = Math.max(0, firstLineIndent - lastLineIndent);

  const centers = rows.map((r) => r.bbox.x + r.bbox.w / 2);
  const widths = rows.map((r) => r.bbox.w);
  const avgCenter =
    centers.reduce((a, b) => a + b, 0) / centers.length;
  const bodyCenter = bodyXLeft + (bodyXRight - bodyXLeft) / 2;
  const centerSpread = Math.max(...centers) - Math.min(...centers);
  const widthSpread = Math.max(...widths) - Math.min(...widths);

  const leftAlignedAtMargin =
    rows[0].bbox.x <= bodyXLeft + 2;
  const rightAlignedAtMargin =
    minXRight >= bodyXRight - 2;

  const isCentered =
    !leftAlignedAtMargin &&
    Math.abs(avgCenter - bodyCenter) < 10 &&
    centerSpread < 8;

  const isFullyJustified =
    rows.length >= 3 &&
    !isCentered &&
    widthSpread < 2 &&
    Math.abs(rows[rows.length - 1].bbox.x - rows[0].bbox.x) < 2 &&
    Math.abs(
      rows[rows.length - 1].bbox.x +
        rows[rows.length - 1].bbox.w -
        (rows[0].bbox.x + rows[0].bbox.w),
    ) < 4;

  const isRightAligned =
    !isCentered &&
    !isFullyJustified &&
    rows.length === 1 &&
    rows[0].bbox.x > bodyXLeft + (bodyXRight - bodyXLeft) * 0.5;

  let alignment: ResolvedParagraph['alignment'] = 'left';
  if (isCentered) alignment = 'center';
  else if (isFullyJustified) alignment = 'justify';
  else if (isRightAligned) alignment = 'right';

  const line = rows[0].lines[0];
  const text = rows.map((r) => r.lines[0].text).join(' ').trim();
  const isListItem = rows.some((r) => r.isBullet) || /^[•·●○◦▪▫]/.test(text);

  const fontSize = line.fontSize;
  const allBold = rows.every((r) => r.lines[0].bold);
  const anyBold = rows.some((r) => r.lines[0].bold);
  const isShort = rows.length === 1 && text.length < 100;
  const isLarge = fontSize >= 12;
  const isHuge = fontSize >= 18;

  const isNumberedHeading =
    rows.length === 1 &&
    /^\d+(\.\d+)*\.?\s+\S/.test(text) &&
    (allBold ||
      (isLarge && anyBold) ||
      (text.match(/\./g) ?? []).length >= 2);

  const isStandaloneNumber =
    rows.length === 1 &&
    NUMBERED_HEADING.test(text) &&
    anyBold;

  let isHeading = false;
  let headingLevel: 1 | 2 | 3 = 3;
  if (isNumberedHeading) {
    isHeading = true;
    const depth = (text.match(/\./g) ?? []).length;
    if (depth >= 2) headingLevel = 3;
    else if (depth === 1) headingLevel = 2;
    else headingLevel = 1;
  } else if (
    isShort &&
    isLarge &&
    allBold &&
    !SECTION_NUMBER_PREFIX.test(text)
  ) {
    isHeading = true;
    headingLevel = isHuge ? 1 : 2;
  } else if (isStandaloneNumber) {
    isHeading = true;
    headingLevel = 3;
  }

  return {
    bbox,
    rows,
    text,
    alignment,
    leftIndent,
    rightIndent: 0,
    firstLineIndent,
    hangingIndent,
    isHeading,
    isListItem,
    headingLevel,
    fontSize,
    bold: anyBold,
  };
}

function stripLeadingBullet(text: string): string {
  return text
    .replace(/^[•·●○◦▪▫–—]\s*/, '')
    .replace(/^[•·●○◦▪▫–—]/, '')
    .trim();
}

function resolvedLineToTextRun(line: ResolvedLine): TextRun {
  return new TextRun({
    text: line.text,
    font: line.fontName,
    size: halfPoints(line.fontSize),
    bold: line.bold || undefined,
    italics: line.italic || undefined,
  });
}

function paragraphToDocx(para: ResolvedParagraph): Paragraph {
  const runs: TextRun[] = [];

  if (para.isListItem) {
    const stripped = stripLeadingBullet(para.text);
    runs.push(
      new TextRun({
        text: `•\t${stripped}`,
        font: 'Arial',
        size: halfPoints(para.fontSize),
      }),
    );
  } else {
    for (let i = 0; i < para.rows.length; i++) {
      const row = para.rows[i];
      if (i > 0) {
        runs.push(new TextRun({ text: '', break: 1 }));
      }
      runs.push(resolvedLineToTextRun(row.lines[0]));
    }
  }

  if (runs.length === 0) {
    runs.push(new TextRun({ text: '' }));
  }

  let alignment:
    | (typeof AlignmentType)[keyof typeof AlignmentType]
    | undefined;
  if (para.alignment === 'center') alignment = AlignmentType.CENTER;
  else if (para.alignment === 'right') alignment = AlignmentType.RIGHT;
  else if (para.alignment === 'justify') alignment = AlignmentType.JUSTIFIED;

  let indent:
    | { left?: number; hanging?: number; firstLine?: number }
    | undefined;
  if (alignment === undefined) {
    if (
      para.leftIndent > 1 ||
      para.firstLineIndent > 1 ||
      para.hangingIndent > 1
    ) {
      indent = {};
      if (para.leftIndent > 1) {
        indent.left = pointsToTwips(para.leftIndent);
      }
      if (para.hangingIndent > 1) {
        indent.hanging = pointsToTwips(para.hangingIndent);
        indent.firstLine = 0;
      } else if (para.firstLineIndent > 1) {
        indent.firstLine = pointsToTwips(para.firstLineIndent);
      }
    }
  }

  if (para.isHeading) {
    return new Paragraph({
      children: runs,
      alignment,
      indent,
      heading:
        para.headingLevel === 1
          ? HeadingLevel.HEADING_1
          : para.headingLevel === 2
            ? HeadingLevel.HEADING_2
            : HeadingLevel.HEADING_3,
    });
  }

  return new Paragraph({
    children: runs,
    alignment,
    indent,
  });
}

function buildHeaderImageRun(header: CommonHeader): ImageRun {
  return new ImageRun({
    type: header.format,
    data: header.data,
    transformation: {
      width: pointsToPixels(header.width),
      height: pointsToPixels(header.height),
    },
  });
}

function assignColumn(lineX: number, columnXs: number[]): number {
  if (columnXs.length === 0) return 0;
  let bestIdx = 0;
  let bestDist = Math.abs(lineX - columnXs[0]);
  for (let i = 1; i < columnXs.length; i++) {
    const d = Math.abs(lineX - columnXs[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

function buildResolvedTable(
  region: TableRegion,
  maxTotalWidth: number | null = null,
): ResolvedTable {
  const { columnXs, rows } = region;
  const numCols = columnXs.length;

  const MIN_COL_WIDTH_PT = 50;
  const columnWidths: number[] = new Array(numCols);
  for (let i = 0; i < numCols; i++) {
    let naturalWidth: number;
    if (i < numCols - 1) {
      naturalWidth = columnXs[i + 1] - columnXs[i];
    } else {
      const allRightEdges = rows
        .flat()
        .filter((p) => assignColumn(p.line.bbox.x, columnXs) === i)
        .map((p) => p.line.bbox.x + p.line.bbox.w);
      const rightEdge =
        allRightEdges.length > 0
          ? Math.max(...allRightEdges)
          : columnXs[i] + 40;
      naturalWidth = rightEdge - columnXs[i];
    }
    const colLines = rows
      .flat()
      .filter((p) => assignColumn(p.line.bbox.x, columnXs) === i);
    let textBasedMin = 0;
    if (colLines.length > 0) {
      const maxTextLen = Math.max(
        ...colLines.map((p) => p.line.text.length),
      );
      const avgFontSize =
        colLines.reduce((s, p) => s + p.line.font.size, 0) /
        colLines.length;
      textBasedMin = maxTextLen * avgFontSize * 0.55;
    }
    columnWidths[i] = Math.max(
      MIN_COL_WIDTH_PT,
      naturalWidth,
      textBasedMin,
    );
  }

  if (maxTotalWidth !== null) {
    const totalWidth = columnWidths.reduce((s, w) => s + w, 0);
    if (totalWidth > maxTotalWidth) {
      const scale = maxTotalWidth / totalWidth;
      for (let i = 0; i < columnWidths.length; i++) {
        columnWidths[i] *= scale;
      }
    }
  }

  const resolvedRows: ResolvedTableRow[] = rows.map((rowRefs) => {
    const cells: RawLine[][] = Array.from({ length: numCols }, () => []);
    for (const ref of rowRefs) {
      const colIdx = assignColumn(ref.line.bbox.x, columnXs);
      cells[colIdx].push(ref.line);
    }
    const resolvedCells: ResolvedTableCell[] = cells.map((cellLines, ci) => {
      if (cellLines.length === 0) {
        return {
          bbox: { x: columnXs[ci], y: rowRefs[0].line.bbox.y, w: 0, h: 0 },
          lines: [],
          alignment: 'left',
        };
      }
      const resolvedLines: ResolvedLine[] = cellLines.map((cl) => ({
        text: cl.text,
        fontName: fontNameFromMupdf(cl.font.name, cl.font.family),
        fontSize: cl.font.size,
        bold: isBold(cl.font.weight),
        italic: isItalic(cl.font.style),
        bbox: cl.bbox,
        baselineY: cl.y,
      }));
      const xs = cellLines.map((cl) => cl.bbox.x);
      const ys = cellLines.map((cl) => cl.bbox.y);
      const x2s = cellLines.map((cl) => cl.bbox.x + cl.bbox.w);
      const y2s = cellLines.map((cl) => cl.bbox.y + cl.bbox.h);
      const bbox: BBox = {
        x: Math.min(...xs),
        y: Math.min(...ys),
        w: Math.max(...x2s) - Math.min(...xs),
        h: Math.max(...y2s) - Math.min(...ys),
      };
      const colCenter = columnXs[ci] + columnWidths[ci] / 2;
      const lineCenter = bbox.x + bbox.w / 2;
      const dist = Math.abs(lineCenter - colCenter);
      const alignment: 'left' | 'center' | 'right' =
        dist < columnWidths[ci] * 0.15 ? 'center' : 'left';
      return { bbox, lines: resolvedLines, alignment };
    });
    const xLefts = resolvedCells.map((c) => c.bbox.x);
    const xRights = resolvedCells.map((c) => c.bbox.x + c.bbox.w);
    const yTops = resolvedCells.map((c) => c.bbox.y);
    const yBottoms = resolvedCells.map((c) => c.bbox.y + c.bbox.h);
    const rowBbox: BBox = {
      x: Math.min(...xLefts),
      y: Math.min(...yTops),
      w: Math.max(...xRights) - Math.min(...xLefts),
      h: Math.max(...yBottoms) - Math.min(...yTops),
    };
    return { bbox: rowBbox, cells: resolvedCells };
  });

  return {
    bbox: region.bbox,
    columnXs,
    columnWidths,
    rows: resolvedRows,
  };
}

function tableToDocx(table: ResolvedTable): Table {
  const cellMargins = {
    marginUnitType: WidthType.DXA,
    top: 40,
    bottom: 40,
    left: 60,
    right: 60,
  };

  const docxRows: TableRow[] = table.rows.map((row) => {
    const docxCells: TableCell[] = row.cells.map((cell, ci) => {
      if (cell.lines.length === 0) {
        return new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: '' })] })],
          width: { size: pointsToTwips(table.columnWidths[ci]), type: WidthType.DXA },
          margins: cellMargins,
        });
      }
      const lines = [...cell.lines].sort((a, b) => a.bbox.y - b.bbox.y);
      const cellChildren: (TextRun | { break?: number })[] = [];
      lines.forEach((line, li) => {
        if (li > 0) {
          cellChildren.push(new TextRun({ text: '', break: 1 }));
        }
        cellChildren.push(
          new TextRun({
            text: line.text,
            font: line.fontName,
            size: halfPoints(line.fontSize),
            bold: line.bold || undefined,
            italics: line.italic || undefined,
          }),
        );
      });
      const cellPara = new Paragraph({
        alignment:
          cell.alignment === 'center'
            ? AlignmentType.CENTER
            : cell.alignment === 'right'
              ? AlignmentType.RIGHT
              : AlignmentType.LEFT,
        children: cellChildren as TextRun[],
      });
      return new TableCell({
        children: [cellPara],
        width: { size: pointsToTwips(table.columnWidths[ci]), type: WidthType.DXA },
        margins: cellMargins,
      });
    });
    return new TableRow({ children: docxCells });
  });

  const totalWidth = table.columnWidths.reduce((s, w) => s + w, 0);

  return new Table({
    rows: docxRows,
    width: { size: pointsToTwips(totalWidth), type: WidthType.DXA },
    columnWidths: table.columnWidths.map((w) => pointsToTwips(w)),
    borders: {
      top: { style: 'nil', size: 0 },
      bottom: { style: 'nil', size: 0 },
      left: { style: 'nil', size: 0 },
      right: { style: 'nil', size: 0 },
      insideHorizontal: { style: 'nil', size: 0 },
      insideVertical: { style: 'nil', size: 0 },
    },
  });
}

export async function pdfToDocx(
  file: File,
  onProgress?: ConvertProgress,
): Promise<ConvertResult> {
  const sourceBytes = new Uint8Array(await file.arrayBuffer());
  const sourceCopy = ensureSourceCopy(sourceBytes.buffer as ArrayBuffer);

  const doc = mupdf.Document.openDocument(sourceCopy, 'application/pdf');
  const pageCount = doc.countPages();
  const pageDataList: PageData[] = [];

  try {
    for (let i = 0; i < pageCount; i++) {
      const page = doc.loadPage(i);
      try {
        const pd = extractPageData(page, i);
        detectHeaderRegion(pd);
        pageDataList.push(pd);
      } finally {
        page.destroy();
      }
      onProgress?.(i + 1, pageCount);
    }
  } catch (err) {
    doc.destroy();
    throw err;
  }

  const commonHeader: CommonHeader | null = (() => {
    const withRegion = pageDataList.filter((p) => p.headerRegion);
    if (withRegion.length < Math.max(1, Math.floor(pageCount / 2))) {
      return null;
    }
    const avgH =
      withRegion.reduce((s, p) => s + (p.headerRegion?.h ?? 0), 0) /
      withRegion.length;
    const consistent = withRegion.every(
      (p) => Math.abs((p.headerRegion?.h ?? 0) - avgH) < 5,
    );
    if (!consistent) return null;
    if (pageDataList[0].images.length > 0) {
      const topImage = pageDataList[0].images.reduce((top, img) =>
        img.bbox.y < top.bbox.y ? img : top,
      );
      return {
        data: topImage.data,
        format: topImage.format,
        width: pageDataList[0].pageWidth,
        height: topImage.bbox.h,
      };
    }
    const firstPage = doc.loadPage(0);
    try {
      return rasterizeHeaderRegion(
        firstPage,
        pageDataList[0].pageWidth,
        withRegion[0].headerRegion!,
        pageDataList[0].yFlipped,
      );
    } finally {
      firstPage.destroy();
    }
  })();

  doc.destroy();

  const sections: import('docx').ISectionOptions[] = [];
  for (const pd of pageDataList) {
    const bodyFilteredBlocks =
      pd.bodyStartY > 0
        ? pd.blocks.filter((b) => b.bbox.y >= pd.bodyStartY - 0.5)
        : pd.blocks;

    const tableRegions = detectTableRegions(bodyFilteredBlocks);
    const tableLineKeys = new Set<string>();
    for (const region of tableRegions) {
      for (const row of region.rows) {
        for (const ref of row) {
          tableLineKeys.add(`${ref.blockIdx}:${ref.lineIdx}`);
        }
      }
    }

    const nonTableBlocks: RawBlock[] = [];
    for (let bi = 0; bi < bodyFilteredBlocks.length; bi++) {
      const block = bodyFilteredBlocks[bi];
      const keptLines = block.lines.filter(
        (_, li) => !tableLineKeys.has(`${bi}:${li}`),
      );
      if (keptLines.length === 0) continue;
      const xs = keptLines.map((l) => l.bbox.x);
      const ys = keptLines.map((l) => l.bbox.y);
      const x2s = keptLines.map((l) => l.bbox.x + l.bbox.w);
      const y2s = keptLines.map((l) => l.bbox.y + l.bbox.h);
      nonTableBlocks.push({
        type: 'text',
        bbox: {
          x: Math.min(...xs),
          y: Math.min(...ys),
          w: Math.max(...x2s) - Math.min(...xs),
          h: Math.max(...y2s) - Math.min(...ys),
        },
        lines: keptLines,
      });
    }

    const rows = groupLinesIntoRows(nonTableBlocks);
    const paragraphs = groupRowsIntoParagraphs(
      rows,
      pd.bodyXLeft,
      pd.bodyXRight,
    );

    type PageItem =
      | { kind: 'paragraph'; y: number; item: Paragraph }
      | { kind: 'table'; y: number; item: Table };
    const pageItems: PageItem[] = [];
    for (const para of paragraphs) {
      pageItems.push({
        kind: 'paragraph',
        y: para.bbox.y,
        item: paragraphToDocx(para),
      });
    }
    for (const t of tableRegions) {
      const bodyWidth = Math.max(20, pd.bodyXRight - pd.bodyXLeft);
      pageItems.push({
        kind: 'table',
        y: t.bbox.y,
        item: tableToDocx(buildResolvedTable(t, bodyWidth)),
      });
    }
    pageItems.sort((a, b) => a.y - b.y);

    const docxChildren: (Paragraph | Table)[] = pageItems.map((it) => it.item);

    const marginLeft = pointsToTwips(pd.bodyXLeft);
    const marginRight = pointsToTwips(
      Math.max(0, pd.pageWidth - pd.bodyXRight),
    );
    const marginTop = commonHeader
      ? Math.ceil(pointsToTwips(commonHeader.height)) + 200
      : Math.max(marginLeft, 1134);
    const marginBottom = Math.max(marginLeft, 1134);

    const headers: { default?: Header } = {};
    if (commonHeader) {
      headers.default = new Header({
        children: [
          new Paragraph({
            children: [buildHeaderImageRun(commonHeader)],
          }),
        ],
      });
    }

    sections.push({
      properties: {
        page: {
          size: {
            width: pointsToTwips(pd.pageWidth),
            height: pointsToTwips(pd.pageHeight),
          },
          margin: {
            top: marginTop,
            right: marginRight,
            bottom: marginBottom,
            left: marginLeft,
            header: 0,
            footer: 0,
          },
        },
      },
      headers,
      children:
        docxChildren.length > 0
          ? docxChildren
          : [new Paragraph({ children: [new TextRun({ text: '' })] })],
    });
  }

  const docx = new Document({
    creator: 'PDF to Word',
    title: file.name.replace(/\.[^.]+$/, ''),
    sections,
  });

  const buffer = await Packer.toBlob(docx);
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'document';
  return {
    blob: buffer,
    pageCount,
    fileName: `${baseName}.docx`,
  };
}
