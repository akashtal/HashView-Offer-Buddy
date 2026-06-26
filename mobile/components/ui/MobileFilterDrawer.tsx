import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput, StyleSheet, Dimensions, Platform } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { FilterOptions, Facets } from './ComprehensiveFilters';

interface Category {
    _id: string;
    name: string;
}

interface MobileFilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    currentFilters: FilterOptions;
    categories: Category[];
    onApplyFilters: (filters: FilterOptions) => void;
    facets?: Facets;
}

const DEFAULT_MAX_PRICE = 50000;
const { width, height } = Dimensions.get('window');

export default function MobileFilterDrawer({
    isOpen,
    onClose,
    currentFilters,
    categories,
    onApplyFilters,
    facets
}: MobileFilterDrawerProps) {
    const maxPriceLimit = facets?.maxPrice || DEFAULT_MAX_PRICE;
    
    const [localFilters, setLocalFilters] = useState<FilterOptions>(currentFilters);
    const [priceMin, setPriceMin] = useState(currentFilters.minPrice?.toString() || '0');
    const [priceMax, setPriceMax] = useState(currentFilters.maxPrice?.toString() || maxPriceLimit.toString());
    const [activeSection, setActiveSection] = useState<string>('sort');

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(currentFilters);
            setPriceMin(currentFilters.minPrice?.toString() || '0');
            setPriceMax(currentFilters.maxPrice?.toString() || maxPriceLimit.toString());
        }
    }, [isOpen, currentFilters, maxPriceLimit]);

    const handleLocalChange = (key: keyof FilterOptions, value: any) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleApply = () => {
        const pMin = parseInt(priceMin) || 0;
        const pMax = parseInt(priceMax) || maxPriceLimit;
        
        onApplyFilters({
            ...localFilters,
            minPrice: pMin > 0 ? pMin : undefined,
            maxPrice: pMax < maxPriceLimit ? pMax : undefined
        });
        onClose();
    };

    const handleReset = () => {
        setLocalFilters({
            sortBy: 'distance',
            hasOffer: false,
            rating: 0,
            category: undefined,
        });
        setPriceMin('0');
        setPriceMax(maxPriceLimit.toString());
    };

    if (!isOpen) return null;

    const navItems = [
        { id: 'sort', label: 'Sort By' },
        { id: 'category', label: 'Category' },
        { id: 'price', label: 'Price' },
        { id: 'rating', label: 'Rating' },
        { id: 'offer', label: 'Offers' },
    ];

    const sortOptions = [
        { value: 'relevance', label: 'Relevance' },
        { value: 'distance', label: 'Nearest' },
        { value: 'price-low', label: 'Price: Low to High' },
        { value: 'price-high', label: 'Price: High to Low' },
        { value: 'rating', label: 'Top Rated' },
    ];

    return (
        <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                {/* Backdrop */}
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
                
                {/* Bottom Sheet */}
                <View style={styles.sheet}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Filters</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <Feather name="x" size={20} color="#555" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.body}>
                        {/* Left Sidebar Menu */}
                        <View style={styles.sidebar}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                {navItems.map(item => (
                                    <TouchableOpacity 
                                        key={item.id}
                                        style={[styles.sidebarItem, activeSection === item.id && styles.sidebarItemActive]}
                                        onPress={() => setActiveSection(item.id)}
                                    >
                                        <Text style={[styles.sidebarItemText, activeSection === item.id && styles.sidebarItemTextActive]}>
                                            {item.label}
                                        </Text>
                                        {/* Status Dot */}
                                        {((item.id === 'category' && localFilters.category) || 
                                          (item.id === 'price' && (parseInt(priceMin) > 0 || parseInt(priceMax) < maxPriceLimit)) ||
                                          (item.id === 'rating' && localFilters.rating && localFilters.rating > 0) ||
                                          (item.id === 'offer' && localFilters.hasOffer)) && (
                                            <View style={styles.dot} />
                                        )}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>

                        {/* Right Content Area */}
                        <View style={styles.content}>
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
                                
                                {/* SORT */}
                                {activeSection === 'sort' && (
                                    <View style={styles.sectionWrap}>
                                        {sortOptions.map(opt => (
                                            <TouchableOpacity 
                                                key={opt.value} 
                                                style={styles.radioRow}
                                                onPress={() => handleLocalChange('sortBy', opt.value)}
                                            >
                                                <View style={[styles.radioOutline, localFilters.sortBy === opt.value && styles.radioActive]}>
                                                    {localFilters.sortBy === opt.value && <View style={styles.radioInner} />}
                                                </View>
                                                <Text style={[styles.radioLabel, localFilters.sortBy === opt.value && styles.radioLabelActive]}>
                                                    {opt.label}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* CATEGORY */}
                                {activeSection === 'category' && (
                                    <View style={styles.sectionWrap}>
                                        <TouchableOpacity 
                                            style={[styles.catRow, !localFilters.category && styles.catRowActive]}
                                            onPress={() => handleLocalChange('category', undefined)}
                                        >
                                            <Text style={[styles.catLabel, !localFilters.category && styles.catLabelActive]}>All Categories</Text>
                                            {!localFilters.category && <Feather name="check" size={18} color="#000" />}
                                        </TouchableOpacity>
                                        {categories?.map(cat => (
                                            <TouchableOpacity 
                                                key={cat._id}
                                                style={[styles.catRow, localFilters.category === cat._id && styles.catRowActive]}
                                                onPress={() => handleLocalChange('category', localFilters.category === cat._id ? undefined : cat._id)}
                                            >
                                                <Text style={[styles.catLabel, localFilters.category === cat._id && styles.catLabelActive]}>{cat.name}</Text>
                                                {localFilters.category === cat._id && <Feather name="check" size={18} color="#000" />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* PRICE */}
                                {activeSection === 'price' && (
                                    <View style={styles.sectionWrap}>
                                        <View style={styles.priceRow}>
                                            <View style={styles.priceBox}>
                                                <Text style={styles.priceLabel}>Min Price</Text>
                                                <View style={styles.priceInputRow}>
                                                    <Text style={styles.priceCurrency}>₹</Text>
                                                    <TextInput 
                                                        style={styles.priceInput}
                                                        keyboardType="numeric"
                                                        value={priceMin}
                                                        onChangeText={setPriceMin}
                                                    />
                                                </View>
                                            </View>
                                            <View style={styles.priceBox}>
                                                <Text style={styles.priceLabel}>Max Price</Text>
                                                <View style={styles.priceInputRow}>
                                                    <Text style={styles.priceCurrency}>₹</Text>
                                                    <TextInput 
                                                        style={styles.priceInput}
                                                        keyboardType="numeric"
                                                        value={priceMax}
                                                        onChangeText={setPriceMax}
                                                    />
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                )}

                                {/* RATING */}
                                {activeSection === 'rating' && (
                                    <View style={styles.sectionWrap}>
                                        {[4, 3, 2, 1].map(rating => (
                                            <TouchableOpacity 
                                                key={rating}
                                                style={[styles.ratingRow, localFilters.rating === rating && styles.ratingRowActive]}
                                                onPress={() => handleLocalChange('rating', localFilters.rating === rating ? 0 : rating)}
                                            >
                                                <View style={styles.starsWrap}>
                                                    <Text style={styles.starsText}>{rating}+</Text>
                                                    <View style={styles.starsInner}>
                                                        {Array.from({length: 5}).map((_, i) => (
                                                            <FontAwesome 
                                                                key={i} 
                                                                name="star" 
                                                                size={16} 
                                                                color={i < rating ? "#FDB913" : "#E0E0E0"} 
                                                                style={{ marginHorizontal: 1 }} 
                                                            />
                                                        ))}
                                                    </View>
                                                </View>
                                                {localFilters.rating === rating && <Feather name="check" size={18} color="#000" />}
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}

                                {/* OFFERS */}
                                {activeSection === 'offer' && (
                                    <View style={styles.sectionWrap}>
                                        <TouchableOpacity 
                                            style={[styles.offerRow, localFilters.hasOffer && styles.offerRowActive]}
                                            onPress={() => handleLocalChange('hasOffer', !localFilters.hasOffer)}
                                        >
                                            <View>
                                                <Text style={styles.offerTitle}>Offers Only</Text>
                                                <Text style={styles.offerSub}>Show only products with discounts</Text>
                                            </View>
                                            <View style={[styles.toggleBg, localFilters.hasOffer && styles.toggleBgActive]}>
                                                <View style={[styles.toggleThumb, localFilters.hasOffer && styles.toggleThumbActive]} />
                                            </View>
                                        </TouchableOpacity>
                                    </View>
                                )}

                            </ScrollView>
                        </View>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                            <Text style={styles.resetText}>Reset</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyBtn} onPress={handleApply}>
                            <Text style={styles.applyText}>Apply Filters</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, justifyContent: 'flex-end' },
    backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
    sheet: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: height * 0.8 },
    
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderColor: '#EEE' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#111' },
    closeBtn: { padding: 4, backgroundColor: '#F5F5F5', borderRadius: 20 },
    
    body: { flex: 1, flexDirection: 'row' },
    
    sidebar: { width: 110, backgroundColor: '#F9F9F9', borderRightWidth: 1, borderColor: '#EEE' },
    sidebarItem: { paddingVertical: 16, paddingHorizontal: 12, borderLeftWidth: 4, borderColor: 'transparent' },
    sidebarItemActive: { backgroundColor: '#FFF', borderColor: '#FDB913' },
    sidebarItemText: { fontSize: 13, fontWeight: '500', color: '#666' },
    sidebarItemTextActive: { color: '#000', fontWeight: 'bold' },
    dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FDB913', position: 'absolute', top: 18, right: 12 },
    
    content: { flex: 1 },
    sectionWrap: { gap: 12 },
    
    radioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: '#FFF', borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
    radioOutline: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#CCC', justifyContent: 'center', alignItems: 'center' },
    radioActive: { borderColor: '#FDB913' },
    radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FDB913' },
    radioLabel: { fontSize: 14, color: '#333' },
    radioLabelActive: { fontWeight: 'bold', color: '#000' },
    
    catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
    catRowActive: { borderColor: '#FDB913', backgroundColor: '#FFF8E1' },
    catLabel: { fontSize: 14, color: '#333' },
    catLabelActive: { fontWeight: 'bold', color: '#000' },
    
    priceRow: { flexDirection: 'row', gap: 12 },
    priceBox: { flex: 1, backgroundColor: '#F9F9F9', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#EEE' },
    priceLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
    priceInputRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    priceCurrency: { fontSize: 16, color: '#999', fontWeight: 'bold' },
    priceInput: { flex: 1, fontSize: 16, fontWeight: 'bold', color: '#111', padding: 0 },
    
    ratingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF' },
    ratingRowActive: { borderColor: '#FDB913', backgroundColor: '#FFF8E1' },
    starsWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    starsText: { fontWeight: 'bold', fontSize: 14 },
    starsInner: { flexDirection: 'row' },
    
    offerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F9F9F9', borderRadius: 16 },
    offerRowActive: { backgroundColor: '#FFF8E1' },
    offerTitle: { fontSize: 16, fontWeight: 'bold', color: '#111', marginBottom: 2 },
    offerSub: { fontSize: 12, color: '#666' },
    toggleBg: { width: 50, height: 28, borderRadius: 14, backgroundColor: '#CCC', padding: 2 },
    toggleBgActive: { backgroundColor: '#FDB913' },
    toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF' },
    toggleThumbActive: { transform: [{ translateX: 22 }] },
    
    footer: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderColor: '#EEE', backgroundColor: '#FFF', paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
    resetBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#F0F0F0', borderRadius: 12, alignItems: 'center' },
    resetText: { fontSize: 15, fontWeight: 'bold', color: '#555' },
    applyBtn: { flex: 2, paddingVertical: 14, backgroundColor: '#FDB913', borderRadius: 12, alignItems: 'center' },
    applyText: { fontSize: 15, fontWeight: 'bold', color: '#000' },
});