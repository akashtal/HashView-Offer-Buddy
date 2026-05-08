import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './indiamart-theme.css';
import RootLayoutClient from '@/components/layout/RootLayoutClient';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'offers buddy - Discover Local Deals Near You',
  description:
    'Find the best local deals and offers from nearby shops. Connect with local businesses and save money on products and services in your area.',
  keywords: [
    'local deals',
    'offers near me',
    'local shopping',
    'nearby shops',
    'discounts',
    'local business',
  ],
  authors: [{ name: 'offers buddy' }],
  openGraph: {
    title: 'offers buddy - Discover Local Deals Near You',
    description:
      'Find the best local deals and offers from nearby shops.',
    type: 'website',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Offers Buddy',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Database connection is handled lazily by API routes and server actions

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css' />
      </head>
      <body className={`${inter.variable} flex flex-col min-h-screen`} suppressHydrationWarning>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}

