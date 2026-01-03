'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiUser, FiSearch, FiTag, FiHelpCircle, FiShoppingCart, FiChevronDown, FiBriefcase, FiGrid } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import LocationSearch from '@/components/ui/LocationSearch';

export default function Header() {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/');
    setUserMenuOpen(false);
  };

  return (
    <>
      {/* Desktop Header */}
      <header className="hidden md:block sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Left Section: Logo + Location */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="relative w-12 h-12">
                  <Image
                    src="/logo.jpeg"
                    alt="Offer Buddy"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <span className="text-xl font-bold text-secondary">offer</span>
                  <span className="text-xl font-bold text-primary">buddy</span>
                </div>
              </Link>

              {/* Location Search Component */}
              <LocationSearch className="min-w-[200px]" />
            </div>

            {/* Right Section: Navigation Links */}
            <nav className="flex items-center gap-8">
              {/* Categories */}
              <Link href="/categories" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                <FiGrid size={18} />
                <span className="text-sm font-medium">Categories</span>
              </Link>

              {/* Products */}
              <Link href="/products" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                <FiBriefcase size={18} />
                <span className="text-sm font-medium">Products</span>
              </Link>

              {/* Suppliers */}
              <Link href="/suppliers" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                <FiUser size={18} />
                <span className="text-sm font-medium">Suppliers</span>
              </Link>

              {/* Search */}
              <Link href="/products" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                <FiSearch size={18} />
                <span className="text-sm font-medium">Search</span>
              </Link>

              {/* Offers */}
              <Link href="/offers" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors relative">
                <FiTag size={18} />
                <span className="text-sm font-medium">Offers</span>
                <span className="absolute -top-1 -right-2 bg-primary text-secondary text-[9px] px-1.5 py-0.5 rounded font-bold">
                  NEW
                </span>
              </Link>

              {/* User Profile or Sign In */}
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors"
                  >
                    <FiUser size={18} />
                    <span className="text-sm font-medium">{user?.name}</span>
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
                      <Link
                        href={
                          user?.role === 'vendor'
                            ? '/vendor/dashboard'
                            : user?.role === 'admin'
                              ? '/admin/dashboard'
                              : '/profile'
                        }
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Dashboard
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link
                        href="/categories"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Categories
                      </Link>
                      <Link
                        href="/products"
                        className="block px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Products
                      </Link>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/signin" className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors">
                  <FiUser size={18} />
                  <span className="text-sm font-medium">Sign In</span>
                </Link>
              )}

            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-gradient-to-br from-secondary via-gray-900 to-secondary shadow-lg">
        <div className="px-4 py-4">
          {/* Top Bar: Location + User */}
          <div className="flex items-center justify-between mb-4">
            {/* Location Search - Mobile Version */}
            <div className="flex-1">
              <LocationSearch className="[&>button]:bg-transparent [&>button]:border-0 [&>button]:p-0 [&>button]:hover:bg-transparent [&>button]:text-white [&_span]:text-white [&_svg]:text-primary" />
            </div>
            <div className="hidden md:flex items-center gap-2">
              <Link href={isAuthenticated ? "/profile" : "/signin"} className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <FiUser size={20} className="text-gray-700" />
              </Link>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2">
            <Link href="/search" className="flex-1 relative bg-white rounded-xl">
              <div className="flex items-center pl-4 pr-12 py-3.5">
                <FiSearch className="text-gray-400 mr-3" size={20} />
                <span className="text-gray-500 text-base">Search for products...</span>
              </div>
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}

