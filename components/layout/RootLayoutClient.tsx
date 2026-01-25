'use client';

import { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { LocationProvider } from '@/lib/LocationContext';

import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/signin', '/signup'].includes(pathname);
  const isChatPage = pathname.startsWith('/chat');
  const isAdminPage = pathname.startsWith('/admin');
  const { token, fetchUser } = useAuthStore();

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Validate token on mount
      fetchUser();
    }
  }, [token, fetchUser]);

  return (
    <LocationProvider>
      {!isAdminPage && <Header />}
      <main className={`flex-1 ${!isAdminPage && !isChatPage ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
      {!isAdminPage && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      {!isAdminPage && <MobileBottomNav />}
    </LocationProvider>
  );
}
