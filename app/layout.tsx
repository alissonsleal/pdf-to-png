import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pdf-to-png.vercel.app'),
  title: 'PDF to PNG — Free Online Converter (No Upload)',
  description:
    'Convert PDF files to PNG images right in your browser. 100% client-side, no upload, no signup, no watermark. Works offline after first load.',
  keywords: [
    'pdf to png',
    'pdf to image',
    'convert pdf',
    'pdf converter',
    'client side pdf',
    'no upload',
    'free pdf to png',
  ],
  openGraph: {
    title: 'PDF to PNG — Free Online Converter',
    description:
      'Convert PDF files to PNG images in your browser. No upload, no signup, no watermark.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to PNG — Free Online Converter',
    description:
      'Convert PDF files to PNG images in your browser. No upload, no signup, no watermark.',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#181a1b' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
