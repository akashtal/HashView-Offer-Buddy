import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './indiamart-theme.css';
import RootLayoutClient from '@/components/layout/RootLayoutClient';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Offer Buddy - Discover Local Deals Near You',
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
  authors: [{ name: 'Offer Buddy' }],
  openGraph: {
    title: 'Offer Buddy - Discover Local Deals Near You',
    description:
      'Find the best local deals and offers from nearby shops.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Database connection is handled lazily by API routes and server actions

  return (
    <html lang="en">
      <head>
        <link rel='stylesheet' href='https://cdn-uicons.flaticon.com/uicons-regular-rounded/css/uicons-regular-rounded.css' />
      </head>
      <body className={`${inter.variable} flex flex-col min-h-screen`}>
        <RootLayoutClient>{children}</RootLayoutClient>
      </body>
    </html>
  );
}

