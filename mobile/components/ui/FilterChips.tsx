import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { FilterOptions } from './ComprehensiveFilters';

interface FilterChipsProps {
    currentFilters: FilterOptions;
    categories: any[];
    onApplyFilters: (filters: FilterOptions) => void;
}

export default function FilterChips({ currentFilters, categories, onApplyFilters }: FilterChipsProps) {
    const handleRemove = (key: keyof FilterOptions) => {
        const newFilters = { ...currentFilters };
        if (key === 'category') newFilters.category = undefined;
        else if (key === 'hasOffer') newFilters.hasOffer = false;
        else if (key === 'rating') newFilters.rating = 0;
        else if (key === 'minPrice') newFilters.minPrice = 0;
        else if (key === 'maxPrice') newFilters.maxPrice = 50000;
        onApplyFilters(newFilters);
    };

    const chips = [];

    if (currentFilters.category) {
        const catName = categories.find(c => c._id === currentFilters.category)?.name || 'Category';
        chips.push({ key: 'category', label: catName });
    }
    if (currentFilters.hasOffer) {
        chips.push({ key: 'hasOffer', label: 'Offers Only' });
    }
    if (currentFilters.rating && currentFilters.rating > 0) {
        chips.push({ key: 'rating', label: `${currentFilters.rating}+ Stars` });
    }
    if ((currentFilters.minPrice && currentFilters.minPrice > 0) || (currentFilters.maxPrice && currentFilters.maxPrice < 50000)) {
        chips.push({ key: 'price', label: `₹${currentFilters.minPrice || 0} - ₹${currentFilters.maxPrice || 50000}` });
    }

    if (chips.length === 0) return null;

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.container}>
            {chips.map((chip: any) => (
                <TouchableOpacity 
                    key={chip.key} 
                    style={styles.chip}
                    onPress={() => handleRemove(chip.key === 'price' ? 'minPrice' : chip.key)}
                >
                    <Text style={styles.chipText}>{chip.label}</Text>
                    <Feather name="x" size={12} color="#666" />
                </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => onApplyFilters({})} style={styles.clearBtn}>
                <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    chip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0F0F0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    chipText: { fontSize: 12, fontWeight: '600', color: '#333' },
    clearBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    clearText: { color: '#B45309', fontSize: 12, fontWeight: '600', textDecorationLine: 'underline' },
});
