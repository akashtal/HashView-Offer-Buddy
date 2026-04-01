import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { MapPin, ChevronDown } from 'lucide-react-native';
import { useLocation } from '@/context/LocationContext';
import { INDIAN_CITIES } from '@/utils/location-utils';

export default function LocationSelector() {
    const { location, isLoading, requestLocation, setManualLocation } = useLocation();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleDetectLocation = async () => {
        await requestLocation();
        setShowDropdown(false);
    };

    const handleCitySelect = (city: typeof INDIAN_CITIES[0]) => {
        setManualLocation({
            coordinates: city.coordinates,
            city: city.name,
            state: city.state,
            country: 'India'
        });
        setShowDropdown(false);
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={() => setShowDropdown(!showDropdown)}
                style={styles.trigger}
            >
                <MapPin size={18} color="#2E3192" />
                <Text style={styles.triggerText}>
                    {location?.city || 'Select Location'}
                </Text>
                <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>

            {showDropdown && (
                <View style={styles.dropdown}>
                    <TouchableOpacity
                        onPress={handleDetectLocation}
                        disabled={isLoading}
                        style={styles.detectBtn}
                    >
                        <MapPin size={18} color="#2E3192" />
                        <Text style={styles.detectBtnText}>
                            {isLoading ? 'Detecting...' : 'Detect My Location'}
                        </Text>
                    </TouchableOpacity>

                    <ScrollView style={styles.cityList}>
                        <Text style={styles.sectionTitle}>Popular Cities</Text>
                        {INDIAN_CITIES.map((city) => (
                            <TouchableOpacity
                                key={city.name}
                                onPress={() => handleCitySelect(city)}
                                style={styles.cityRow}
                            >
                                <Text style={styles.cityName}>{city.name}</Text>
                                <Text style={styles.cityState}>{city.state}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { position: 'relative', zIndex: 50 },
    trigger: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
    triggerText: { fontSize: 14, fontWeight: '500', color: '#374151', flex: 1 },
    dropdown: { position: 'absolute', top: '100%', left: 0, width: 288, backgroundColor: '#FFF', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 15, elevation: 15, borderWidth: 1, borderColor: '#E5E7EB', maxHeight: 400 },
    detectBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
    detectBtnText: { fontSize: 14, fontWeight: '500', color: '#2E3192' },
    cityList: { paddingVertical: 8 },
    sectionTitle: { paddingHorizontal: 16, paddingVertical: 8, fontSize: 12, fontWeight: '600', color: '#6B7280', textTransform: 'uppercase' },
    cityRow: { paddingHorizontal: 16, paddingVertical: 8 },
    cityName: { fontSize: 14, fontWeight: '500', color: '#111827' },
    cityState: { fontSize: 12, color: '#6B7280' },
});
