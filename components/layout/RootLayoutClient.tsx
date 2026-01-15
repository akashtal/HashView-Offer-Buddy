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
  const isChatPage = pathname.startsWith('/chat');

  return (
    <LocationProvider>
      {!isChatPage && <Header />}
      <main className={`flex-1 ${!isChatPage && 'pb-16 md:pb-0'}`}>{children}</main>
      {!isChatPage && <Footer />}
      {!isChatPage && <MobileBottomNav />}
    </LocationProvider>
  );
}

