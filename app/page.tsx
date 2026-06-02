import { PdfConverterLoader } from './PdfConverterLoader';

export default function Page() {
  return (
    <>
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span
            aria-hidden
            className="inline-block h-6 w-6 rounded-md bg-[#f44]"
          />
          PDF to PNG
        </a>
        <a
          href="https://github.com/Alissonsleal/pdf-to-png"
          target="_blank"
          rel="noreferrer"
          className="text-sm opacity-70 transition-opacity hover:opacity-100"
        >
          GitHub
        </a>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <section className="pt-6 pb-12 text-center sm:pt-10 sm:pb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            PDF to PNG, in your browser.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base opacity-70 sm:text-lg">
            Drop a PDF and get a PNG for every page. Nothing is uploaded —
            conversion happens entirely on your device.
          </p>
        </section>

        <PdfConverterLoader />

        <section className="mt-24 grid gap-8 sm:grid-cols-3">
          <Step
            number="1"
            title="Drop your PDF"
            body="Pick a file from your device, or drag and drop it onto the page."
          />
          <Step
            number="2"
            title="We render the pages"
            body="Each page is rasterised to a high-resolution PNG in your browser."
          />
          <Step
            number="3"
            title="Download"
            body="Save pages one by one, or grab the whole set as a zip."
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
            <Bullet title="Works offline">
              After the first load, you can convert without an internet
              connection.
            </Bullet>
            <Bullet title="Open source">
              The whole thing is a few hundred lines of code on GitHub. Audit it
              yourself.
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
                href="https://mozilla.github.io/pdf.js/"
                className="underline"
                target="_blank"
                rel="noreferrer"
              >
                pdf.js
              </a>
              . The file stays on your device.
            </Faq>
            <Faq q="Is there a file size limit?">
              The only limit is your device&apos;s memory. Big PDFs (hundreds of
              pages, or pages with many images) will be slower.
            </Faq>
            <Faq q="What resolution do the PNGs come out at?">
              Pages are rendered at a fixed width of 1024 pixels, which is a
              good balance between sharpness and file size.
            </Faq>
            <Faq q="Can I convert images too?">
              Yes. If you upload a regular image file, you can re-download it
              directly without any conversion.
            </Faq>
            <Faq q="Why is it free?">
              It&apos;s a small open-source project. There are no servers to
              pay for because all the work happens on your device.
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
