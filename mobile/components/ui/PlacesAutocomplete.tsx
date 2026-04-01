import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';

interface PlacePrediction {
    description: string;
    place_id: string;
}

interface PlacesAutocompleteProps {
    searchQuery: string;
    onPlaceSelect: (placeId: string, description: string) => void;
}

export default function PlacesAutocomplete({ searchQuery, onPlaceSelect }: PlacesAutocompleteProps) {
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (searchQuery.length < 3) {
            setPredictions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setIsLoading(true);
            try {
                // Mock API or actual backend ping
                const response = await axios.get(`/api/google/places/autocomplete?input=${encodeURIComponent(searchQuery)}`);
                const data = response.data;
                
                if (data.predictions) {
                    setPredictions(data.predictions);
                } else {
                    setPredictions([]);
                }
            } catch (error) {
                console.error('Places search error:', error);
                setPredictions([]);
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    if (searchQuery.length < 3) {
        return null;
    }

    if (isLoading) {
        return (
            <View style={styles.stateContainer}>
                <ActivityIndicator size="small" color="#9CA3AF" />
                <Text style={styles.stateText}>Searching...</Text>
            </View>
        );
    }

    if (predictions.length === 0 && searchQuery.length >= 3) {
        return (
            <View style={styles.stateContainer}>
                <Text style={styles.stateText}>No locations found</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {predictions.map((prediction) => (
                <TouchableOpacity
                    key={prediction.place_id}
                    onPress={() => onPlaceSelect(prediction.place_id, prediction.description)}
                    style={styles.item}
                >
                    <Feather name="map-pin" size={14} color="#9CA3AF" style={styles.icon} />
                    <Text style={styles.description} numberOfLines={2}>
                        {prediction.description}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { backgroundColor: '#FFF' },
    stateContainer: { padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
    stateText: { color: '#6B7280', fontSize: 13 },
    item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#F3F4F6' },
    icon: { marginRight: 12 },
    description: { fontSize: 14, color: '#111827', flex: 1 },
});
