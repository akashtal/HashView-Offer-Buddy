import React, { ReactNode } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps, ViewStyle } from 'react-native';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    icon?: ReactNode;
    style?: any;
    editable?: boolean;
}

export default function Input({ label, error, icon, style, editable = true, ...props }: InputProps) {
    return (
        <View style={[styles.wrapper, style]}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={[styles.inputRow, !editable && styles.inputDisabled, !!error && styles.inputError]}>
                {icon && <View style={styles.iconWrap}>{icon}</View>}
                <TextInput
                    style={[styles.input, !!icon && styles.inputWithIcon]}
                    editable={editable}
                    placeholderTextColor="#AAA"
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: { marginBottom: 4 },
    label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        backgroundColor: '#FAFAFA',
        paddingHorizontal: 12,
    },
    inputDisabled: { backgroundColor: '#F3F3F3' },
    inputError: { borderColor: '#E53935' },
    iconWrap: { marginRight: 8 },
    input: { flex: 1, fontSize: 14, color: '#333', paddingVertical: 11 },
    inputWithIcon: { paddingLeft: 0 },
    errorText: { fontSize: 12, color: '#E53935', marginTop: 4 },
});
