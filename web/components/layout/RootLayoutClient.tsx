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
import { useWebPush } from '@/hooks/useWebPush';

export default function RootLayoutClient({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = ['/signin', '/signup'].includes(pathname);
  const isChatPage = pathname.startsWith('/chat');
  const isAdminPage = pathname.startsWith('/admin');
  const { token, isAuthenticated, fetchUser } = useAuthStore();
  const { permission, registerAndSubscribe } = useWebPush(token);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Validate token on mount
      fetchUser();
    }
  }, [token, fetchUser]);

  // Removed the automatic useEffect call to registerAndSubscribe()
  // because mobile browsers block it without a user gesture.

  return (
    <LocationProvider>
      {!isAdminPage && <Header />}

      {/* Push Notification Banner for Mobile browsers */}
      {!isAdminPage && permission === 'default' && (
        <div className="bg-[#FFF8E7] border-b border-[#FDB913] px-4 py-3 flex justify-between items-center z-50 shadow-sm relative">
          <div className="flex-1 pr-4">
            <p className="text-sm font-semibold text-[#B45309]">Enable Notifications</p>
            <p className="text-xs text-gray-600 mt-0.5">Get instant alerts for the best local offers</p>
          </div>
          <button
            onClick={() => registerAndSubscribe()}
            className="whitespace-nowrap bg-[#FDB913] hover:bg-[#E5A600] text-black text-xs font-bold px-4 py-2 rounded-full transition-all active:scale-95 shadow-sm"
          >
            Enable Now
          </button>
        </div>
      )}

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
