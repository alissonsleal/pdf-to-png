import Link from 'next/link';

type NavKey = 'convert' | 'merge' | 'compress' | 'word' | 'organize';

type Props = {
  current?: NavKey;
};

const navLinks: { key: NavKey; href: string; label: string }[] = [
  { key: 'merge', href: '/merge', label: 'Merge' },
  { key: 'convert', href: '/', label: 'Convert' },
  { key: 'organize', href: '/organize', label: 'Organize' },
  { key: 'compress', href: '/compress', label: 'Compress' },
  { key: 'word', href: '/word', label: 'Word' },
];

export function SiteHeader({ current = 'convert' }: Props) {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <Link
        href="/"
        className="flex items-center gap-2 font-semibold tracking-tight"
      >
        <span
          aria-hidden
          className="inline-block h-6 w-6 rounded-md bg-[#f44]"
        />
        PDF to PNG
      </Link>
      <nav className="flex items-center gap-4 text-sm sm:gap-6">
        {navLinks.map((link) => {
          const isCurrent = link.key === current;
          return (
            <Link
              key={link.key}
              href={link.href}
              aria-current={isCurrent ? 'page' : undefined}
              className={`transition-opacity ${
                isCurrent
                  ? 'font-medium opacity-100'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        <a
          href="https://github.com/Alissonsleal/pdf-to-png"
          target="_blank"
          rel="noreferrer"
          className="opacity-70 transition-opacity hover:opacity-100"
        >
          GitHub
        </a>
      </nav>
    </header>
  );
}
