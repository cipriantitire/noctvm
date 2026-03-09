import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NOCTVM - The Living Memory of the Night",
  description: "Discover Bucharest's nightlife. Events, venues, and the pulse of the city after dark.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "NOCTVM",
    description: "The Living Memory of the Night",
    type: "website",
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
    <html lang="en" className="dark">
      <body className="font-body bg-noctvm-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
