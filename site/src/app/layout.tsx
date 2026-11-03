import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// The same vendored files as the app (copied by scripts/sync-shared.mjs), so the site and the app render type identically.
const hanken = localFont({
  src: [
    { path: '../fonts/HankenGrotesk-normal-400to800-latin.woff2', weight: '400 800', style: 'normal' },
    { path: '../fonts/HankenGrotesk-italic-400-latin.woff2', weight: '400', style: 'italic' },
  ],
  variable: '--font-hanken',
  display: 'swap',
});
const plex = localFont({
  src: [
    { path: '../fonts/IBMPlexMono-normal-500-latin.woff2', weight: '500', style: 'normal' },
    { path: '../fonts/IBMPlexMono-normal-600-latin.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-plex',
  display: 'swap',
});
const symbols = localFont({
  src: '../fonts/MaterialSymbolsRounded-subset.woff2',
  weight: '300 400',
  variable: '--font-symbols',
  display: 'block',
});

export const metadata: Metadata = {
  title: 'TenderScout · Public tenders you can actually win',
  description:
    'TenderScout reads every new EU public tender overnight, in any language, and tells a small firm whether it can bid: Go, Maybe or No-go, with the page that proves it. University prototype (ESCP); all companies and tenders are fictional.',
  applicationName: 'TenderScout',
  openGraph: {
    title: 'TenderScout · Public tenders you can actually win, read for you overnight',
    description: 'Go / Maybe / No-go for every new EU tender, with the sentence that proves it. University prototype with fictional data.',
    type: 'website',
    locale: 'en_GB',
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: '#02040A',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hanken.variable} ${plex.variable} ${symbols.variable}`}>
      <body>{children}</body>
    </html>
  );
}
