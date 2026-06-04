import type { Metadata } from 'next';
import { PdfOrganizerLoader } from '../../components/pdf-organizer-loader';
import { SiteHeader } from '../../components/site-header';

export const metadata: Metadata = {
  title: 'Organize PDF — Sort, Add and Delete Pages (No Upload)',
  description:
    'Sort pages of your PDF in any order, add blank pages, rotate or delete individual pages, and merge more PDFs into the same document. 100% client-side, no upload, no signup.',
  keywords: [
    'organize pdf',
    'sort pdf pages',
    'reorder pdf',
    'pdf organizer',
    'add blank page pdf',
    'rotate pdf page',
    'delete pdf page',
    'client side pdf',
    'no upload',
    'free pdf organizer',
  ],
  openGraph: {
    title: 'Organize PDF — Sort, Add and Delete Pages',
    description:
      'Drag page thumbnails to sort, rotate or delete them, add blank pages, and keep adding more PDFs. No upload, no signup.',
    type: 'website',
    url: '/organize',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organize PDF — Sort, Add and Delete Pages',
    description:
      'Drag, sort, rotate, delete and add pages in your browser. No upload, no signup.',
  },
};

export default function OrganizePage() {
  return (
    <>
      <SiteHeader current="organize" />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pt-6 pb-12 text-center sm:pt-10 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Organize PDF, in your browser.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg">
            Sort, add and delete PDF pages. Drag and drop the page thumbnails
            and sort them in our PDF organizer — then download the result.
            Nothing is uploaded, it all happens on your device.
          </p>
        </section>

        <PdfOrganizerLoader />

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Add your PDFs"
            body="Pick one or more files, or drag and drop them onto the page. You can keep adding more PDFs at any time."
          />
          <Step
            number="2"
            title="Reorder, rotate, delete"
            body="Drag thumbnails to sort pages. Use the red icons on each card to rotate, insert a blank page, or delete."
          />
          <Step
            number="3"
            title="Download"
            body="Click build. The new PDF is generated in your browser and offered as a download — no server involved."
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
            <Bullet title="Mix and match">
              Drop several PDFs and the organizer treats them as a single
              sequence — perfect for stitching chapters from different files.
            </Bullet>
            <Bullet title="Original quality">
              Pages are copied directly from the source. Text, images, and
              forms are preserved exactly.
            </Bullet>
          </ul>
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FAQ
          </h2>
          <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
            <Faq q="Are my PDFs uploaded anywhere?">
              No. The organizer runs in your browser using{' '}
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
            <Faq q="Can I add blank pages?">
              Yes. Use the red rotate menu on any thumbnail to insert a blank
              page before or after it. Blank pages inherit the size of the
              page next to them (or A4 if you start from scratch).
            </Faq>
            <Faq q="Does rotating a page change the original PDF?">
              No. Rotations are stored as part of the new PDF being built.
              Your source files are never modified.
            </Faq>
            <Faq q="What about encrypted PDFs?">
              The organizer tries to read encrypted PDFs in compatibility mode.
              Files with a real password will be skipped with an error message.
            </Faq>
            <Faq q="How does sorting work?">
              The ascending / descending buttons reorder pages by their
              original page number, grouped by the file they came from. Use
              drag and drop to fine-tune.
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
