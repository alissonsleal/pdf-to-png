export function pageArchiveName(index: number) {
  return `page-${index + 1}.png`;
}

export function pageDownloadName(baseName: string, index: number) {
  return `${baseName}-page-${index + 1}.png`;
}

export function archiveName(baseName: string) {
  return `${baseName}.zip`;
}

export function baseNameFromFile(file: { name: string } | null) {
  return file?.name.replace(/\.[^.]+$/, '') ?? 'pages';
}
