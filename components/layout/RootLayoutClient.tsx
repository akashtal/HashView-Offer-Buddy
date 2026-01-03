'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { LocationProvider } from '@/lib/LocationContext';

import { usePathname } from 'next/navigation';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/signin', '/signup'].includes(pathname);

  return (
    <LocationProvider>
      {!isAuthPage && <Header />}
      <main className="flex-1 pb-16 md:pb-0">{children}</main>
      {!isAuthPage && <Footer />}
      {!isAuthPage && <MobileBottomNav />}
    </LocationProvider>
  );
}

