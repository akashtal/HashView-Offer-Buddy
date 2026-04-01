'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiTag, FiUser, FiUsers, FiShoppingCart } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { useState, useEffect } from 'react';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const cart = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? cart.getItemCount() : 0;

  interface NavItem {
    name: string;
    href: string;
    icon: any;
    badge?: number;
  }

  const navItems: NavItem[] = [
    {
      name: 'Home',
      href: '/',
      icon: FiHome,
    },
    {
      name: 'Shop',
      href: '/products',
      icon: FiGrid,
    },
    {
      name: 'Suppliers',
      href: '/suppliers',
      icon: FiUsers,
    },
    {
      name: 'Categories',
      href: '/categories',
      icon: FiTag,
    },
    {
      name: 'Cart',
      href: '/cart',
      icon: FiShoppingCart,
      badge: cartCount,
    },
    {
      name: 'Profile',
      href: '/signin',
      icon: FiUser,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="mobile-bottom-nav">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav-item ${active ? 'active' : ''}`}
            >
              <div className="relative">
                <Icon className="mobile-bottom-nav-icon" size={24} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-primary text-secondary text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="mobile-bottom-nav-label">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

