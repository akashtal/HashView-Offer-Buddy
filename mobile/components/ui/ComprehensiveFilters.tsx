import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import MobileFilterDrawer from './MobileFilterDrawer';

export interface FilterOptions {
    category?: string;
    sortBy?: 'relevance' | 'distance' | 'rating' | 'price-low' | 'price-high' | 'newest' | 'popular';
    hasOffer?: boolean;
    rating?: number;
    minPrice?: number;
    maxPrice?: number;
    query?: string;
}

export interface Facets {
    minPrice: number;
    maxPrice: number;
}

interface ComprehensiveFiltersProps {
    onApplyFilters: (filters: FilterOptions) => void;
    currentFilters?: FilterOptions;
    categories: any[];
    facets?: Facets;
}

export default function ComprehensiveFilters({ onApplyFilters, currentFilters = {}, categories = [], facets }: ComprehensiveFiltersProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeFiltersCount = Object.keys(currentFilters).filter(key => {
        const k = key as keyof FilterOptions;
        const value = currentFilters[k];
        if (k === 'sortBy') return false;
        if (k === 'minPrice' && (!value || value === 0)) return false;
        if (k === 'maxPrice' && (!value || value === 50000)) return false;
        if (k === 'query') return false;
        return value !== undefined && value !== 0 && value !== false && value !== '';
    }).length;

    return (
        <View>
            <TouchableOpacity 
                style={styles.button} 
                onPress={() => setIsOpen(true)}
                activeOpacity={0.7}
            >
                <Feather name="sliders" size={14} color="#666" />
                <Text style={styles.buttonText}>Filters</Text>
                {activeFiltersCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{activeFiltersCount}</Text>
                    </View>
                )}
            </TouchableOpacity>

            <MobileFilterDrawer
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                currentFilters={currentFilters}
                categories={categories}
                onApplyFilters={onApplyFilters}
                facets={facets}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    button: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#EEE', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    buttonText: { fontSize: 13, fontWeight: '600', color: '#555' },
    badge: { backgroundColor: '#FDB913', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, minWidth: 18, alignItems: 'center' },
    badgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
});
