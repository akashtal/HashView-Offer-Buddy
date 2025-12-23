'use client';

import { useState } from 'react';
import { FiMapPin, FiLoader } from 'react-icons/fi';
import { useLocationStore } from '@/store/locationStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';

export default function LocationBanner() {
  const [showModal, setShowModal] = useState(false);
  const {
    latitude,
    longitude,
    address,
    radius,
    isLoading,
    error,
    hasPermission,
    requestLocation,
    setRadius,
  } = useLocationStore();

  const handleRequestLocation = async () => {
    await requestLocation();
    if (!error) {
      setShowModal(false);
    }
  };

  if (hasPermission && latitude && longitude) {
    return (
      <div className="bg-gradient-to-r from-primary to-primary-light text-secondary py-3 px-4">
        <div className="container-custom flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FiMapPin size={20} />
            <div>
              <p className="font-semibold">
                Showing offers within {radius}km
              </p>
              <p className="text-sm opacity-90">
                {address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="px-3 py-2 rounded-lg bg-white text-secondary font-medium focus:outline-none focus:ring-2 focus:ring-secondary"
            >
              <option value={1}>1 km</option>
              <option value={3}>3 km</option>
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={20}>20 km</option>
              <option value={50}>50 km</option>
            </select>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              Change Location
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-primary via-primary-light to-primary text-secondary py-6">
        <div className="container-custom text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <FiMapPin size={24} />
            <h2 className="text-2xl font-bold">
              Enable Location to See Nearby Offers
            </h2>
          </div>
          <p className="text-secondary/80 max-w-2xl mx-auto">
            Offer Buddy shows you the best deals from shops near you. Allow location access to discover amazing offers in your area!
          </p>
          <Button
            variant="secondary"
            size="lg"
            onClick={handleRequestLocation}
            isLoading={isLoading}
          >
            <FiMapPin className="inline mr-2" />
            Enable Location
          </Button>
          {error && (
            <p className="text-red-700 font-medium">{error}</p>
          )}
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Set Your Location"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            We need your location to show you offers from nearby shops. Your location data is never shared with third parties.
          </p>
          <Button
            variant="primary"
            fullWidth
            onClick={handleRequestLocation}
            isLoading={isLoading}
          >
            <FiMapPin className="inline mr-2" />
            Use My Current Location
          </Button>
          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}
        </div>
      </Modal>
    </>
  );
}

