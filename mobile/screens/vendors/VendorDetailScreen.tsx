import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, ScrollView,
    TextInput, ActivityIndicator, StyleSheet, Linking, Modal, Dimensions, Platform
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useLocalSearchParams, useRouter, Redirect } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import { useLocation } from '@/context/LocationContext';
import { calculateDistance } from '@/utils/location-utils';
import ProductCard from '@/components/products/ProductCard';
import ChatButton from '@/components/chat/ChatButton';
import ComprehensiveFilters, { FilterOptions } from '@/components/ui/ComprehensiveFilters';
import FilterChips from '@/components/ui/FilterChips';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/authStore';

import { Image } from 'expo-image';
const { width } = Dimensions.get('window');

export default function VendorDetailScreen() {
    const { id, search } = useLocalSearchParams();
    const vendorId = id as string;
    const router = useRouter();
    const { location } = useLocation();

    const [vendor, setVendor] = useState<any>(null);
    const [products, setProducts] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const [showEnquiryModal, setShowEnquiryModal] = useState(false);

    // Auth State
    const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();

    // Contact Supplier Form State
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMobile, setContactMobile] = useState('');
    const [contactLocation, setContactLocation] = useState('');
    const [contactProductInterest, setContactProductInterest] = useState('');
    const [contactQuantity, setContactQuantity] = useState('');
    const [contactRequirement, setContactRequirement] = useState('');
    const [isSubmittingContact, setIsSubmittingContact] = useState(false);

    // Contact tab form state (separate from modal)
    const [tabName, setTabName] = useState('');
    const [tabEmail, setTabEmail] = useState('');
    const [tabMobile, setTabMobile] = useState('');
    const [tabLocation, setTabLocation] = useState('');
    const [tabProductInterest, setTabProductInterest] = useState('');
    const [tabQuantity, setTabQuantity] = useState('');
    const [tabRequirement, setTabRequirement] = useState('');
    const [isSubmittingTab, setIsSubmittingTab] = useState(false);

    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        Toast.show({ type, text1: message });
    };

    // Pagination state
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalProducts, setTotalProducts] = useState(0);

    // Filters state
    const [filters, setFilters] = useState<FilterOptions>({
        sortBy: 'relevance',
        rating: 0,
        hasOffer: false,
    });

    const [facets, setFacets] = useState<any>({ minPrice: 0, maxPrice: 50000 });

    const searchQuery = (search as string) || '';
    const [localSearch, setLocalSearch] = useState(searchQuery);

    useEffect(() => {
        setLocalSearch(searchQuery);
    }, [searchQuery]);

    const handleSearch = () => {
        if (localSearch.trim()) {
            router.setParams({ search: localSearch.trim() });
        } else {
            router.setParams({ search: '' });
        }
    };

    const clearSearch = () => {
        setLocalSearch('');
        router.setParams({ search: '' });
    };

    const handleFilterChange = (newFilters: FilterOptions) => {
        setFilters(newFilters);
    };

    const handleContactSubmit = async () => {
        if (!contactName.trim()) {
            showToast('Please enter your name', 'error');
            return;
        }
        if (!contactMobile.trim()) {
            showToast('Please enter your mobile number', 'error');
            return;
        }
        if (!contactRequirement.trim()) {
            showToast('Please describe your requirement', 'error');
            return;
        }

        try {
            setIsSubmittingContact(true);
            await axios.post(`/api/vendors/${vendorId}/contact`, {
                name: contactName.trim(),
                email: contactEmail.trim() || undefined,
                mobileNumber: contactMobile.trim(),
                requirement: contactRequirement.trim(),
                location: contactLocation.trim() || undefined,
                productInterest: contactProductInterest.trim() || undefined,
                quantity: contactQuantity.trim() || undefined,
            });
            showToast('Enquiry submitted successfully! The vendor will contact you soon.', 'success');
            setShowEnquiryModal(false);
            setContactName('');
            setContactEmail('');
            setContactMobile('');
            setContactLocation('');
            setContactProductInterest('');
            setContactQuantity('');
            setContactRequirement('');
        } catch (error: any) {
            console.error('Contact submit error:', error);
            showToast(error.response?.data?.error || 'Failed to submit enquiry', 'error');
        } finally {
            setIsSubmittingContact(false);
        }
    };

    const handleTabContactSubmit = async () => {
        if (!tabName.trim()) {
            showToast('Please enter your name', 'error');
            return;
        }
        if (!tabMobile.trim()) {
            showToast('Please enter your mobile number', 'error');
            return;
        }
        if (!tabRequirement.trim()) {
            showToast('Please describe your requirement', 'error');
            return;
        }

        try {
            setIsSubmittingTab(true);
            await axios.post(`/api/vendors/${vendorId}/contact`, {
                name: tabName.trim(),
                email: tabEmail.trim() || undefined,
                mobileNumber: tabMobile.trim(),
                requirement: tabRequirement.trim(),
                location: tabLocation.trim() || undefined,
                productInterest: tabProductInterest.trim() || undefined,
                quantity: tabQuantity.trim() || undefined,
            });
            showToast('Enquiry submitted successfully! The vendor will contact you soon.', 'success');
            setTabName('');
            setTabEmail('');
            setTabMobile('');
            setTabLocation('');
            setTabProductInterest('');
            setTabQuantity('');
            setTabRequirement('');
        } catch (error: any) {
            console.error('Tab contact submit error:', error);
            showToast(error.response?.data?.error || 'Failed to submit enquiry', 'error');
        } finally {
            setIsSubmittingTab(false);
        }
    };

    // Authentication Protection
    // (Handled declaratively below)
    // Load Vendor Details (Run once)
    useEffect(() => {
        const fetchVendor = async () => {
            try {
                const vendorRes = await axios.get(`/api/vendors/${vendorId}`);
                const vendorData = vendorRes.data.data.vendor;

                if (location?.coordinates && vendorData.location?.coordinates) {
                    let vendorLng, vendorLat;
                    const coords = vendorData.location.coordinates;

                    if (Array.isArray(coords)) {
                        [vendorLng, vendorLat] = coords;
                    } else if (coords?.coordinates && Array.isArray(coords.coordinates)) {
                        [vendorLng, vendorLat] = coords.coordinates;
                    }

                    if (typeof vendorLng === 'number' && typeof vendorLat === 'number') {
                        vendorData.distance = calculateDistance(
                            location.coordinates,
                            { latitude: vendorLat, longitude: vendorLng }
                        );
                    }
                }
                setVendor(vendorData);

                try {
                    const catRes = await axios.get('/api/categories?parentOnly=true');
                    setCategories(catRes.data.data?.categories || []);
                } catch { }
            } catch (error: any) {
                if (error.response?.status === 404) {
                    console.log('Vendor profile is locked or not found.');
                } else {
                    console.error('Failed to load vendor:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };
        if (vendorId) fetchVendor();
    }, [vendorId, location]);

    // Fetch Products (Server-side filtering & pagination)
    const fetchGithubProducts = useCallback(async (isLoadMore = false) => {
        if (!vendorId) return;

        try {
            const currentPage = isLoadMore ? page + 1 : 1;
            if (!isLoadMore) setIsProductsLoading(true);

            const params: any = {
                vendorId,
                page: currentPage,
                limit: 20,
                sortBy: filters.sortBy || 'relevance',
            };

            if (location?.coordinates) {
                params.latitude = location.coordinates.latitude;
                params.longitude = location.coordinates.longitude;
            }

            if (searchQuery) params.query = searchQuery;
            if (filters.category) params.category = filters.category;
            if (filters.hasOffer) params.hasOffer = true;
            if (filters.rating) params.rating = filters.rating;
            if (filters.minPrice) params.minPrice = filters.minPrice;
            if (filters.maxPrice) params.maxPrice = filters.maxPrice;

            const res = await axios.get('/api/products', { params });
            const newProducts = res.data.data.products || [];
            const pagination = res.data.data.pagination;
            const stats = res.data.data.stats;

            if (isLoadMore) {
                setProducts(prev => [...prev, ...newProducts]);
                setPage(currentPage);
            } else {
                setProducts(newProducts);
                setPage(1);
                if (stats) setFacets({ minPrice: stats.minPrice, maxPrice: stats.maxPrice });
            }

            setHasMore(pagination?.hasMore || false);
            setTotalProducts(pagination?.total || 0);

        } catch (error) {
            console.error('Failed to fetch products:', error);
        } finally {
            setIsProductsLoading(false);
        }
    }, [vendorId, searchQuery, filters, location]);

    // Trigger fetch when filters/search change
    useEffect(() => {
        fetchGithubProducts(false); // Reset and fetch
    }, [vendorId, searchQuery, filters]);

    const loadMore = () => {
        if (!hasMore || isProductsLoading) return;
        fetchGithubProducts(true);
    };

    const hasActiveFilters = Boolean(filters.category || filters.hasOffer || (filters.rating || 0) > 0 || (filters.minPrice || 0) > 0 || (filters.maxPrice && filters.maxPrice < 50000));

    const openMap = (lat: number, lng: number, addressText: string) => {
        const hasGPS = lat && lng;
        const googleMapsUrl = hasGPS
            ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText)}`;
        Linking.openURL(googleMapsUrl);
    };

    const openDirections = (lat: number, lng: number, addressText: string) => {
        const hasGPS = lat && lng;
        const directionsUrl = hasGPS
            ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addressText)}`;
        Linking.openURL(directionsUrl);
    };

    const openWhatsApp = () => {
        if (vendor?.contactInfo?.whatsapp) {
            Linking.openURL(`https://wa.me/${vendor.contactInfo.whatsapp}`);
        }
    };

    // Authentication Protection
    useEffect(() => {
        if (!isAuthLoading && !isAuthenticated) {
            // Timeout prevents "onUnhandledAction" crash when routing on initial mount
            const timer = setTimeout(() => {
                router.push('/(tabs)/signin' as any);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isAuthLoading, isAuthenticated, router]);

    // Prevent rendering vendor content if unauthenticated
    if (isAuthLoading || !isAuthenticated) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4F46E5" />
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.messageBox}>
                <Text style={styles.messageText}>Loading Supplier Profile...</Text>
            </View>
        );
    }

    if (!vendor) return <View style={styles.messageBox}><Text style={styles.messageText}>Supplier not found</Text></View>;

    return (
        <View style={styles.container}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Feather name="arrow-left" size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>{vendor.shopName}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Banner/Header */}
                <View style={styles.bannerContainer}>
                    <View style={styles.logoRow}>
                        <View style={styles.logoBox}>
                            <Image
                                source={{ uri: vendor.shopLogo || 'https://via.placeholder.com/150' }}
                                style={styles.logoImage}
                                contentFit="contain"
                            />
                        </View>
                        <View style={styles.vendorInfoBox}>
                            <Text style={styles.shopName}>{vendor.shopName}</Text>
                            <View style={styles.vendorMetaRow}>
                                <Feather name="map-pin" size={14} color="#6B7280" />
                                <Text style={styles.vendorMetaText}>{vendor.location?.city}, {vendor.location?.state}</Text>
                            </View>
                            {vendor.isApproved && (
                                <View style={styles.vendorMetaRow}>
                                    <Feather name="shield" size={14} color="#16A34A" />
                                    <Text style={[styles.vendorMetaText, { color: '#16A34A', fontWeight: 'bold' }]}>TrustSEAL Verified</Text>
                                </View>
                            )}
                            {!!vendor.rating && vendor.rating > 0 && (
                                <View style={styles.vendorMetaRow}>
                                    <Text style={styles.ratingText}>{vendor.rating}</Text>
                                    <FontAwesome name="star" size={12} color="#FDB913" />
                                    <Text style={styles.vendorMetaText}>({vendor.analytics?.totalViews} views)</Text>
                                </View>
                            )}

                            <Text style={styles.shopDesc} numberOfLines={3}>
                                {vendor.shopDescription || `Leading supplier of ${vendor.category?.name || 'various products'} in ${vendor.location?.city}. Contact us for best quality and price.`}
                            </Text>

                            <View style={styles.actionButtonsRow}>
                                <TouchableOpacity onPress={() => setShowEnquiryModal(true)} style={styles.primaryActionBtn}>
                                    <Feather name="phone" size={16} color="#111827" />
                                    <Text style={styles.primaryActionText}>Contact Supplier</Text>
                                </TouchableOpacity>
                                {!!vendor.contactInfo?.whatsapp && (
                                    <TouchableOpacity onPress={openWhatsApp} style={styles.whatsappBtn}>
                                        <FontAwesome name="whatsapp" size={16} color="#FFF" />
                                        <Text style={styles.whatsappBtnText}>WhatsApp</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                            <View style={{ marginTop: 8 }}>
                                <ChatButton recipientId={vendor._id} recipientModel="Vendor" recipientName={vendor.shopName} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Tabs */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollWrap} contentContainerStyle={styles.tabScrollContent}>
                    {[
                        { id: 'products', label: `Products & Services (${totalProducts})` },
                        { id: 'profile', label: 'Company Profile' },
                        { id: 'contact', label: 'Contact Us' }
                    ].map((tab) => (
                        <TouchableOpacity
                            key={tab.id}
                            onPress={() => setActiveTab(tab.id)}
                            style={[styles.tabBtn, activeTab === tab.id && styles.activeTabBtn]}
                        >
                            <Text style={[styles.tabBtnText, activeTab === tab.id && styles.activeTabBtnText]}>
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Content Area */}
                <View style={styles.mainContent}>
                    {activeTab === 'products' && (
                        <View>
                            {/* Search & Filter Bar */}
                            <View style={styles.filterBar}>
                                <View style={styles.searchRow}>
                                    <View style={styles.searchInputBox}>
                                        <Feather name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
                                        <TextInput
                                            style={styles.searchInput}
                                            placeholder={`Search in ${vendor.shopName}...`}
                                            value={localSearch}
                                            onChangeText={setLocalSearch}
                                            onSubmitEditing={handleSearch}
                                            returnKeyType="search"
                                        />
                                    </View>
                                    <View style={styles.filterDivider} />
                                    <ComprehensiveFilters
                                        onApplyFilters={handleFilterChange}
                                        currentFilters={filters}
                                        categories={categories}
                                        facets={facets}
                                    />
                                </View>

                                {hasActiveFilters && (
                                    <View style={styles.chipsRowWrap}>
                                        <FilterChips currentFilters={filters} categories={categories} onApplyFilters={handleFilterChange} />
                                    </View>
                                )}

                                {searchQuery ? (
                                    <View style={styles.activeSearchChip}>
                                        <Text style={styles.activeSearchLabel}>Searching:</Text>
                                        <TouchableOpacity onPress={clearSearch} style={styles.searchRemoverBtn}>
                                            <Text style={styles.searchRemoverText}>&quot;{searchQuery}&quot;</Text>
                                            <Feather name="x" size={12} color="#6B7280" />
                                        </TouchableOpacity>
                                    </View>
                                ) : null}
                            </View>

                            {/* Products — FlashList for virtualization (only renders visible items) */}
                            {products.length === 0 && !isProductsLoading ? (
                                <View style={styles.noProductsBox}>
                                    <Feather name="search" size={40} color="#D1D5DB" />
                                    <Text style={styles.noProductsText}>No products found</Text>
                                    <Text style={styles.noProductsSub}>
                                        {searchQuery || hasActiveFilters ? 'Try different search terms or clear filters' : 'No products listed by this supplier yet.'}
                                    </Text>
                                    {(searchQuery || hasActiveFilters) && (
                                        <TouchableOpacity onPress={() => { setFilters({ sortBy: 'relevance', rating: 0, hasOffer: false }); clearSearch(); }}>
                                            <Text style={styles.clearFiltersLink}>Clear all filters</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            ) : (
                                <View style={{ minHeight: 600 }}>
                                    <FlashList
                                        data={products}
                                        keyExtractor={(p: any) => p._id}
                                        numColumns={2}
                                        scrollEnabled={false}
                                        contentContainerStyle={{ paddingHorizontal: 4 }}
                                        renderItem={({ item: product }: { item: any }) => (
                                            <View style={styles.productCell}>
                                                <ProductCard
                                                    product={{
                                                        ...product,
                                                        images: product.images || [],
                                                        vendorId: {
                                                            _id: product.vendorId?._id || product.vendorId || vendor._id,
                                                            shopName: vendor.shopName,
                                                            location: vendor.location
                                                        }
                                                    }}
                                                />
                                            </View>
                                        )}
                                        ListFooterComponent={isProductsLoading ? (
                                            <View style={styles.loadingRow}>
                                                {[1, 2].map((i) => (<View key={`l-${i}`} style={[styles.productCell, styles.shimmer]} />))}
                                            </View>
                                        ) : null}
                                    />
                                    {hasMore && !isProductsLoading && (
                                        <TouchableOpacity onPress={loadMore} style={styles.loadMoreBtn}>
                                            <Text style={styles.loadMoreBtnText}>Load More Products</Text>
                                        </TouchableOpacity>
                                    )}
                                    <Text style={styles.showingText}>Showing {products.length} of {totalProducts} products</Text>
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'profile' && (
                        <View style={styles.cardBox}>
                            <Text style={styles.sectionTitle}>About Us</Text>
                            <Text style={styles.profileDesc}>
                                {vendor.shopDescription || 'No description available.'}
                            </Text>

                            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Company Facts</Text>
                            <View style={styles.factRow}>
                                <Text style={styles.factLabel}>Nature of Business</Text>
                                <Text style={styles.factValue}>Supplier / Distributor</Text>
                            </View>
                            <View style={styles.factRow}>
                                <Text style={styles.factLabel}>Year of Establishment</Text>
                                <Text style={styles.factValue}>{vendor.yearEstablished || 'N/A'}</Text>
                            </View>
                            <View style={styles.factRow}>
                                <Text style={styles.factLabel}>Legal Status</Text>
                                <Text style={styles.factValue}>Proprietorship</Text>
                            </View>

                            {vendor.businessHours && vendor.businessHours.length > 0 && (
                                <View style={{ marginTop: 24 }}>
                                    <Text style={styles.sectionTitle}>Opening Hours</Text>
                                    {vendor.businessHours?.map((h: any, i: number) => (
                                        <View key={i} style={styles.hoursRow}>
                                            <Text style={styles.hoursDay}>{h.day}</Text>
                                            <Text style={styles.hoursTime}>
                                                {h.isClosed ? 'Closed' : `${h.openTime} - ${h.closeTime}`}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {activeTab === 'contact' && (
                        <View style={styles.cardBox}>
                            <Text style={styles.sectionTitle}>Contact Us</Text>

                            <View style={styles.contactItemRow}>
                                <View style={styles.contactIconBg}><Feather name="map-pin" size={20} color="#FDB913" /></View>
                                <View style={styles.contactItemContent}>
                                    <Text style={styles.contactHdr}>Registered Address</Text>
                                    <Text style={styles.contactSub}>
                                        {vendor.location?.address}{'\n'}
                                        {vendor.location?.city} - {vendor.location?.pincode},{'\n'}
                                        {vendor.location?.state}, India
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.contactItemRow}>
                                <View style={styles.contactIconBg}><Feather name="phone" size={20} color="#FDB913" /></View>
                                <View style={styles.contactItemContent}>
                                    <Text style={styles.contactHdr}>Call Us</Text>
                                    <Text style={styles.contactBold}>{vendor.contactInfo?.phone}</Text>
                                </View>
                            </View>

                            {!!vendor.contactInfo?.email && (
                                <View style={styles.contactItemRow}>
                                    <View style={styles.contactIconBg}><Feather name="mail" size={20} color="#FDB913" /></View>
                                    <View style={styles.contactItemContent}>
                                        <Text style={styles.contactHdr}>Email Us</Text>
                                        <Text style={styles.contactSub}>{vendor.contactInfo.email}</Text>
                                    </View>
                                </View>
                            )}

                            {/* Visit Us */}
                            {(() => {
                                const coords = vendor.location?.coordinates?.coordinates;
                                const lng = coords?.[0];
                                const lat = coords?.[1];
                                const addressText = [vendor.location?.address, vendor.location?.city, vendor.location?.state, 'India'].filter(Boolean).join(', ');

                                if (!lat && !lng && !addressText) return null;

                                return (
                                    <View style={styles.contactItemRow}>
                                        <View style={styles.contactIconBg}><Feather name="map-pin" size={20} color="#FDB913" /></View>
                                        <View style={[styles.contactItemContent, { flex: 1 }]}>
                                            <Text style={styles.contactHdr}>Visit Us</Text>
                                            <View style={styles.mapPlaceholderBox}>
                                                <Text style={styles.mapPlaceholderText}>Map Interactive View</Text>
                                                <TouchableOpacity
                                                    onPress={() => openMap(lat, lng, addressText)}
                                                    style={styles.openMapBtn}
                                                >
                                                    <Text style={styles.openMapBtnText}>Open in App</Text>
                                                </TouchableOpacity>
                                            </View>
                                            <TouchableOpacity onPress={() => openDirections(lat, lng, addressText)} style={styles.directionsBtn}>
                                                <Feather name="map-pin" size={14} color="#FFF" />
                                                <Text style={styles.directionsBtnText}>Get Directions</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })()}

                            {/* Professional Contact Form */}
                            <View style={styles.msgFormBox}>
                                <View style={styles.msgFormHeaderRow}>
                                    <Feather name="send" size={20} color="#FDB913" />
                                    <Text style={styles.msgFormTitle}>Send Enquiry</Text>
                                </View>
                                <Text style={styles.msgFormSubtitle}>Fill in the details below to send your requirement directly to the vendor.</Text>

                                <Text style={styles.fieldLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
                                <View style={styles.inputWithIcon}>
                                    <Feather name="user" size={16} color="#9CA3AF" style={styles.fieldIcon} />
                                    <TextInput style={styles.fieldInput} placeholder="Enter your name" value={tabName} onChangeText={setTabName} />
                                </View>

                                <Text style={styles.fieldLabel}>Email Address</Text>
                                <View style={styles.inputWithIcon}>
                                    <Feather name="mail" size={16} color="#9CA3AF" style={styles.fieldIcon} />
                                    <TextInput style={styles.fieldInput} placeholder="you@example.com" value={tabEmail} onChangeText={setTabEmail} keyboardType="email-address" autoCapitalize="none" />
                                </View>

                                <Text style={styles.fieldLabel}>Mobile Number <Text style={styles.requiredStar}>*</Text></Text>
                                <View style={styles.inputWithIcon}>
                                    <Feather name="phone" size={16} color="#9CA3AF" style={styles.fieldIcon} />
                                    <TextInput style={styles.fieldInput} placeholder="Enter 10-digit mobile" value={tabMobile} onChangeText={setTabMobile} keyboardType="phone-pad" />
                                </View>

                                <Text style={styles.fieldLabel}>Your City / Location</Text>
                                <View style={styles.inputWithIcon}>
                                    <Feather name="map-pin" size={16} color="#9CA3AF" style={styles.fieldIcon} />
                                    <TextInput style={styles.fieldInput} placeholder="e.g. Mumbai, Delhi" value={tabLocation} onChangeText={setTabLocation} />
                                </View>

                                <View style={styles.rowFields}>
                                    <View style={styles.halfField}>
                                        <Text style={styles.fieldLabel}>Product Interest</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Feather name="tag" size={16} color="#9CA3AF" style={styles.fieldIcon} />
                                            <TextInput style={styles.fieldInput} placeholder="e.g. Laptop" value={tabProductInterest} onChangeText={setTabProductInterest} />
                                        </View>
                                    </View>
                                    <View style={styles.halfField}>
                                        <Text style={styles.fieldLabel}>Quantity</Text>
                                        <View style={styles.inputWithIcon}>
                                            <Feather name="hash" size={16} color="#9CA3AF" style={styles.fieldIcon} />
                                            <TextInput style={styles.fieldInput} placeholder="e.g. 50" value={tabQuantity} onChangeText={setTabQuantity} keyboardType="number-pad" />
                                        </View>
                                    </View>
                                </View>

                                <Text style={styles.fieldLabel}>Requirement Details <Text style={styles.requiredStar}>*</Text></Text>
                                <TextInput
                                    style={[styles.msgInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Describe what you need, specifications, delivery timeline, etc."
                                    value={tabRequirement}
                                    onChangeText={setTabRequirement}
                                    multiline
                                    textAlignVertical="top"
                                />

                                <TouchableOpacity style={styles.msgSubmitBtn} onPress={handleTabContactSubmit} disabled={isSubmittingTab}>
                                    {isSubmittingTab ? (
                                        <ActivityIndicator color="#111827" />
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Feather name="send" size={16} color="#111827" />
                                            <Text style={styles.msgSubmitTxt}>Submit Enquiry</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.formDisclaimer}>Your information is shared only with this vendor and not with any third party.</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Floating Need Help Action block mimicking right column */}
            {activeTab !== 'products' && (
                <View style={styles.floatingHelpBox}>
                    <Text style={styles.hlpTitle}>Tell us what you need</Text>
                    <Text style={styles.hlpSub}>Get quotes from this supplier</Text>
                    <TouchableOpacity onPress={() => setShowEnquiryModal(true)} style={styles.hlpActionBtn}>
                        <Text style={styles.hlpActionTxt}>Send Enquiry</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Professional Enquiry Modal */}
            <Modal visible={showEnquiryModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <ScrollView contentContainerStyle={styles.modalScrollContent} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <View>
                                    <Text style={styles.modalTitle}>Get Quote</Text>
                                    <Text style={styles.modalSubTitle}>{vendor.shopName}</Text>
                                </View>
                                <TouchableOpacity onPress={() => setShowEnquiryModal(false)} style={styles.modalCloseBtn}>
                                    <Feather name="x" size={22} color="#111827" />
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalBody}>
                                <Text style={styles.modalFieldLabel}>Full Name <Text style={styles.requiredStar}>*</Text></Text>
                                <View style={styles.modalInputRow}>
                                    <Feather name="user" size={16} color="#9CA3AF" style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalFieldInput}
                                        placeholder="Enter your name"
                                        value={contactName}
                                        onChangeText={setContactName}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <Text style={styles.modalFieldLabel}>Email Address</Text>
                                <View style={styles.modalInputRow}>
                                    <Feather name="mail" size={16} color="#9CA3AF" style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalFieldInput}
                                        placeholder="you@example.com"
                                        value={contactEmail}
                                        onChangeText={setContactEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <Text style={styles.modalFieldLabel}>Mobile Number <Text style={styles.requiredStar}>*</Text></Text>
                                <View style={styles.modalInputRow}>
                                    <Feather name="phone" size={16} color="#9CA3AF" style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalFieldInput}
                                        placeholder="Enter 10-digit mobile"
                                        value={contactMobile}
                                        onChangeText={setContactMobile}
                                        keyboardType="phone-pad"
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <Text style={styles.modalFieldLabel}>Your City / Location</Text>
                                <View style={styles.modalInputRow}>
                                    <Feather name="map-pin" size={16} color="#9CA3AF" style={styles.modalInputIcon} />
                                    <TextInput
                                        style={styles.modalFieldInput}
                                        placeholder="e.g. Mumbai, Delhi"
                                        value={contactLocation}
                                        onChangeText={setContactLocation}
                                        placeholderTextColor="#9CA3AF"
                                    />
                                </View>

                                <View style={styles.rowFields}>
                                    <View style={styles.halfField}>
                                        <Text style={styles.modalFieldLabel}>Product Interest</Text>
                                        <View style={styles.modalInputRow}>
                                            <Feather name="tag" size={16} color="#9CA3AF" style={styles.modalInputIcon} />
                                            <TextInput
                                                style={styles.modalFieldInput}
                                                placeholder="e.g. Laptop"
                                                value={contactProductInterest}
                                                onChangeText={setContactProductInterest}
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    </View>
                                    <View style={styles.halfField}>
                                        <Text style={styles.modalFieldLabel}>Quantity</Text>
                                        <View style={styles.modalInputRow}>
                                            <Feather name="hash" size={16} color="#9CA3AF" style={styles.modalInputIcon} />
                                            <TextInput
                                                style={styles.modalFieldInput}
                                                placeholder="e.g. 50"
                                                value={contactQuantity}
                                                onChangeText={setContactQuantity}
                                                keyboardType="number-pad"
                                                placeholderTextColor="#9CA3AF"
                                            />
                                        </View>
                                    </View>
                                </View>

                                <Text style={styles.modalFieldLabel}>Requirement Details <Text style={styles.requiredStar}>*</Text></Text>
                                <TextInput
                                    style={[styles.modalInput, { height: 100, textAlignVertical: 'top', paddingTop: 12 }]}
                                    placeholder="Describe what you need — specs, delivery timeline, budget, etc."
                                    value={contactRequirement}
                                    onChangeText={setContactRequirement}
                                    multiline
                                    textAlignVertical="top"
                                    placeholderTextColor="#9CA3AF"
                                />

                                <TouchableOpacity
                                    onPress={handleContactSubmit}
                                    disabled={isSubmittingContact}
                                    style={[styles.modalSubmitBtn, isSubmittingContact && { opacity: 0.7 }]}
                                >
                                    {isSubmittingContact ? (
                                        <ActivityIndicator color="#FFF" />
                                    ) : (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <Feather name="send" size={16} color="#FFF" />
                                            <Text style={styles.modalSubmitTxt}>Submit Enquiry</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <Text style={styles.formDisclaimer}>🔒 Your info is shared only with this vendor.</Text>
                            </View>
                        </View>
                    </ScrollView>
                </View>
            </Modal>

            <Toast />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F3F3F3' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    messageBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    messageText: { fontSize: 16, color: '#6B7280' },

    headerTop: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#F3F4F6' },
    backBtn: { marginRight: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', flex: 1 },

    scrollContent: { paddingBottom: 100 },

    bannerContainer: { backgroundColor: '#FFF', padding: 16 },
    logoRow: { flexDirection: 'row', alignItems: 'flex-start' },
    logoBox: { width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden', marginRight: 16 },
    logoImage: { width: '100%', height: '100%' },
    vendorInfoBox: { flex: 1 },
    shopName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 6 },
    vendorMetaRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 4 },
    vendorMetaText: { fontSize: 12, color: '#6B7280' },
    ratingText: { fontSize: 12, fontWeight: 'bold', color: '#111827' },
    shopDesc: { fontSize: 13, color: '#4B5563', lineHeight: 18, marginTop: 8, marginBottom: 12 },
    actionButtonsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    primaryActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FDB913', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    primaryActionText: { color: '#111827', fontWeight: 'bold', fontSize: 13 },
    whatsappBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#25D366', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
    whatsappBtnText: { color: '#FFF', fontWeight: 'bold', fontSize: 13 },

    tabScrollWrap: { backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#D1D5DB' },
    tabScrollContent: { paddingHorizontal: 16 },
    tabBtn: { paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 2, borderColor: 'transparent', marginRight: 8 },
    activeTabBtn: { borderColor: '#FDB913' },
    tabBtnText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
    activeTabBtnText: { color: '#111827' },

    mainContent: { padding: 16 },

    filterBar: { backgroundColor: '#FFF', padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    searchRow: { flexDirection: 'row', alignItems: 'center' },
    searchInputBox: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 20, paddingHorizontal: 12, height: 40 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#111827' },
    filterDivider: { width: 1, height: 24, backgroundColor: '#D1D5DB', marginHorizontal: 12 },
    chipsRowWrap: { marginTop: 12 },
    activeSearchChip: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
    activeSearchLabel: { fontSize: 12, color: '#6B7280' },
    searchRemoverBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    searchRemoverText: { fontSize: 12, fontWeight: '600', color: '#374151' },

    noProductsBox: { backgroundColor: '#FFF', padding: 32, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    noProductsText: { fontSize: 16, fontWeight: 'bold', color: '#6B7280', marginTop: 12 },
    noProductsSub: { fontSize: 13, color: '#9CA3AF', textAlign: 'center', marginTop: 8 },
    clearFiltersLink: { color: '#FDB913', fontSize: 14, fontWeight: 'bold', marginTop: 12, textDecorationLine: 'underline' },

    productsGrid: { justifyContent: 'space-between' },
    productCell: { flex: 1, margin: 4, marginBottom: 8 },
    loadingRow: { flexDirection: 'row', justifyContent: 'space-between' },
    shimmer: { height: 240, backgroundColor: '#E5E7EB', borderRadius: 8 },
    loadMoreBtn: { alignItems: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 24, marginVertical: 16, backgroundColor: '#FFF' },
    loadMoreBtnText: { fontWeight: '600', fontSize: 14, color: '#111827' },
    showingText: { textAlign: 'center', fontSize: 12, color: '#6B7280' },

    cardBox: { backgroundColor: '#FFF', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
    profileDesc: { fontSize: 14, color: '#4B5563', lineHeight: 22 },
    factRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    factLabel: { fontSize: 14, color: '#6B7280' },
    factValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
    hoursRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    hoursDay: { fontSize: 14, color: '#6B7280', width: 100 },
    hoursTime: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1, textAlign: 'right' },

    contactItemRow: { flexDirection: 'row', marginBottom: 24 },
    contactIconBg: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    contactItemContent: { flex: 1 },
    contactHdr: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    contactSub: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    contactBold: { fontSize: 18, fontWeight: 'bold', color: '#111827' },

    mapPlaceholderBox: { height: 120, backgroundColor: '#E5E7EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    mapPlaceholderText: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
    openMapBtn: { backgroundColor: '#FFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 4, elevation: 1 },
    openMapBtnText: { fontSize: 12, fontWeight: '600', color: '#111827' },
    directionsBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, gap: 6 },
    directionsBtnText: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },

    msgFormBox: { backgroundColor: '#F9FAFB', padding: 20, borderRadius: 12, marginTop: 16, borderWidth: 1, borderColor: '#E5E7EB' },
    msgFormHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    msgFormTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
    msgFormSubtitle: { fontSize: 13, color: '#6B7280', marginBottom: 20, lineHeight: 18 },
    fieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
    requiredStar: { color: '#EF4444', fontSize: 13 },
    inputWithIcon: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12 },
    fieldIcon: { marginRight: 8 },
    fieldInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 11 },
    rowFields: { flexDirection: 'row', gap: 12 },
    halfField: { flex: 1 },
    msgInput: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14 },
    msgSubmitBtn: { backgroundColor: '#FDB913', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    msgSubmitTxt: { fontWeight: 'bold', color: '#111827', fontSize: 15 },
    formDisclaimer: { fontSize: 11, color: '#9CA3AF', textAlign: 'center', marginTop: 12, lineHeight: 16 },

    floatingHelpBox: { marginHorizontal: 16, marginBottom: 16, backgroundColor: '#FFF9E6', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#FFEBA1' },
    hlpTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
    hlpSub: { fontSize: 12, color: '#4B5563', marginBottom: 12 },
    hlpActionBtn: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FDB913', paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
    hlpActionTxt: { color: '#111827', fontWeight: 'bold', fontSize: 14 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
    modalScrollContent: { flexGrow: 1, justifyContent: 'center', padding: 16 },
    modalContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 16, overflow: 'hidden' },
    modalHeader: { backgroundColor: '#FDB913', padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
    modalSubTitle: { fontSize: 13, color: '#111827', opacity: 0.8, marginTop: 4 },
    modalBody: { padding: 20 },
    modalFieldLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
    modalInputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#F9FAFB' },
    modalInputIcon: { marginRight: 8 },
    modalFieldInput: { flex: 1, fontSize: 14, color: '#111827', paddingVertical: 11 },
    modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 16, backgroundColor: '#F9FAFB' },
    modalSubmitBtn: { backgroundColor: '#111827', paddingVertical: 14, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    modalSubmitTxt: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
});
