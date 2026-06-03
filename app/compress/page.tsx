import type { Metadata } from 'next';
import { PdfCompressorLoader } from '../../components/pdf-compressor-loader';
import { SiteHeader } from '../../components/site-header';

export const metadata: Metadata = {
  title: 'Compress PDF — Free Online Compressor (No Upload)',
  description:
    'Shrink PDF files in your browser. Pick a compression level, download a smaller PDF. 100% client-side, no upload, no signup.',
  keywords: [
    'compress pdf',
    'reduce pdf size',
    'shrink pdf',
    'pdf compressor',
    'client side pdf',
    'no upload',
    'free pdf compressor',
  ],
  openGraph: {
    title: 'Compress PDF — Free Online Compressor',
    description:
      'Shrink PDF files in your browser. Pick a compression level and download. No upload, no signup.',
    type: 'website',
    url: '/compress',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compress PDF — Free Online Compressor',
    description:
      'Shrink PDF files in your browser. No upload, no signup.',
  },
};

export default function CompressPage() {
  return (
    <>
      <SiteHeader current="compress" />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pt-6 pb-12 text-center sm:pt-10 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Compress PDFs, in your browser.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg">
            Drop a PDF, pick how much you want to shrink it, and download a
            smaller file. Nothing is uploaded — compression happens entirely
            on your device.
          </p>
        </section>

        <PdfCompressorLoader />

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Drop your PDF"
            body="Pick a file from your device, or drag and drop it onto the page."
          />
          <Step
            number="2"
            title="Pick a level"
            body="Smart keeps your text as text and only shrinks the images inside. The other levels re-render every page — useful for scanned PDFs."
          />
          <Step
            number="3"
            title="Download"
            body="Get your compressed PDF with a side-by-side size comparison. The original never leaves your device."
          />
        </section>

        <section className="mt-24 rounded-3xl border border-black/10 p-8 dark:border-white/10 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why client-side?
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <Bullet title="Private by default">
              Your file never leaves your device. There&apos;s no server to send
              it to.
            </Bullet>
            <Bullet title="No signup, no watermark">
              No accounts, no email, no paid tiers, no logo stamped on your
              output.
            </Bullet>
            <Bullet title="Three presets">
              Light keeps things crisp, heavy squeezes out every byte. Pick the
              one that fits.
            </Bullet>
            <Bullet title="Works offline">
              After the first load, you can compress without an internet
              connection.
            </Bullet>
          </ul>
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FAQ
          </h2>
          <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
            <Faq q="Is my PDF uploaded anywhere?">
              No. The compressor runs in your browser using{' '}
              <a
                href="https://mozilla.github.io/pdf.js/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                pdf.js
              </a>{' '}
              and{' '}
              <a
                href="https://pdf-lib.js.org/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                pdf-lib
              </a>
              . The file stays on your device.
            </Faq>
            <Faq q="How does the compression work?">
              We try a sequence of passes powered by{' '}
              <a
                href="https://mupdf.com/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                mupdf
              </a>
              :
              <br />
              <br />
              <strong>1. Lossless.</strong> Re-save the PDF with object
              streams, deflate compression, and garbage collection. Text,
              images, and layout stay byte-for-byte equivalent.
              <br />
              <br />
              <strong>2. Images only.</strong> Strip the XMP metadata and
              accessibility tags, then walk every page, find the embedded
              image XObjects, and re-encode each one as a smaller JPEG.
              Images with an alpha mask (e.g. logos) are flattened onto white
              so JPEG can store them. Text and vector content are left
              untouched.
              <br />
              <br />
              <strong>3. Rasterize</strong> (only if you pick Light / Medium /
              Heavy). Re-render every page as a flat image. Text becomes part
              of the image and loses its selectability.
            </Faq>
            <Faq q="Will my text still be selectable?">
              Yes if Smart mode stops at pass 1 or 2 — those leave the text
              and vectors alone. If you pick Light, Medium, or Heavy (or if
              Smart has to fall all the way back to rasterize), text becomes
              part of the image and can no longer be selected or searched.
              The result screen tells you which method was used.
            </Faq>
            <Faq q="What if my PDF is already small?">
              If none of the passes can shrink it, the result screen will
              tell you the PDF is already as compressed as possible. The
              original is the smallest version.
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
