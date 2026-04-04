import React, { useEffect, useRef } from 'react';
import {
    Animated,
    Easing,
    Image,
    StyleSheet,
    Text,
    View,
} from 'react-native';

interface AnimatedSplashScreenProps {
    onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
    // --- Animation values ---
    const logoScale   = useRef(new Animated.Value(0.4)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const ringScale   = useRef(new Animated.Value(0.6)).current;
    const ringOpacity = useRef(new Animated.Value(0)).current;
    const tagOpacity  = useRef(new Animated.Value(0)).current;
    const slideUp     = useRef(new Animated.Value(0)).current;
    const shimmer     = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 1. Shimmer pulse on ring (loops)
        const shimmerLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 900, easing: Easing.ease, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0, duration: 900, easing: Easing.ease, useNativeDriver: true }),
            ])
        );
        shimmerLoop.start();

        // 2. Entrance sequence
        Animated.sequence([
            // Ring pops in first
            Animated.parallel([
                Animated.timing(ringOpacity, { toValue: 0.35, duration: 400, useNativeDriver: true }),
                Animated.spring(ringScale,   { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
            ]),
            // Logo scales in with spring bounce
            Animated.parallel([
                Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
                Animated.spring(logoScale,   { toValue: 1, friction: 5, tension: 50, useNativeDriver: true }),
            ]),
            // Tagline fades in
            Animated.delay(100),
            Animated.timing(tagOpacity, { toValue: 1, duration: 500, easing: Easing.out(Easing.exp), useNativeDriver: true }),
            // Hold for reading
            Animated.delay(900),
            // Slide whole screen up & out
            Animated.timing(slideUp, { toValue: -900, duration: 500, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        ]).start(() => {
            shimmerLoop.stop();
            onFinish();
        });
    }, []);

    const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.5] });
    const shimmerScale   = shimmer.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

    return (
        <Animated.View style={[styles.container, { transform: [{ translateY: slideUp }] }]}>
            {/* Ambient glow blobs */}
            <View style={[styles.blob, styles.blobTopRight]} />
            <View style={[styles.blob, styles.blobBottomLeft]} />

            {/* Pulsing ring behind logo */}
            <Animated.View
                style={[
                    styles.ring,
                    {
                        opacity: shimmerOpacity,
                        transform: [{ scale: shimmerScale }, { scale: ringScale }],
                    },
                ]}
            />
            <Animated.View style={[styles.ring, styles.ring2, { opacity: ringOpacity, transform: [{ scale: ringScale }] }]} />

            {/* Logo */}
            <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
                <Image
                    source={require('@/assets/images/logo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </Animated.View>

            {/* Tagline */}
            <Animated.View style={{ opacity: tagOpacity }}>
                <Text style={styles.tagline}>Discover deals near you</Text>
                <View style={styles.dotRow}>
                    {[0, 1, 2].map((i) => (
                        <View key={i} style={[styles.dot, i === 1 && styles.dotGold]} />
                    ))}
                </View>
            </Animated.View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 999,
    },

    // Ambient color blobs
    blob: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        opacity: 0.08,
    },
    blobTopRight: {
        backgroundColor: '#FDB913',
        top: -80,
        right: -80,
    },
    blobBottomLeft: {
        backgroundColor: '#FDB913',
        bottom: -80,
        left: -80,
    },

    // Pulsing rings
    ring: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: 140,
        borderWidth: 2,
        borderColor: '#FDB913',
    },
    ring2: {
        width: 230,
        height: 230,
        borderRadius: 115,
        borderColor: '#FFF',
        opacity: 0.1,
    },

    // Logo
    logo: {
        width: 220,
        height: 220,
    },

    // Tagline
    tagline: {
        color: '#AAAAAA',
        fontSize: 14,
        letterSpacing: 1.5,
        textAlign: 'center',
        marginTop: 24,
        fontWeight: '400',
        textTransform: 'uppercase',
    },
    dotRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#555',
    },
    dotGold: {
        backgroundColor: '#FDB913',
        width: 18,
    },
});
