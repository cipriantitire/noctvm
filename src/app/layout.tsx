import type { Metadata, Viewport } from "next";
import Providers from "./providers";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

export const dynamic = 'force-dynamic';
import "./globals.css";
import { JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

const freshid = localFont({
  src: [
    { path: '../../public/fonts/freshid/FreshidCondensed-ExtraLight.otf', weight: '200', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-ExtLtIta.otf',  weight: '200', style: 'italic' },
    { path: '../../public/fonts/freshid/FreshidCondensed-Light.otf',      weight: '300', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-LightItalic.otf',weight: '300', style: 'italic' },
    { path: '../../public/fonts/freshid/FreshidCondensed-Regular.otf',    weight: '400', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-RegIta.otf',     weight: '400', style: 'italic' },
    { path: '../../public/fonts/freshid/FreshidCondensed-Medium.otf',     weight: '500', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-MediumItalic.otf',weight: '500', style: 'italic' },
    { path: '../../public/fonts/freshid/FreshidCondensed-SemiBold.otf',   weight: '600', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-SemBdIta.otf',   weight: '600', style: 'italic' },
    { path: '../../public/fonts/freshid/FreshidCondensed-Bold.otf',       weight: '700', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-BoldItalic.otf', weight: '700', style: 'italic' },
    { path: '../../public/fonts/freshid/FreshidCondensed-ExtraBold.otf',  weight: '800', style: 'normal' },
    { path: '../../public/fonts/freshid/FreshidCondensed-ExtBdIta.otf',   weight: '800', style: 'italic' },
  ],
  variable: '--font-freshid',
  display: 'swap',
});

const satoshi = localFont({
  src: [
    { path: '../../public/fonts/satoshi/Satoshi-Light.woff2',      weight: '300', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Regular.woff2',    weight: '400', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Medium.woff2',     weight: '500', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Bold.woff2',       weight: '700', style: 'normal' },
    { path: '../../public/fonts/satoshi/Satoshi-Black.woff2',      weight: '900', style: 'normal' },
  ],
  variable: '--font-satoshi',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: "NOCTVM - The Living Memory of the Night",
  description: "Bucharest's premier nightlife platform. Curated events, underground venues, and the pure pulse of the city after dark.",
  manifest: "/manifest.json",
  metadataBase: new URL('https://www.noctvm.app'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "NOCTVM",
    description: "The Living Memory of the Night",
    url: 'https://www.noctvm.app',
    siteName: 'NOCTVM',
    images: [
      {
        url: '/images/og-preview.png',
        width: 1200,
        height: 630,
        alt: 'NOCTVM - The Living Memory of the Night',
      },
    ],
    locale: 'ro_RO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOCTVM',
    description: "The Living Memory of the Night",
    images: ['/images/og-preview.png'],
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${freshid.variable} ${satoshi.variable} ${jetbrainsMono.variable}`}>
      <head>
      </head>
      <body className="font-body bg-noctvm-black text-white min-h-screen relative isolate overflow-x-hidden">
        <div className="relative">
          <Providers>{children}</Providers>
        </div>
        
        {/* Global SVG Filters for Glassmorphism */}
        <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
          <defs>
            <filter id="glass-distortion" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.03 0.03"
                numOctaves="2"
                seed="92"
                result="noise"
              />
              <feGaussianBlur
                in="noise"
                stdDeviation="2"
                result="blurred"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="blurred"
                scale="93"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
            <filter id="glass-distortion-nav" x="0%" y="0%" width="100%" height="100%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.026 0.026"
                numOctaves="2"
                seed="92"
                result="noise"
              />
              <feGaussianBlur
                in="noise"
                stdDeviation="1.6"
                result="blurred"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="blurred"
                scale="78"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
