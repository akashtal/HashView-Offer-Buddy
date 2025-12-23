'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMenu, FiX, FiMapPin, FiUser, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { useLocationStore } from '@/store/locationStore';
import Button from '@/components/ui/Button';

export default function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();
  const { city, address } = useLocationStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setUserMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="container-custom">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo-icon.png"
                alt="Offer Buddy"
                fill
                className="object-contain"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-2xl font-bold text-secondary">offer</span>
              <span className="text-2xl font-bold text-primary">buddy</span>
            </div>
          </Link>

          {/* Location */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <FiMapPin className="text-primary" />
            <div>
              <p className="font-medium text-secondary">
                {city || 'Select Location'}
              </p>
              {address && (
                <p className="text-xs text-gray-500 max-w-xs truncate">
                  {address}
                </p>
              )}
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/categories"
              className="text-secondary hover:text-primary font-medium transition-colors"
            >
              Categories
            </Link>
            <Link
              href="/vendors"
              className="text-secondary hover:text-primary font-medium transition-colors"
            >
              Shops
            </Link>
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-secondary hover:text-primary font-medium transition-colors"
                >
                  <FiUser />
                  <span>{user?.name}</span>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                    <Link
                      href={
                        user?.role === 'vendor'
                          ? '/vendor/dashboard'
                          : user?.role === 'admin'
                          ? '/admin/dashboard'
                          : '/profile'
                      }
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <FiSettings size={16} />
                      <span>Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left text-red-600"
                    >
                      <FiLogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2"
          >
            {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col gap-4">
              <Link
                href="/categories"
                className="text-secondary hover:text-primary font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Categories
              </Link>
              <Link
                href="/vendors"
                className="text-secondary hover:text-primary font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Shops
              </Link>
              
              {isAuthenticated ? (
                <>
                  <Link
                    href={
                      user?.role === 'vendor'
                        ? '/vendor/dashboard'
                        : user?.role === 'admin'
                        ? '/admin/dashboard'
                        : '/profile'
                    }
                    className="text-secondary hover:text-primary font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-red-600 hover:text-red-700 font-medium transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" size="sm" fullWidth>
                      Login
                    </Button>
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" fullWidth>
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

