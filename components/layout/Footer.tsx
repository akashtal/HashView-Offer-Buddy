'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FiFacebook, FiTwitter, FiInstagram, FiMail, FiPhone } from 'react-icons/fi';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-secondary text-white mt-auto">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative w-10 h-10">
                <Image
                  src="/logo-icon.png"
                  alt="Offer Buddy"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-2xl font-bold text-white">offer</span>
                <span className="text-2xl font-bold text-primary">buddy</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm">
              Discover the best local deals and offers near you. Connect with nearby shops and save money!
            </p>
            <div className="flex gap-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FiFacebook size={20} />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FiTwitter size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                <FiInstagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/about" className="hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/categories" className="hover:text-primary transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/vendors" className="hover:text-primary transition-colors">
                  Browse Shops
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* For Business */}
          <div>
            <h3 className="font-semibold text-lg mb-4">For Business</h3>
            <ul className="space-y-2 text-gray-400">
              <li>
                <Link href="/vendor/register" className="hover:text-primary transition-colors">
                  Register Your Shop
                </Link>
              </li>
              <li>
                <Link href="/vendor/login" className="hover:text-primary transition-colors">
                  Vendor Login
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-primary transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-lg mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400">
              <li className="flex items-center gap-2">
                <FiMail className="text-primary" />
                <a
                  href="mailto:support@offerbuddy.com"
                  className="hover:text-primary transition-colors"
                >
                  support@offerbuddy.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <FiPhone className="text-primary" />
                <a
                  href="tel:+911234567890"
                  className="hover:text-primary transition-colors"
                >
                  +91 123 456 7890
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} Offer Buddy. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

