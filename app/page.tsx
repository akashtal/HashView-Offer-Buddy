'use client';

import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import CategoryCarousel from '@/components/SwiggyComponents/CategoryCarousel';
import RestaurantCard from '@/components/SwiggyComponents/RestaurantCard';
import RadiusFilter from '@/components/ui/RadiusFilter';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterChips from '@/components/ui/FilterChips';
import { useLocation } from '@/lib/LocationContext';

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]); // Added categories state
  const [selectedCategory, setSelectedCategory] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    sortBy: 'relevance',
    rating: 0,
    hasOffer: false
  });
  const [radius, setRadius] = useState(50); // Default 50km
  const [isLoading, setIsLoading] = useState(true);
  const { location } = useLocation();

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get('/api/categories?parentOnly=true');
        setCategories(res.data.data?.categories || []);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  const applyFilters = useCallback((productList: any[], filterOptions: FilterOptions) => {
    let filtered = [...productList];

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter(p =>
        p.category?._id === selectedCategory || p.category === selectedCategory
      );
    }
    // Also support category from filterOptions if set via Modal
    if (filterOptions.category && !selectedCategory) {
      filtered = filtered.filter(p =>
        p.category?._id === filterOptions.category || p.category === filterOptions.category
      );
    }

    // Apply rating filter
    if (filterOptions.rating && filterOptions.rating > 0) {
      filtered = filtered.filter(p => (p.rating || 4.2) >= filterOptions.rating!);
    }

    // Apply price filter
    if (filterOptions.minPrice && filterOptions.minPrice > 0) {
      filtered = filtered.filter(p => (p.price?.original || 0) >= filterOptions.minPrice!);
    }
    if (filterOptions.maxPrice && filterOptions.maxPrice < 50000) {
      filtered = filtered.filter(p => (p.price?.original || 0) <= filterOptions.maxPrice!);
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

    // Apply Offers
    if (filterOptions.hasOffer) {
      // Mock filtering for offers if backend doesn't handle it fully or we are doing client side
      // Assuming every product has 'offer' object if it has offer.
      filtered = filtered.filter(p => p.offer && (p.offer.value > 0 || p.offer.description));
    }

    setProducts(filtered);
  }, [selectedCategory]);

  const loadProducts = useCallback(async () => {
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

      // Add offer filter - passed to API too
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
      // Fallback data
      setProducts([
        // ... (Keep existing fallback data if needed, but for brevity not duplicating all mock data here unless user needs it. 
        // I should probably keep it to avoid regression if API fails.)
        { _id: '1', title: 'Industrial Heavy Duty Lathe Machine', images: ['https://5.imimg.com/data5/SELLER/Default/2023/3/YP/OA/XW/3397943/lathe-machine-500x500.jpg'], price: { original: 450000 }, offer: { value: 10, description: 'Best Price' }, description: 'High precision industrial lathe machine', distance: 2.5, rating: 4.5 },
        { _id: '2', title: 'Hydraulic Scissor Lift Table', images: ['https://5.imimg.com/data5/SELLER/Default/2022/6/OV/YB/MC/2517878/hydraulic-scissor-lift-table-500x500.jpg'], price: { original: 85000 }, offer: { value: 15, description: 'Factory Price' }, description: 'Heavy duty hydraulic lift table', distance: 12.0, rating: 4.0 },
        { _id: '3', title: 'SS 304 Industrial Storage Tank', images: ['https://5.imimg.com/data5/SELLER/Default/2023/1/VM/QY/YC/2386862/ss-storage-tank-500x500.jpg'], price: { original: 125000 }, description: 'Stainless steel storage tank', distance: 5.0, rating: 4.8 },
      ]);
      setAllProducts([
        { _id: '1', title: 'Industrial Heavy Duty Lathe Machine', images: ['https://5.imimg.com/data5/SELLER/Default/2023/3/YP/OA/XW/3397943/lathe-machine-500x500.jpg'], price: { original: 450000 }, offer: { value: 10, description: 'Best Price' }, description: 'High precision industrial lathe machine', distance: 2.5, rating: 4.5 },
        { _id: '2', title: 'Hydraulic Scissor Lift Table', images: ['https://5.imimg.com/data5/SELLER/Default/2022/6/OV/YB/MC/2517878/hydraulic-scissor-lift-table-500x500.jpg'], price: { original: 85000 }, offer: { value: 15, description: 'Factory Price' }, description: 'Heavy duty hydraulic lift table', distance: 12.0, rating: 4.0 },
        { _id: '3', title: 'SS 304 Industrial Storage Tank', images: ['https://5.imimg.com/data5/SELLER/Default/2023/1/VM/QY/YC/2386862/ss-storage-tank-500x500.jpg'], price: { original: 125000 }, description: 'Stainless steel storage tank', distance: 5.0, rating: 4.8 },
      ]);
      setIsLoading(false);
    }
  }, [location, radius, filters.sortBy, filters.hasOffer]); // Updated dependencies

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // If category changed in modal, sync it
    if (newFilters.category !== undefined && newFilters.category !== selectedCategory) {
      setSelectedCategory(newFilters.category);
    }
    applyFilters(allProducts, newFilters);
  };

  useEffect(() => {
    loadProducts();
  }, [location, radius, loadProducts]);

  // Reapply filters when category or filters change
  useEffect(() => {
    applyFilters(allProducts, filters);
  }, [selectedCategory, allProducts, filters, applyFilters]);

  // Sync selectedCategory with filters for Chips
  const currentFiltersForChips = {
    ...filters,
    category: selectedCategory || filters.category
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Category Carousel */}
      <CategoryCarousel onCategorySelect={setSelectedCategory} selectedCategory={selectedCategory} />

      {/* Radius Control and Filters */}
      <div className="bg-white border-b border-gray-100 py-3 sticky top-16 z-30 shadow-sm">
        <div className="container-custom">
          <div className="flex flex-col gap-3">
            {/* Top Row: Controls */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-1">
                <RadiusFilter value={radius} onChange={setRadius} />
                <div className="h-6 w-px bg-gray-200 shrink-0"></div>
                <ComprehensiveFilters
                  onApplyFilters={handleFilterChange}
                  currentFilters={filters}
                  categories={categories}
                />
              </div>
              {/* Count for Desktop */}
              {location?.coordinates && (
                <p className="hidden sm:block text-xs font-medium text-gray-500 whitespace-nowrap">
                  {products.length} items near you
                </p>
              )}
            </div>

            {/* Bottom Row: Chips (if active) */}
            {(selectedCategory || filters.hasOffer || (filters.rating || 0) > 0 || (filters.minPrice || 0) > 0) && (
              <FilterChips
                currentFilters={currentFiltersForChips}
                categories={categories}
                onApplyFilters={(f) => {
                  handleFilterChange(f);
                  if (f.category === undefined) setSelectedCategory('');
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Restaurants/Products Grid */}
      <section className="py-8">
        <div className="container-custom">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#282C3F]">
              Industrial Supplies & Machinery
            </h2>
            {/* Count for Mobile */}
            {location?.coordinates && (
              <p className="sm:hidden text-xs font-medium text-gray-500">
                {products.length} items
              </p>
            )}
          </div>

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
                  rating={product.rating || 4.2}
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
