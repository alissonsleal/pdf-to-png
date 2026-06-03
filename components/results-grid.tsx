import { ImageCard } from './image-card';
import type { PageImage } from '../lib/use-source-pages';
import { pageDownloadName } from '../lib/page-filename';

type Props = {
  numPages: number | null;
  pages: (PageImage | undefined)[];
  baseName: string;
  onOpen: (index: number) => void;
};

export function ResultsGrid({ numPages, pages, baseName, onOpen }: Props) {
  if (numPages === null) {
    return (
      <div className="mt-6 flex justify-center py-16">
        <div
          role="status"
          aria-label="Loading"
          className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#ff4444]"
        />
      </div>
    );
  }

  return (
    <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: numPages }, (_, i) => {
        const page = pages[i];
        const label = `Page ${i + 1}`;
        return (
          <li key={i}>
            <ImageCard
              url={page?.url}
              label={label}
              downloadName={pageDownloadName(baseName, i)}
              onOpen={() => onOpen(i)}
            />
          </li>
        );
      })}
    </ul>
  );
}
