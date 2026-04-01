import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import PlacesAutocomplete from './PlacesAutocomplete';
import axios from 'axios';

interface AddressAutocompleteProps {
    label?: string;
    error?: string;
    value: string;
    onChange: (value: string) => void;
    onSelect: (details: any) => void;
    placeholder?: string;
    containerStyle?: any;
    inputStyle?: any;
}

export default function AddressAutocomplete({
    label,
    error,
    value,
    onChange,
    onSelect,
    placeholder,
    containerStyle,
    inputStyle
}: AddressAutocompleteProps) {
    const [isFocused, setIsFocused] = useState(false);

    const handlePlaceSelect = async (placeId: string, description: string) => {
        onChange(description);
        setIsFocused(false);
        Keyboard.dismiss();

        try {
            const response = await axios.get(`/api/google/places/details?placeId=${placeId}`);
            const data = response.data;

            if (data.coordinates) {
                const [lng, lat] = data.coordinates;
                const details = {
                    coordinates: { latitude: lat, longitude: lng },
                    city: data.city,
                    state: data.state,
                    country: data.country || 'India',
                    pincode: data.pincode,
                    address: data.formattedAddress
                };
                onSelect(details);
            }
        } catch (error) {
            console.error('Failed to fetch place details:', error);
        }
    };

    return (
        <View style={[styles.container, containerStyle, { zIndex: isFocused ? 1000 : 1 }]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                <Feather name="map-pin" size={18} color="#9CA3AF" style={styles.icon} />
                <TextInput
                    style={[styles.input, inputStyle, error && styles.inputError]}
                    placeholder={placeholder}
                    value={value}
                    onChangeText={(val) => {
                        onChange(val);
                        if (!isFocused) setIsFocused(true);
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => {
                        // Small delay to allow place selection tap to register before dropdown unmounts
                        setTimeout(() => setIsFocused(false), 200);
                    }}
                />
            </View>
            
            {error && <Text style={styles.errorText}>{error}</Text>}

            {isFocused && value.length >= 2 && (
                <View style={styles.dropdown}>
                    <PlacesAutocomplete
                        searchQuery={value}
                        onPlaceSelect={handlePlaceSelect}
                    />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', position: 'relative' },
    label: { fontSize: 13, fontWeight: '500', color: '#4B5563', marginBottom: 6 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 6, backgroundColor: '#FFF' },
    icon: { paddingLeft: 12 },
    input: { flex: 1, paddingVertical: 10, paddingHorizontal: 10, fontSize: 14, color: '#111827' },
    inputError: { borderColor: '#EF4444' },
    errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
    dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, maxHeight: 250, zIndex: 1000 }
});
