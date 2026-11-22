import type { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import './globals.css';

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Saans: breathe easier through winter smog',
  description:
    'Live Indian AQI, a daily low-exposure plan for your family, indoor air hacks and cleaner commutes, with the impact of each choice shown.',
  applicationName: 'Saans',
  openGraph: {
    title: 'Saans: breathe easier through winter smog',
    description: 'A GenAI air quality assistant for Indian families.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1d2b36',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Reading headers makes every page dynamic, which the per-request CSP nonce needs.
  await headers();
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
