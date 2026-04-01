import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { INDIAN_CITIES } from '@/utils/location-utils';
import { useLocation } from '@/context/LocationContext';
import PlacesAutocomplete from './PlacesAutocomplete';

interface LocationSearchProps {
    onLocationSelect?: (location: { latitude: number; longitude: number; city: string }) => void;
    className?: string; // Kept for compatibility
    variant?: 'default' | 'compact';
    style?: any;
}

export default function LocationSearch({ onLocationSelect, className = '', variant = 'default', style }: LocationSearchProps) {
    const { location, setManualLocation, isLoading } = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isGettingLocation, setIsGettingLocation] = useState(false);

    // Filter cities based on search query
    const filteredCities = searchQuery
        ? INDIAN_CITIES.filter(city =>
            city.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            city.state.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : INDIAN_CITIES;

    // Debug log
    console.log(`🔍 Search query: "${searchQuery}", Found ${filteredCities.length} cities`);

    const handleCitySelect = (city: typeof INDIAN_CITIES[0]) => {
        const locationData = {
            coordinates: city.coordinates,
            city: city.name,
            state: city.state,
            country: 'India'
        };

        setManualLocation(locationData);

        if (onLocationSelect) {
            onLocationSelect({
                latitude: city.coordinates.latitude,
                longitude: city.coordinates.longitude,
                city: city.name
            });
        }

        setShowDropdown(false);
        setSearchQuery('');
    };

    const handlePlaceSelect = async (placeId: string, description: string) => {
        console.log('📍 Place selected:', description);
        try {
            // Fetch place details to get coordinates
            const response = await fetch(`/api/google/places/details?placeId=${placeId}`);
            const data = await response.json();

            if (data.coordinates) {
                const [lng, lat] = data.coordinates;
                const locationData = {
                    coordinates: { latitude: lat, longitude: lng },
                    city: data.city || description.split(',')[0],
                    state: data.state,
                    country: data.country || 'India',
                    address: data.formattedAddress
                };

                console.log('✅ Setting location from place:', locationData);
                setManualLocation(locationData);

                if (onLocationSelect) {
                    onLocationSelect({
                        latitude: lat,
                        longitude: lng,
                        city: data.city || description.split(',')[0]
                    });
                }

                setShowDropdown(false);
                setSearchQuery('');
            }
        } catch (error) {
            console.error('❌ Error getting place details:', error);
            alert('Failed to get location details. Please try again.');
        }
    };

    const handleUseMyLocation = async () => {
        console.log('🟢 LocationSearch: Use My Location button clicked!');
        setIsGettingLocation(true);
        try {
            if (Platform.OS === 'web' && !navigator.geolocation) {
                console.error('❌ Geolocation NOT supported by browser');
                alert('Geolocation is not supported by your browser');
                setIsGettingLocation(false);
                return;
            }

            console.log('✅ Geolocation is supported, requesting position...');

            // React Native / Expo implementation (fallback to web if needed)
            const getLocation = async () => {
                let Location;
                try {
                    Location = await import('expo-location');
                    let { status } = await Location.requestForegroundPermissionsAsync();
                    if (status !== 'granted') {
                        let errorMessage = '📍 Please turn on location permissions in your settings.';
                        alert(errorMessage);
                        setIsGettingLocation(false);
                        return;
                    }
                    let position = await Location.getCurrentPositionAsync({});
                    processPosition({
                        coords: {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        }
                    });
                } catch (e) {
                    // Fallback to navigator
                    if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
                        const options = {
                            enableHighAccuracy: false, 
                            timeout: 30000, 
                            maximumAge: 300000 
                        };
                        navigator.geolocation.getCurrentPosition(
                            processPosition,
                            (error) => {
                                console.error('❌ GEOLOCATION ERROR:', error);
                                let errorMessage = '';
                                if (error.code === 1) {
                                    errorMessage = '📍 Please turn on location permissions in your browser settings.';
                                } else if (error.code === 2) {
                                    errorMessage = '📍 Turn on your device location (GPS) to continue.';
                                } else if (error.code === 3) {
                                    errorMessage = '📍 Location request timed out. Please try again.';
                                } else {
                                    errorMessage = '📍 Unable to get location. Please enable location services.';
                                }
                                alert(errorMessage);
                                setIsGettingLocation(false);
                            },
                            options
                        );
                    } else {
                        alert('Unable to get location. Please enable location services.');
                        setIsGettingLocation(false);
                    }
                }
            };

            const processPosition = async (position: any) => {
                console.log('✅ SUCCESS! Got position:', position.coords);

                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                console.log('🌍 Starting reverse geocoding...');
                const { reverseGeocode } = await import('@/utils/location-utils');
                const locationData = await reverseGeocode(coords);

                console.log('✅ Calling setManualLocation with:', locationData);
                setManualLocation(locationData);

                if (onLocationSelect) {
                    onLocationSelect({
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        city: locationData.city || 'Current Location'
                    });
                }

                setShowDropdown(false);
                setIsGettingLocation(false);
            };

            getLocation();
            
        } catch (error) {
            console.error('❌ Unexpected error:', error);
            alert('An error occurred while getting your location.');
            setIsGettingLocation(false);
        }
    };

    return (
        <View style={[styles.relative, style, className ? {} : {}]}>
            <TouchableOpacity
                onPress={() => setShowDropdown(!showDropdown)}
                style={[
                    styles.triggerBtn,
                    variant === 'compact' ? styles.triggerCompact : styles.triggerDefault
                ]}
            >
                {isLoading ? (
                    <View style={styles.flexRow}>
                        <ActivityIndicator size="small" color="#FDB913" style={{ marginRight: 8 }} />
                        <View style={styles.flexCol}>
                            {variant === 'default' && <Text style={styles.textXsMedium}>Detecting...</Text>}
                            <Text style={styles.textSmBoldTruncate}>Finding...</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.flexRow}>
                        <Feather 
                            name="map-pin" 
                            size={variant === 'compact' ? 16 : 18} 
                            color="#4B5563" 
                            style={{ marginRight: 8 }} 
                        />
                        <View style={styles.flexColMin0}>
                            {variant === 'default' && <Text style={styles.textXsMedium}>Showing near</Text>}
                            <Text 
                                style={[styles.textSmBoldTruncate, { maxWidth: variant === 'compact' ? 80 : 150 }]}
                                numberOfLines={1}
                            >
                                {location?.city || 'Select Location'}
                            </Text>
                        </View>
                    </View>
                )}
                <Feather
                    name="chevron-down"
                    size={14}
                    color="#9ca3af"
                    style={{ marginLeft: 8, transform: [{ rotate: showDropdown ? '180deg' : '0deg' }] }}
                />
            </TouchableOpacity>

            {showDropdown && (
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                        onPress={handleUseMyLocation}
                        disabled={isGettingLocation}
                        style={styles.useMyLocationBtn}
                    >
                        <View style={styles.navIconBox}>
                            <Feather name="navigation" size={16} color="#000" />
                        </View>
                        <View style={styles.flex1}>
                            <Text style={styles.useMyLocationTitle}>
                                {isGettingLocation ? 'Getting location...' : 'Use My Location'}
                            </Text>
                            <Text style={styles.useMyLocationSub}>Enable GPS for accurate results</Text>
                        </View>
                    </TouchableOpacity>

                    <View style={styles.searchBlock}>
                        <View style={styles.searchRelative}>
                            <Feather name="search" size={16} color="#9ca3af" style={styles.searchIconAbsolute} />
                            <TextInput
                                style={styles.searchInput}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholder="Search city..."
                                autoFocus
                            />
                        </View>
                    </View>

                    <ScrollView style={styles.resultsList} keyboardShouldPersistTaps="handled">
                        {searchQuery.length >= 2 && (
                            <PlacesAutocomplete
                                searchQuery={searchQuery}
                                onPlaceSelect={handlePlaceSelect}
                            />
                        )}

                        {(searchQuery.length === 0 || searchQuery.length >= 2) && filteredCities.length > 0 && (
                            <>
                                {searchQuery.length >= 2 && (
                                    <View style={styles.popularCitiesHeader}>
                                        <Text style={styles.popularCitiesText}>Popular Cities</Text>
                                    </View>
                                )}
                                {filteredCities.slice(0, 5).map((city) => (
                                    <TouchableOpacity
                                        key={`${city.name}-${city.state}`}
                                        onPress={() => handleCitySelect(city)}
                                        style={styles.cityRow}
                                    >
                                        <Feather name="map-pin" size={14} color="#9ca3af" style={{ flexShrink: 0, marginRight: 12 }} />
                                        <View style={styles.flex1Min0}>
                                            <Text style={styles.cityTitle}>{city.name}</Text>
                                            <Text style={styles.cityState}>{city.state}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </>
                        )}

                        {searchQuery.length > 0 && filteredCities.length === 0 && searchQuery.length < 2 && (
                            <View style={styles.emptySearch}>
                                <Text style={styles.emptySearchText}>Type at least 2 characters to search</Text>
                            </View>
                        )}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    relative: { zIndex: 50 },
    triggerBtn: { flexDirection: 'row', alignItems: 'center' },
    triggerCompact: { paddingHorizontal: 0, paddingVertical: 4 },
    triggerDefault: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
    flexRow: { flexDirection: 'row', alignItems: 'center' },
    flexCol: { flexDirection: 'column', alignItems: 'flex-start', minWidth: 80 },
    textXsMedium: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
    textSmBoldTruncate: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    flexColMin0: { flexDirection: 'column', alignItems: 'flex-start' },
    
    dropdownContainer: { position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 320, backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 15, borderWidth: 1, borderColor: '#E5E7EB', maxHeight: 400 },
    useMyLocationBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    navIconBox: { padding: 8, backgroundColor: '#FDB913', borderRadius: 20, marginRight: 12 },
    flex1: { flex: 1 },
    useMyLocationTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
    useMyLocationSub: { fontSize: 12, color: '#6B7280' },
    
    searchBlock: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    searchRelative: { position: 'relative', justifyContent: 'center' },
    searchIconAbsolute: { position: 'absolute', left: 12, zIndex: 1 },
    searchInput: { width: '100%', paddingLeft: 36, paddingRight: 12, paddingVertical: 8, fontSize: 14, borderRadius: 6, borderWidth: 1, borderColor: '#D1D5DB' },
    
    resultsList: { flex: 1, overflow: 'hidden' },
    popularCitiesHeader: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
    popularCitiesText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
    cityRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    flex1Min0: { flex: 1 },
    cityTitle: { fontSize: 14, fontWeight: '500', color: '#111827' },
    cityState: { fontSize: 12, color: '#6B7280' },
    
    emptySearch: { paddingHorizontal: 16, paddingVertical: 32, alignItems: 'center' },
    emptySearchText: { color: '#6B7280', fontSize: 14 },
});
