import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { SITE_URL, withBase } from '@/lib/site';

// The same vendored files as the app (copied by scripts/sync-shared.mjs), so the site and the app render type identically.
const hanken = localFont({
  src: [{ path: '../fonts/HankenGrotesk-normal-400to800-latin.woff2', weight: '400 800', style: 'normal' }],
  variable: '--font-hanken',
  display: 'swap',
});
const symbols = localFont({
  src: '../fonts/MaterialSymbolsRounded-subset.woff2',
  weight: '300 400',
  variable: '--font-symbols',
  display: 'block',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'TenderScout · Public tenders you can actually win',
  description:
    'TenderScout reads every new EU public tender overnight, in any language, and tells a small firm whether it can bid: Go, Maybe or No-go, with the page that proves it. University prototype (ESCP): real decision rules and EU sector codes, fictional companies and tenders.',
  applicationName: 'TenderScout',
  alternates: { canonical: withBase('/') },
  openGraph: {
    title: 'TenderScout · Public tenders you can actually win, read for you overnight',
    description: 'Go / Maybe / No-go for every new EU tender, with the sentence that proves it. University prototype: real rules, fictional companies and tenders.',
    type: 'website',
    locale: 'en_GB',
    siteName: 'TenderScout',
    url: withBase('/'),
  },
  twitter: { card: 'summary_large_image', title: 'TenderScout · Public tenders you can actually win', description: 'Go / Maybe / No-go for every new EU tender, with the page that proves it. University prototype: real rules, fictional companies and tenders.' },
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
    <html lang="en" className={`${hanken.variable} ${symbols.variable}`}>
      <body>{children}</body>
    </html>
  );
}
