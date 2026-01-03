'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiGrid, FiTag, FiUser, FiUsers } from 'react-icons/fi';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: FiHome,
    },
    {
      name: 'Products',
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
      name: 'Profile',
      href: '/profile',
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
              <Icon className="mobile-bottom-nav-icon" size={24} />
              <span className="mobile-bottom-nav-label">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

