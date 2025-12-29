'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { FiSearch, FiTrendingUp, FiShoppingBag, FiPercent } from 'react-icons/fi';
import { useProductStore } from '@/store/productStore';
import ProductCard from '@/components/products/ProductCard';
import Button from '@/components/ui/Button';
import { ProductCardSkeleton } from '@/components/ui/Loading';
import axios from 'axios';

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  const {
    featuredProducts,
    products,
    isLoading,
    fetchProducts,
    fetchFeaturedProducts,
  } = useProductStore();

  useEffect(() => {
    // Fetch categories
    const loadCategories = async () => {
      try {
        const response = await axios.get('/api/categories?parentOnly=true');
        setCategories(response.data.data.categories.slice(0, 8));
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    fetchFeaturedProducts(0, 0, 0); // Using 0 for no-location
    fetchProducts(0, 0, 0, { hasOffer: true }, 1); // Using 0 for no-location
  }, [fetchFeaturedProducts, fetchProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div>
      {/* Location Banner */}


      {/* Hero Section */}
      <section className="bg-gradient-to-br from-secondary via-secondary-light to-secondary text-white py-16">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              Stop Running. <span className="text-primary">Start Saving.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300">
              Find the best local deals and sales near you—instantly.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products, offers, or shops..."
                  className="w-full px-6 py-4 pl-12 text-lg rounded-full border-2 border-transparent focus:border-primary focus:outline-none text-secondary"
                />
                <FiSearch
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={24}
                />
                <Button
                  type="submit"
                  variant="primary"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-accent-light">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
              Your Savings Journey in 3 Easy Steps
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Discover local deals, save money, and support your community
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <FiSearch className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-secondary">
                1. Pinpoint Your Location
              </h3>
              <p className="text-gray-600">
                Simply enable location or enter your area. We focus only on what&apos;s near you.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <FiPercent className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-secondary">
                2. Browse Visual Deals
              </h3>
              <p className="text-gray-600">
                Scroll through clear photos and deal descriptions. See the offer, the store, and the distance.
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto">
                <FiShoppingBag className="text-secondary" size={32} />
              </div>
              <h3 className="text-xl font-bold text-secondary">
                3. Go Direct & Save
              </h3>
              <p className="text-gray-600">
                Contact the shop, get directions, and grab the deal before it expires!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-secondary">
              Browse by Category
            </h2>
            <Link href="/categories">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {isLoadingCategories
              ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="shimmer h-24 rounded-lg"
                />
              ))
              : categories.map((category) => (
                <Link
                  key={category._id}
                  href={`/categories/${category.slug}`}
                  className="card hover:shadow-xl transition-all p-4 text-center space-y-2"
                >
                  {category.icon ? (
                    <div className="flex justify-center mb-2">
                      <i className={`${category.icon} text-4xl text-primary`}></i>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">
                        {category.name[0]}
                      </span>
                    </div>
                  )}
                  <p className="font-semibold text-sm text-secondary">
                    {category.name}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-16 bg-accent-light">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-2">
                <FiTrendingUp className="inline mr-2 text-primary" />
                Hot Offers Near You
              </h2>
              <p className="text-gray-600">
                Limited time deals from local shops
              </p>
            </div>
            <Link href="/offers">
              <Button variant="primary">View All Offers</Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
              : featuredProducts.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
          </div>
        </div>
      </section>


      {/* Recent Products */}
      {products.length > 0 && (
        <section className="py-16">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-secondary">
                Recent Products
              </h2>
              <Link href="/products">
                <Button variant="outline">View All</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.slice(0, 8).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA for Vendors */}
      <section className="py-16 bg-gradient-to-r from-primary to-primary-light">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-secondary mb-4">
            Are You a Local Business Owner?
          </h2>
          <p className="text-secondary/80 text-lg mb-8 max-w-2xl mx-auto">
            List your offers and connect with thousands of nearby customers looking to buy now!
          </p>
          <Link href="/register?role=vendor">
            <Button variant="secondary" size="lg">
              Register Your Shop Today
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

