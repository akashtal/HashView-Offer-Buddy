'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import CategoryCarousel from '@/components/SwiggyComponents/CategoryCarousel';
import RestaurantCard from '@/components/SwiggyComponents/RestaurantCard';
import RadiusFilter from '@/components/ui/RadiusFilter';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import { useLocation } from '@/lib/LocationContext';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'relevance',
    rating: 0,
    hasOffer: false
  });
  const [radius, setRadius] = useState(50); // Default 50km
  const [isLoading, setIsLoading] = useState(true);
  const { location } = useLocation();

  useEffect(() => {
    loadProducts();
  }, [location, radius]); // Reload when location or radius changes

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        limit: 50,
        sortBy: filters.sortBy || 'distance'
      };

      // Add location params if available
      if (location?.coordinates) {
        params.latitude = location.coordinates.latitude;
        params.longitude = location.coordinates.longitude;
        params.radius = radius;
      }

      // Add offer filter
      if (filters.hasOffer) {
        params.hasOffer = true;
      }

      const response = await axios.get('/api/products', { params });
      const fetchedProducts = response.data.data.products;
      setAllProducts(fetchedProducts);
      applyFilters(fetchedProducts, filters);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load products:', error);
      // Set fallback data
      setProducts([
        {
          _id: '1',
          title: 'Industrial Heavy Duty Lathe Machine',
          images: ['https://5.imimg.com/data5/SELLER/Default/2023/3/YP/OA/XW/3397943/lathe-machine-500x500.jpg'],
          price: { original: 450000 },
          offer: { value: 10, description: 'Best Price' },
          description: 'High precision industrial lathe machine for heavy duty work'
        },
        {
          _id: '2',
          title: 'Hydraulic Scissor Lift Table',
          images: ['https://5.imimg.com/data5/SELLER/Default/2022/6/OV/YB/MC/2517878/hydraulic-scissor-lift-table-500x500.jpg'],
          price: { original: 85000 },
          offer: { value: 15, description: 'Factory Price' },
          description: 'Heavy duty hydraulic lift table for material handling'
        },
        {
          _id: '3',
          title: 'SS 304 Industrial Storage Tank',
          images: ['https://5.imimg.com/data5/SELLER/Default/2023/1/VM/QY/YC/2386862/ss-storage-tank-500x500.jpg'],
          price: { original: 125000 },
          description: 'Stainless steel storage tank for chemical and food industry'
        },
        {
          _id: '4',
          title: 'Automatic Packaging Machine',
          images: ['https://5.imimg.com/data5/SELLER/Default/2023/2/ZI/QW/MN/3409163/pouch-packing-machine-500x500.jpg'],
          price: { original: 350000 },
          offer: { value: 5, description: 'EMI Available' },
          description: 'High speed automatic pouch packing machine'
        },
        {
          _id: '5',
          title: 'Safety Shoes (Steel Toe)',
          images: ['https://5.imimg.com/data5/SELLER/Default/2022/10/IJ/ZN/QY/8425232/safety-shoes-500x500.JPG'],
          price: { original: 1200 },
          description: 'Industrial safety shoes with steel toe cap'
        },
        {
          _id: '6',
          title: 'Solar Power Plant Panel',
          images: ['https://5.imimg.com/data5/SELLER/Default/2022/9/RL/GF/YA/2605303/solar-power-plant-500x500.jpg'],
          price: { original: 25000 },
          offer: { value: 20, description: 'Subsidy Available' },
          description: 'High efficiency solar panels for industrial use'
        },
      ]);
      setIsLoading(false);
    }
  };

  const applyFilters = (productList: any[], filterOptions: FilterOptions) => {
    let filtered = [...productList];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(p =>
        p.category?._id === selectedCategory || p.category === selectedCategory
      );
    }

    // Apply rating filter
    if (filterOptions.rating && filterOptions.rating > 0) {
      filtered = filtered.filter(p => (p.rating || 4.2) >= filterOptions.rating!);
    }

    // Apply sort filter
    if (filterOptions.sortBy) {
      const sorted = [...filtered];
      switch (filterOptions.sortBy) {
        case 'distance':
          sorted.sort((a, b) => (a.distance || 999) - (b.distance || 999));
          break;
        case 'rating':
          sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          break;
        case 'price-low':
          sorted.sort((a, b) => {
            const priceA = a.price?.discounted || a.price?.original || 0;
            const priceB = b.price?.discounted || b.price?.original || 0;
            return priceA - priceB;
          });
          break;
        case 'price-high':
          sorted.sort((a, b) => {
            const priceA = a.price?.discounted || a.price?.original || 0;
            const priceB = b.price?.discounted || b.price?.original || 0;
            return priceB - priceA;
          });
          break;
      }
      filtered = sorted;
    }

    setProducts(filtered);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    applyFilters(allProducts, newFilters);
  };

  // Reapply filters when category changes
  useEffect(() => {
    applyFilters(allProducts, filters);
  }, [selectedCategory, allProducts]);

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Swiggy Header Removed - Using Global Header */}

      {/* Category Carousel */}
      <CategoryCarousel onCategorySelect={setSelectedCategory} selectedCategory={selectedCategory} />

      {/* Radius Control and Filters */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-20 z-30">
        <div className="container-custom">
          {/* Single row for all controls - mobile friendly */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <RadiusFilter value={radius} onChange={setRadius} />
            <ComprehensiveFilters onApplyFilters={handleFilterChange} currentFilters={filters} />
          </div>
          {/* Product count on separate line */}
          {location?.coordinates && (
            <p className="text-xs text-gray-500 mt-2">
              {products.length} products within {radius}km
            </p>
          )}
        </div>
      </div>

      {/* Restaurants/Products Grid */}
      <section className="py-8">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-[#282C3F] mb-6">
            Industrial Supplies & Machinery
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shimmer h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <RestaurantCard
                  key={product._id}
                  id={product._id}
                  name={product.title}
                  image={product.images?.[0]}
                  rating={4.2}
                  reviewCount={Math.floor(Math.random() * 500) + 100}
                  deliveryTime="30-35 mins"
                  cuisine={product.description || 'Industrial Supplies'}
                  priceForTwo={product.price?.original || 300}
                  offer={product.offer}
                  distance={product.distance}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
