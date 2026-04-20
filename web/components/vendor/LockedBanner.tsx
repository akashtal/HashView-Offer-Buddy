'use client';

import { useState } from 'react';
import { FiLock, FiUnlock, FiAlertTriangle } from 'react-icons/fi';

interface LockedBannerProps {
  onUnlock: () => Promise<void>;
}

export default function LockedBanner({ onUnlock }: LockedBannerProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);

  const handleUnlock = async () => {
    setIsUnlocking(true);
    try {
      await onUnlock();
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-orange-50 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        {/* Icon + Text */}
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <FiLock className="text-red-600" size={22} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
              <FiAlertTriangle size={16} />
              Profile Locked — Hidden from Customers
            </h3>
            <p className="text-sm text-red-700 mt-1 leading-relaxed">
              Your vendor profile has been locked due to{' '}
              <strong>more than 24 hours of inactivity</strong>. Your shop is currently
              not visible to customers. Click the button below to restore access instantly.
            </p>
          </div>
        </div>

        {/* Unlock Button */}
        <button
          onClick={handleUnlock}
          disabled={isUnlocking}
          className="flex-shrink-0 flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-semibold px-6 py-3 rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
        >
          <FiUnlock size={16} />
          {isUnlocking ? 'Unlocking...' : 'Unlock Profile'}
        </button>
      </div>

      <p className="text-xs text-red-500 mt-3">
        💡 Tip: Log in at least once every 24 hours or perform any action in your dashboard to stay active.
      </p>
    </div>
  );
}
