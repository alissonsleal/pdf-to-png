import type { CompressionLevel } from '../lib/compress-pdf';

type Option = {
  key: CompressionLevel;
  title: string;
  description: string;
  badge: string;
  recommended?: boolean;
};

const OPTIONS: Option[] = [
  {
    key: 'smart',
    title: 'Smart',
    description:
      'Lossless first, then re-encodes only the images. Best for text-heavy PDFs with a few pictures.',
    badge: 'Recommended',
    recommended: true,
  },
  {
    key: 'light',
    title: 'Light',
    description:
      'Re-renders pages at high quality. Best for scanned PDFs or when text must stay crisp.',
    badge: '~144 DPI',
  },
  {
    key: 'medium',
    title: 'Medium',
    description:
      'Re-renders pages at a balanced resolution. Use when Smart cannot shrink the file.',
    badge: '~108 DPI',
  },
  {
    key: 'heavy',
    title: 'Heavy',
    description:
      'Re-renders pages at low resolution. Smallest output, but everything becomes an image.',
    badge: '~72 DPI',
  },
];

type Props = {
  value: CompressionLevel;
  onChange: (level: CompressionLevel) => void;
  disabled?: boolean;
};

export function QualitySelector({ value, onChange, disabled = false }: Props) {
  return (
    <fieldset
      disabled={disabled}
      className="grid gap-3 sm:grid-cols-2"
      aria-label="Compression level"
    >
      {OPTIONS.map((opt) => {
        const selected = opt.key === value;
        return (
          <label
            key={opt.key}
            className={`relative flex cursor-pointer flex-col gap-1 rounded-2xl border p-4 transition-colors ${
              selected
                ? 'border-[#f44] bg-[#f44]/5'
                : 'border-black/10 bg-black/[0.02] hover:border-black/20 dark:border-white/10 dark:bg-white/[0.02] dark:hover:border-white/20'
            }`}
          >
            <input
              type="radio"
              name="compression-level"
              value={opt.key}
              checked={selected}
              onChange={() => onChange(opt.key)}
              className="sr-only"
            />
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{opt.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  opt.recommended
                    ? 'bg-[#f44] text-white'
                    : 'bg-black/[0.06] tabular-nums dark:bg-white/[0.08]'
                }`}
              >
                {opt.badge}
              </span>
            </div>
            <p className="text-sm opacity-70">{opt.description}</p>
            {selected ? (
              <span
                aria-hidden
                className="absolute right-3 top-3 flex h-4 w-4 items-center justify-center rounded-full bg-[#f44] text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-2.5 w-2.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}
