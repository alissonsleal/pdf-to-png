import type { Metadata } from 'next';
import { ImageToPdfLoader } from '../../components/image-to-pdf-loader';
import { SiteHeader } from '../../components/site-header';

export const metadata: Metadata = {
  title: 'Image to PDF — Free Online Converter (No Upload)',
  description:
    'Convert images (PNG, JPEG, WebP) to PDF in your browser. Combine multiple images into one PDF. 100% client-side, no upload, no signup.',
  keywords: [
    'image to pdf',
    'jpg to pdf',
    'png to pdf',
    'webp to pdf',
    'convert image to pdf',
    'images to pdf',
    'combine images to pdf',
    'client side',
    'no upload',
    'free image to pdf',
  ],
  openGraph: {
    title: 'Image to PDF — Free Online Converter',
    description:
      'Convert images to PDF in your browser. Combine multiple images into one PDF. No upload, no signup.',
    type: 'website',
    url: '/image-to-pdf',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Image to PDF — Free Online Converter',
    description: 'Convert images to PDF in your browser. No upload, no signup.',
  },
};

export default function ImageToPdfPage() {
  return (
    <>
      <SiteHeader current="image-to-pdf" />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pt-6 pb-12 text-center sm:pt-10 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Image to PDF, in your browser.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg">
            Drop your images — PNG, JPEG, WebP, and more — and get a PDF back.
            Combine several images into one document. Nothing is uploaded;
            conversion happens entirely on your device.
          </p>
        </section>

        <ImageToPdfLoader />

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Drop your images"
            body="Pick one or more images from your device, or drag and drop them onto the page."
          />
          <Step
            number="2"
            title="Arrange and convert"
            body="Review your images, remove any you don't want, then click create PDF."
          />
          <Step
            number="3"
            title="Download the PDF"
            body="Your images are each placed on their own page at full resolution. Nothing ever leaves your device."
          />
        </section>

        <section className="mt-24 rounded-3xl border border-black/10 p-8 dark:border-white/10 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why client-side?
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <Bullet title="Private by default">
              Your images never leave your device. There&apos;s no server to send
              them to, no signup, and no tracking.
            </Bullet>
            <Bullet title="Multiple formats supported">
              PNG, JPEG, WebP, BMP, GIF, and more. Non-PNG/JPEG formats are
              automatically converted to PNG before embedding.
            </Bullet>
            <Bullet title="Combine many images">
              Pick several images and they&apos;ll each become a page in a single
              PDF, in the order you selected them.
            </Bullet>
            <Bullet title="Full resolution preserved">
              Each image is placed at its original size on the PDF page. No
              compression, no quality loss.
            </Bullet>
          </ul>
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FAQ
          </h2>
          <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
            <Faq q="Are my images uploaded anywhere?">
              No. Everything runs in your browser using{' '}
              <a
                href="https://pdf-lib.js.org/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                pdf-lib
              </a>
              . Your files stay on your device.
            </Faq>
            <Faq q="What image formats are supported?">
              PNG and JPEG are embedded directly. All other formats (WebP, BMP,
              GIF, TIFF, etc.) are converted to PNG first in your browser, so
              they work too.
            </Faq>
            <Faq q="Can I add images one at a time?">
              Yes. Drop your first batch, then click &ldquo;Add more&rdquo; to
              append additional images before creating the PDF.
            </Faq>
            <Faq q="Will the images be compressed?">
              PNG and JPEG images are embedded as-is — no recompression, no
              quality loss. Other formats are converted to PNG losslessly.
            </Faq>
            <Faq q="Can I reorder the images?">
              Not yet. The order follows the order you select or drop the files.
              Drag-and-drop reordering is coming soon.
            </Faq>
            <Faq q="Is there a limit on how many images I can combine?">
              The only limit is your device&apos;s memory. Very large or
              numerous images may take longer to process.
            </Faq>
          </div>
        </section>
      </main>

      <footer className="mx-auto mt-24 w-full max-w-6xl px-4 pb-10 text-sm opacity-60 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-2 border-t border-black/10 pt-6 dark:border-white/10 sm:flex-row">
          <span>
            Built by{' '}
            <a
              href="https://x.com/alissonsleal"
              className="underline"
              target="_blank"
              rel="noreferrer"
            >
              Alisson Leal
            </a>
            .
          </span>
          <span>Runs entirely in your browser. No tracking.</span>
        </div>
      </footer>
    </>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f44] font-semibold text-white">
        {number}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1 opacity-70">{body}</p>
    </div>
  );
}

function Bullet({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="mt-1 h-5 w-5 flex-none text-[#f44]"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="opacity-70">{children}</p>
      </div>
    </li>
  );
}

function Faq({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <details className="group py-4">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium">
        {q}
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-5 w-5 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <p className="mt-2 opacity-70">{children}</p>
    </details>
  );
}
