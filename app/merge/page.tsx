import type { Metadata } from 'next';
import { PdfMergerLoader } from '../../components/pdf-merger-loader';
import { SiteHeader } from '../../components/site-header';

export const metadata: Metadata = {
  title: 'Merge PDFs — Free Online Combiner (No Upload)',
  description:
    'Combine PDF files in your browser. Reorder pages with drag and drop, merge unlimited PDFs, and download the result. 100% client-side, no upload, no signup.',
  keywords: [
    'merge pdf',
    'combine pdf',
    'pdf merger',
    'join pdf',
    'client side pdf',
    'no upload',
    'free pdf merge',
  ],
  openGraph: {
    title: 'Merge PDFs — Free Online Combiner',
    description:
      'Combine PDF files in your browser. Drag to reorder, merge unlimited PDFs, and download. No upload, no signup.',
    type: 'website',
    url: '/merge',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Merge PDFs — Free Online Combiner',
    description:
      'Combine PDF files in your browser. Drag to reorder, merge unlimited PDFs, and download. No upload, no signup.',
  },
};

export default function MergePage() {
  return (
    <>
      <SiteHeader current="merge" />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pt-6 pb-12 text-center sm:pt-10 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Merge PDFs, in your browser.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg">
            Combine as many PDFs as you need. Drag to reorder them, then
            download a single merged file. Nothing is uploaded — merging
            happens entirely on your device.
          </p>
        </section>

        <PdfMergerLoader />

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Add your PDFs"
            body="Pick the files from your device, or drag and drop them onto the page. Add as many as you need."
          />
          <Step
            number="2"
            title="Reorder"
            body="Drag the files to set the order they should appear in the merged PDF. Use the keyboard arrows if you prefer."
          />
          <Step
            number="3"
            title="Merge and download"
            body="Click merge. The combined file is produced in your browser and offered as a download — no server involved."
          />
        </section>

        <section className="mt-24 rounded-3xl border border-black/10 p-8 dark:border-white/10 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why client-side?
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <Bullet title="Private by default">
              Your files never leave your device. There&apos;s no server to
              send them to.
            </Bullet>
            <Bullet title="No signup, no watermark">
              No accounts, no email, no paid tiers, no logo stamped on your
              output.
            </Bullet>
            <Bullet title="Unlimited files">
              Add as many PDFs as your device can handle. The only limit is
              your available memory.
            </Bullet>
            <Bullet title="Original quality">
              Pages are copied directly — text, images, and forms are
              preserved exactly.
            </Bullet>
          </ul>
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FAQ
          </h2>
          <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
            <Faq q="Are my PDFs uploaded anywhere?">
              No. The merge runs in your browser using{' '}
              <a
                href="https://pdf-lib.js.org/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                pdf-lib
              </a>
              . The files stay on your device.
            </Faq>
            <Faq q="Is there a limit on how many PDFs I can merge?">
              No hard limit. The only constraint is your device&apos;s memory
              — the merger keeps each file in memory while building the
              result.
            </Faq>
            <Faq q="Is the order of pages preserved exactly?">
              Yes. The pages of each PDF are copied in their original order.
              Reordering only changes the order of the files themselves.
            </Faq>
            <Faq q="What about encrypted PDFs?">
              The merger tries to read encrypted PDFs in compatibility mode.
              Files with a real password will be skipped with an error
              message.
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
