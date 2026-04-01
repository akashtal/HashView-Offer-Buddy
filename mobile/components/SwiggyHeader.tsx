import { MapPin, ChevronDown, Search } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocation } from '@/context/LocationContext';
import { INDIAN_CITIES } from '@/utils/location-utils';

export default function SwiggyHeader() {
    const { location, setManualLocation } = useLocation();
    const [showLocationDropdown, setShowLocationDropdown] = useState(false);
    const [searchText, setSearchText] = useState('');
    const router = useRouter();

    const handleSearch = () => {
        if (searchText.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchText.trim())}` as any);
        }
    };

    return (
        <View style={styles.header}>
            {/* Location Selector */}
            <View style={styles.locationWrap}>
                <TouchableOpacity
                    onPress={() => setShowLocationDropdown(!showLocationDropdown)}
                    style={styles.locationBtn}
                >
                    <MapPin size={20} color="#FD9139" />
                    <View style={styles.locationTextWrap}>
                        <Text style={styles.deliverTo}>Deliver to</Text>
                        <View style={styles.locationRow}>
                            <Text style={styles.locationCity} numberOfLines={1}>
                                {location?.city || 'Select Location'}
                            </Text>
                            <ChevronDown size={16} color="#282C3F" />
                        </View>
                    </View>
                </TouchableOpacity>

                {showLocationDropdown && (
                    <>
                        {/* Backdrop */}
                        <TouchableOpacity
                            style={styles.backdrop}
                            onPress={() => setShowLocationDropdown(false)}
                            activeOpacity={1}
                        />
                        {/* Dropdown */}
                        <View style={styles.dropdown}>
                            <Text style={styles.dropdownTitle}>Popular Cities</Text>
                            <ScrollView style={styles.cityScroll}>
                                {INDIAN_CITIES.map((city) => (
                                    <TouchableOpacity
                                        key={city.name}
                                        onPress={() => {
                                            setManualLocation({
                                                coordinates: city.coordinates,
                                                city: city.name,
                                                state: city.state,
                                                country: 'India'
                                            });
                                            setShowLocationDropdown(false);
                                        }}
                                        style={styles.cityBtn}
                                    >
                                        <Text style={styles.cityName}>{city.name}</Text>
                                        <Text style={styles.cityState}>{city.state}</Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </>
                )}
            </View>

            {/* Search Bar */}
            <View style={styles.searchWrap}>
                <Search size={18} color="#686B78" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for products..."
                    value={searchText}
                    onChangeText={setSearchText}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                    placeholderTextColor="#A0A0A8"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    header: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E9E9EB', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, zIndex: 40 },
    locationWrap: { position: 'relative' },
    locationBtn: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    locationTextWrap: { flexDirection: 'column' },
    deliverTo: { fontSize: 11, color: '#686B78' },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    locationCity: { fontSize: 14, fontWeight: '600', color: '#282C3F', maxWidth: 100 },
    backdrop: { position: 'absolute', top: '100%', left: -200, right: -200, bottom: -1000, zIndex: 40 },
    dropdown: { position: 'absolute', top: '100%', left: 0, marginTop: 8, width: 280, backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 12, borderWidth: 1, borderColor: '#E9E9EB', zIndex: 50, maxHeight: 300 },
    dropdownTitle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, fontSize: 13, fontWeight: '600', color: '#282C3F' },
    cityScroll: { flex: 1 },
    cityBtn: { paddingHorizontal: 16, paddingVertical: 10 },
    cityName: { fontSize: 14, fontWeight: '500', color: '#282C3F' },
    cityState: { fontSize: 12, color: '#686B78' },
    searchWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#F4F4F4', borderRadius: 8, paddingHorizontal: 12, height: 42 },
    searchIcon: { marginRight: 8 },
    searchInput: { flex: 1, fontSize: 14, color: '#282C3F', padding: 0 },
});
