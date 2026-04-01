import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Modal } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface RadiusFilterProps {
    value: number;
    onChange: (radius: number) => void;
}

export default function RadiusFilter({ value, onChange }: RadiusFilterProps) {
    const [showCustom, setShowCustom] = useState(false);
    const [customValue, setCustomValue] = useState(value.toString());

    const presetRadii = [5, 10, 20, 50];
    const isCustom = !presetRadii.includes(value);

    const handlePresetClick = (radius: number) => {
        setShowCustom(false);
        onChange(radius);
    };

    const handleCustomSubmit = () => {
        const parsed = parseInt(customValue);
        if (!isNaN(parsed) && parsed > 0 && parsed <= 100) {
            onChange(parsed);
            setShowCustom(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.labelWrap}>
                <Feather name="map-pin" size={12} color="#FDB913" />
            </View>

            <View style={styles.pickerWrap}>
                {presetRadii.map((radius) => {
                    const isActive = value === radius && !showCustom;
                    return (
                        <TouchableOpacity
                            key={radius}
                            onPress={() => handlePresetClick(radius)}
                            style={[styles.pill, isActive && styles.pillActive]}
                        >
                            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                                {radius}km
                            </Text>
                        </TouchableOpacity>
                    );
                })}

                {!showCustom ? (
                    <TouchableOpacity
                        onPress={() => setShowCustom(true)}
                        style={[styles.pill, styles.pillCustomBtn, isCustom && styles.pillActive]}
                    >
                        {isCustom ? (
                            <Text style={[styles.pillText, styles.pillTextActive]}>{value}km</Text>
                        ) : (
                            <Feather name="plus" size={14} color="#666" />
                        )}
                    </TouchableOpacity>
                ) : (
                    <View style={styles.customInputWrap}>
                        <TextInput
                            style={styles.customInput}
                            value={customValue}
                            onChangeText={setCustomValue}
                            keyboardType="number-pad"
                            maxLength={3}
                            autoFocus
                        />
                        <TouchableOpacity style={styles.customSubmit} onPress={handleCustomSubmit}>
                            <Feather name="check" size={12} color="#000" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    labelWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#EEE' },
    pickerWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', padding: 4, borderRadius: 20, borderWidth: 1, borderColor: '#F0F0F0' },
    pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
    pillActive: { backgroundColor: '#FDB913' },
    pillText: { fontSize: 12, fontWeight: 'bold', color: '#666' },
    pillTextActive: { color: '#000' },
    pillCustomBtn: { width: 32, paddingHorizontal: 0, alignItems: 'center', justifyContent: 'center' },
    customInputWrap: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 4 },
    customInput: { width: 40, borderBottomWidth: 1, borderBottomColor: '#CCC', fontSize: 13, fontWeight: 'bold', textAlign: 'center', color: '#000', paddingVertical: 2 },
    customSubmit: { width: 24, height: 24, backgroundColor: '#FDB913', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
