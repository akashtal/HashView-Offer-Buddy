'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiMapPin, FiUser, FiSearch, FiTag, FiHelpCircle, FiShoppingCart, FiChevronDown, FiBriefcase, FiGrid, FiHeart } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import LocationSearch from '@/components/ui/LocationSearch';
import { useCartStore } from '@/store/cartStore';
import { useWishlistStore } from '@/store/wishlistStore';

export default function Header() {
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const { user, isAuthenticated, logout } = useAuthStore();

  // Client-side only counts to avoid hydration errors
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Subscribe to store changes
    const unsubCart = useCartStore.subscribe(
      (state) => setCartCount(state.getItemCount())
    );
    const unsubWishlist = useWishlistStore.subscribe(
      (state) => setWishlistCount(state.getCount())
    );

    // Set initial values
    setCartCount(useCartStore.getState().getItemCount());
    setWishlistCount(useWishlistStore.getState().getCount());

    return () => {
      unsubCart();
      unsubWishlist();
    };
  }, []);

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
          <div className="flex items-center justify-between h-20 gap-4">
            {/* Left Section: Logo + Location */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {/* Logo */}
              <Link href="/" className="flex items-center gap-2 flex-shrink-0">
                <div className="relative w-10 h-10">
                  <Image
                    src="/logo.jpeg"
                    alt="Offer Buddy"
                    fill
                    className="object-contain"
                  />
                </div>
                <div className="hidden lg:block">
                  <span className="text-xl font-bold text-secondary">offer</span>
                  <span className="text-xl font-bold text-primary">buddy</span>
                </div>
              </Link>

              {/* Location Search Component - Now even more compact */}
              <div className="max-w-[140px] border-l pl-4 border-gray-100">
                <LocationSearch variant="compact" />
              </div>
            </div>

            {/* Middle Section: Search Bar - Expanded */}
            <div className="flex-1 max-w-xl hidden lg:block">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search for products, shops, categories..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm group-hover:bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      router.push(`/products?search=${e.currentTarget.value}`);
                    }
                  }}
                />
                <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
              </div>
            </div>

            {/* Right Section: Navigation Links */}
            <nav className="flex items-center gap-4 xl:gap-6">
              {/* Core Nav - Grouped */}
              <div className="flex items-center gap-4 pr-4 border-r">
                <Link href="/categories" className="flex items-center gap-1.5 text-gray-700 hover:text-primary transition-colors group">
                  <FiGrid size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium hidden lg:inline">Categories</span>
                </Link>

                <Link href="/products" className="flex items-center gap-1.5 text-gray-700 hover:text-primary transition-colors group">
                  <FiBriefcase size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium hidden lg:inline">Products</span>
                </Link>

                <Link href="/suppliers" className="flex items-center gap-1.5 text-gray-700 hover:text-primary transition-colors group">
                  <FiUser size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium hidden lg:inline">Suppliers</span>
                </Link>
              </div>

              {/* Utilities - Grouped */}
              <div className="flex items-center gap-4 xl:gap-6">
                <Link href="/offers" className="flex items-center gap-1.5 text-gray-700 hover:text-primary transition-colors relative group">
                  <FiTag size={18} className="group-hover:scale-110 transition-transform text-primary" />
                  <span className="text-sm font-medium hidden xl:inline">Offers</span>
                  <span className="absolute -top-1 -right-1 bg-primary text-secondary text-[8px] px-1 rounded-full font-bold">
                    NEW
                  </span>
                </Link>

                <Link href="/wishlist" className="flex items-center gap-1.5 text-gray-700 hover:text-primary transition-colors relative group">
                  <FiHeart size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium hidden xl:inline">Wishlist</span>
                  {mounted && wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link href="/cart" className="flex items-center gap-1.5 text-gray-700 hover:text-primary transition-colors relative group">
                  <FiShoppingCart size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium hidden xl:inline">Cart</span>
                  {mounted && cartCount > 0 && (
                    <span className="absolute -top-1 -right-2 bg-primary text-secondary text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Vendor Link */}


                {/* User Profile or Sign In */}
                {isAuthenticated ? (
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors border"
                    >
                      <FiUser size={18} />
                      <span className="text-sm font-medium max-w-[80px] truncate">{user?.name}</span>
                      <FiChevronDown size={14} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {userMenuOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
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
                        <hr className="my-2 border-gray-100" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 transition-colors font-medium"
                        >
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link href="/signin" className="flex items-center gap-2 bg-primary text-secondary px-4 py-2 rounded-full hover:bg-primary-dark transition-all font-medium text-sm shadow-sm hover:shadow-md">
                    <FiUser size={18} />
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-40 bg-gradient-to-br from-secondary via-gray-900 to-secondary shadow-lg">
        <div className="px-4 py-4">
          {/* Top Bar: Location + User */}
          <div className="flex items-center justify-between mb-4">
            {/* Logo - Mobile */}
            <Link href="/" className="mr-3 flex-shrink-0">
              <div className="relative w-10 h-10 bg-white rounded-full overflow-hidden p-1">
                <Image
                  src="/logo.jpeg"
                  alt="Offer Buddy"
                  fill
                  className="object-contain"
                />
              </div>
            </Link>

            {/* Location Search - Mobile Version */}
            <div className="flex-1">
              <LocationSearch className="[&>button]:bg-transparent [&>button]:border-0 [&>button]:p-0 [&>button]:hover:bg-transparent [&>button]:text-white [&_span]:text-white [&_svg]:text-primary" />
            </div>
            <div className="flex items-center gap-3">
              {/* Wishlist - Mobile */}
              <Link
                href="/wishlist"
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm relative"
              >
                <FiHeart size={20} className="text-gray-700" />
                {mounted && wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold min-w-[18px] text-center shadow-sm">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Profile - Mobile */}
              <Link
                href={isAuthenticated
                  ? (user?.role === 'vendor' ? '/vendor/dashboard' : user?.role === 'admin' ? '/admin/dashboard' : '/profile')
                  : '/signin'
                }
                className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm"
              >
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

