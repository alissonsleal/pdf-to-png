import type { Metadata } from 'next';
import { PdfToWordLoader } from '../../components/pdf-to-word-loader';
import { SiteHeader } from '../../components/site-header';

export const metadata: Metadata = {
  title: 'PDF to Word — Free Online Converter (No Upload)',
  description:
    'Convert PDF files to editable Word (.docx) documents in your browser. 100% client-side, no upload, no signup, no watermark.',
  keywords: [
    'pdf to word',
    'pdf to docx',
    'convert pdf to word',
    'pdf to word converter',
    'client side pdf',
    'no upload',
    'free pdf to word',
  ],
  openGraph: {
    title: 'PDF to Word — Free Online Converter',
    description:
      'Convert PDF files to editable Word documents in your browser. No upload, no signup, no watermark.',
    type: 'website',
    url: '/word',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to Word — Free Online Converter',
    description:
      'Convert PDF files to Word in your browser. No upload, no signup.',
  },
};

export default function WordPage() {
  return (
    <>
      <SiteHeader current="word" />

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pt-6 pb-12 text-center sm:pt-10 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            PDF to Word, in your browser.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg">
            Drop a PDF and get an editable Word (.docx) file. Nothing is
            uploaded — conversion happens entirely on your device.
          </p>
        </section>

        <PdfToWordLoader />

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Drop your PDF"
            body="Pick a file from your device, or drag and drop it onto the page."
          />
          <Step
            number="2"
            title="We rebuild the layout"
            body="Every page is read with mupdf — text is placed at its exact position, fonts, sizes, colors, bold, italic, and images are carried over into Word."
          />
          <Step
            number="3"
            title="Download the .docx"
            body="Open it in Word, Google Docs, or LibreOffice and keep editing. The original PDF never leaves your device."
          />
        </section>

        <section className="mt-24 rounded-3xl border border-black/10 p-8 dark:border-white/10 sm:p-12">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Why client-side?
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2">
            <Bullet title="Layout preserved">
              Each page keeps its original size. Text sits where it sat in the
              PDF — same line, same position, same styling.
            </Bullet>
            <Bullet title="Editable output">
              The result is a real .docx file with text you can copy, search,
              and reformat in any word processor.
            </Bullet>
            <Bullet title="Images carried over">
              Embedded images are extracted and dropped back into the document
              at their original positions.
            </Bullet>
            <Bullet title="Private by default">
              Your file never leaves your device. There&apos;s no server to send
              it to, no signup, and no watermark.
            </Bullet>
          </ul>
        </section>

        <section className="mt-24">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            FAQ
          </h2>
          <div className="mt-6 divide-y divide-black/10 dark:divide-white/10">
            <Faq q="Is my PDF uploaded anywhere?">
              No. The conversion runs in your browser using{' '}
              <a
                href="https://mupdf.com/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                mupdf
              </a>{' '}
              and{' '}
              <a
                href="https://docx.js.org/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                docx
              </a>
              . The file stays on your device.
            </Faq>
            <Faq q="Will the formatting be preserved exactly?">
              The page size, text position, fonts, font sizes, colors, bold,
              italic, and embedded images are all carried over. The output
              uses positioned text frames on each page, so lines and images
              end up where they were in the PDF. Backgrounds, complex
              vector shapes, and tables aren&apos;t reproduced.
            </Faq>
            <Faq q="What about scanned PDFs?">
              Scanned PDFs are images of pages, so there is no text to
              extract. This tool will produce a Word file with the
              embedded images but no recognizable text. You&apos;ll need an
              OCR tool for that.
            </Faq>
            <Faq q="Can I convert password-protected PDFs?">
              No. Password-protected files can&apos;t be read in the browser
              without their password, so the converter will show an error.
            </Faq>
            <Faq q="Will my .docx open in Word, Google Docs, and LibreOffice?">
              Yes. The file uses the standard Office Open XML format, so it
              opens in Microsoft Word, Google Docs, LibreOffice Writer, and
              any other app that reads .docx files.
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
