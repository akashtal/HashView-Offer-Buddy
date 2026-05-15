/**
 * AI Product Enhancement Screen
 *
 * Vendors come here after uploading a product image. They can:
 *  1. Select a predefined AI Style ("Amazon Clean", "Luxury Gold", etc.)
 *  2. Upload their own model/scene photo for custom compositing
 *  3. Trigger AI enhancement and see a before/after result
 *  4. Promote the enhanced image to the product gallery or skip
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface AiStyle {
  _id: string;
  name: string;
  slug: string;
  thumbnailUrl?: string;
}

type Mode = 'style' | 'custom-scene' | null;

// ─────────────────────────────────────────────────────────────
// Processing animation messages
// ─────────────────────────────────────────────────────────────
const PROCESSING_STEPS = [
  '🔍 Analysing your image…',
  '✂️  Removing background…',
  '🎨 Applying AI magic…',
  '✨ Generating styled photo…',
  '☁️  Uploading result…',
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function VendorAiEnhanceScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { token } = useAuthStore();

  // Passed in from the product create/edit screen
  const productId = params.productId as string;
  const imageUrl = params.imageUrl as string;
  const productName = (params.productName as string) || 'product';
  const isPreview = !productId || productId === 'preview'; // no saved product yet

  // State
  const [aiStyles, setAiStyles] = useState<AiStyle[]>([]);
  const [loadingStyles, setLoadingStyles] = useState(true);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(null);

  const [customSceneUrl, setCustomSceneUrl] = useState<string | null>(null);
  const [uploadingScene, setUploadingScene] = useState(false);

  const [processing, setProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);

  const [showAfter, setShowAfter] = useState(false);  // before/after toggle

  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const processingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Load AI Styles ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        // Use public /api/ai-styles — no admin auth required
        const res = await axios.get('/api/ai-styles', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAiStyles(res.data.data.styles || []);
      } catch (e) {
        console.error('Failed to load AI styles', e);
      } finally {
        setLoadingStyles(false);
      }
    })();
  }, []);

  // ── Pulse animation while processing ───────────────────────
  useEffect(() => {
    if (processing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0.97, duration: 700, useNativeDriver: true }),
        ])
      ).start();
      processingInterval.current = setInterval(() => {
        setProcessingStep(s => (s + 1) % PROCESSING_STEPS.length);
      }, 3500);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (processingInterval.current) clearInterval(processingInterval.current);
    }
    return () => { if (processingInterval.current) clearInterval(processingInterval.current); };
  }, [processing]);

  // ── Select predefined style ─────────────────────────────────
  const selectStyle = (id: string) => {
    setSelectedStyleId(id);
    setMode('style');
    setCustomSceneUrl(null);
  };

  // ── Select custom scene mode ────────────────────────────────
  const selectCustomScene = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to upload a scene.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return;

    setUploadingScene(true);
    try {
      const asset = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || 'scene.jpg',
      } as any);

      const res = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });
      const url = res.data.data.url as string;
      setCustomSceneUrl(url);
      setMode('custom-scene');
      setSelectedStyleId(null);
    } catch (err: any) {
      Alert.alert('Upload failed', err.message || 'Could not upload scene image');
    } finally {
      setUploadingScene(false);
    }
  };

  // ── Trigger AI Enhancement ──────────────────────────────────
  const handleEnhance = async () => {
    if (!mode) {
      Alert.alert('Select a style', 'Please choose an AI style or upload a custom scene first.');
      return;
    }

    setProcessing(true);
    setProcessingStep(0);
    setEnhancedUrl(null);

    try {
      const payload: any = {
        // If no real productId, use a temp placeholder — backend handles it
        productId: isPreview ? 'preview' : productId,
        imageUrl,
        mode,
        productName,
      };
      if (mode === 'style') payload.styleId = selectedStyleId;
      if (mode === 'custom-scene') payload.customSceneUrl = customSceneUrl;

      const res = await axios.post('/api/vendor/products/ai-enhance', payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 120_000,
      });

      const immediateUrl = res.data.data.enhancedUrl;
      if (immediateUrl) {
        setEnhancedUrl(immediateUrl);
        setShowAfter(true);
        return;
      }

      const entryId = res.data.data.aiGalleryEntryId;
      if (!entryId) throw new Error('No enhancement job returned from server');

      const maxPolls = 50;
      for (let i = 0; i < maxPolls; i++) {
        await new Promise(resolve => setTimeout(resolve, 4000));
        const statusRes = await axios.get(
          `/api/vendor/products/ai-enhance/status?productId=${productId}&entryId=${entryId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { status, enhancedUrl: doneUrl } = statusRes.data.data;
        if (status === 'done' && doneUrl) {
          setEnhancedUrl(doneUrl);
          setShowAfter(true);
          return;
        }
        if (status === 'failed') throw new Error('AI generation failed. Please try another style.');
      }

      throw new Error('AI processing timed out. Please try again.');
    } catch (err: any) {
      Alert.alert(
        'Enhancement failed',
        err.response?.data?.error || err.message || 'AI processing failed. Please try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // ── Promote to primary images / return to create screen ─────
  const handlePromote = async () => {
    if (!enhancedUrl) return;

    if (isPreview) {
      // No saved product yet — go back to create screen with the enhanced URL
      // The create screen will add this as an additional image
      Alert.alert('✅ Done!', 'AI-enhanced image ready! It will be added to your product images.', [
        {
          text: 'Use This Image',
          onPress: () =>
            router.replace({
              pathname: '/vendor/products/create',
              params: { aiEnhancedUrl: enhancedUrl },
            } as any),
        },
      ]);
      return;
    }

    try {
      await axios.post(
        '/api/vendor/products/ai-promote',
        { productId, enhancedUrl },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✅ Done!', 'AI image added to your product gallery!', [
        { text: 'Go to Dashboard', onPress: () => router.push('/vendor/dashboard') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save image');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color="#111827" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>✨ AI Enhancement</Text>
          <Text style={styles.headerSub}>Transform your product photo</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* ── Before/After Preview ── */}
        <View style={styles.previewCard}>
          <View style={styles.previewToggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, !showAfter && styles.toggleBtnActive]}
              onPress={() => setShowAfter(false)}
            >
              <Text style={[styles.toggleBtnText, !showAfter && styles.toggleBtnTextActive]}>Before</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, showAfter && styles.toggleBtnActive]}
              onPress={() => enhancedUrl && setShowAfter(true)}
              disabled={!enhancedUrl}
            >
              <Text style={[styles.toggleBtnText, showAfter && styles.toggleBtnTextActive]}>After</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.imagePreviewWrap}>
            {processing ? (
              <Animated.View style={[styles.processingOverlay, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.processingInner}>
                  <ActivityIndicator size="large" color="#7C3AED" />
                  <Text style={styles.processingTitle}>AI is working…</Text>
                  <Text style={styles.processingStep}>{PROCESSING_STEPS[processingStep]}</Text>
                </View>
              </Animated.View>
            ) : (
              <Image
                source={{ uri: (showAfter && enhancedUrl) ? enhancedUrl : imageUrl }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}

            {!processing && showAfter && enhancedUrl && (
              <View style={styles.afterBadge}>
                <Text style={styles.afterBadgeText}>✨ AI Enhanced</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Style Selection ── */}
        {!enhancedUrl && (
          <>
            <Text style={styles.sectionTitle}>Choose Your AI Style</Text>
            <Text style={styles.sectionSub}>Pick a look for your product</Text>

            {loadingStyles ? (
              <ActivityIndicator color="#7C3AED" style={{ marginVertical: 20 }} />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stylesRow}>

                {/* Custom Scene Option */}
                <TouchableOpacity
                  style={[
                    styles.styleCard,
                    mode === 'custom-scene' && styles.styleCardSelected,
                    styles.customStyleCard,
                  ]}
                  onPress={selectCustomScene}
                  disabled={uploadingScene}
                >
                  {uploadingScene ? (
                    <ActivityIndicator color="#7C3AED" />
                  ) : customSceneUrl ? (
                    <Image source={{ uri: customSceneUrl }} style={styles.customSceneThumbnail} />
                  ) : (
                    <View style={styles.customScenePlaceholder}>
                      <Feather name="user" size={28} color="#7C3AED" />
                    </View>
                  )}
                  <Text style={[styles.styleCardName, mode === 'custom-scene' && styles.styleCardNameSelected]}>
                    {customSceneUrl ? 'Custom Scene' : '+ My Model'}
                  </Text>
                  {mode === 'custom-scene' && (
                    <View style={styles.selectedBadge}>
                      <Feather name="check" size={10} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Predefined Styles */}
                {aiStyles.map(s => (
                  <TouchableOpacity
                    key={s._id}
                    style={[styles.styleCard, selectedStyleId === s._id && styles.styleCardSelected]}
                    onPress={() => selectStyle(s._id)}
                  >
                    {s.thumbnailUrl ? (
                      <Image source={{ uri: s.thumbnailUrl }} style={styles.styleThumbnail} />
                    ) : (
                      <View style={styles.styleThumbnailPlaceholder}>
                        <Text style={styles.stylePlaceholderEmoji}>
                          {s.slug === 'amazon-clean' ? '🛒' :
                           s.slug === 'luxury-gold' ? '✨' :
                           s.slug === 'instagram-viral' ? '📸' :
                           s.slug === 'nike-style' ? '💪' :
                           s.slug === 'nature-organic' ? '🌿' : '🎨'}
                        </Text>
                      </View>
                    )}
                    <Text style={[styles.styleCardName, selectedStyleId === s._id && styles.styleCardNameSelected]}>
                      {s.name}
                    </Text>
                    {selectedStyleId === s._id && (
                      <View style={styles.selectedBadge}>
                        <Feather name="check" size={10} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Info Card */}
            <View style={styles.infoCard}>
              <Feather name="info" size={14} color="#7C3AED" />
              <Text style={styles.infoText}>
                <Text style={{ fontWeight: '600' }}>Tip: </Text>
                Tap "+ My Model" to use your own model photo or any background you want. The AI will naturally composite your product into that scene.
              </Text>
            </View>

            {/* Enhance Button */}
            <TouchableOpacity
              style={[styles.enhanceBtn, (!mode || processing) && styles.enhanceBtnDisabled]}
              onPress={handleEnhance}
              disabled={!mode || processing}
            >
              {processing ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Feather name="zap" size={18} color="#FFF" style={{ marginRight: 8 }} />
                  <Text style={styles.enhanceBtnText}>
                    {mode === 'custom-scene'
                      ? 'Place in Custom Scene'
                      : mode === 'style'
                      ? `Apply ${aiStyles.find(s => s._id === selectedStyleId)?.name || 'Style'}`
                      : 'Select a Style First'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* ── Result Actions ── */}
        {enhancedUrl && !processing && (
          <View style={styles.resultActions}>
            <View style={styles.resultSuccessBox}>
              <Feather name="check-circle" size={20} color="#059669" />
              <Text style={styles.resultSuccessText}>AI enhancement complete! 🎉</Text>
            </View>

            <TouchableOpacity style={styles.promoteBtn} onPress={handlePromote}>
              <Feather name="image" size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.promoteBtnText}>Add to Product Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => { setEnhancedUrl(null); setShowAfter(false); setMode(null); setSelectedStyleId(null); setCustomSceneUrl(null); }}
            >
              <Feather name="refresh-cw" size={14} color="#7C3AED" style={{ marginRight: 6 }} />
              <Text style={styles.retryBtnText}>Try a Different Style</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.skipBtn} onPress={() => router.back()}>
              <Text style={styles.skipBtnText}>Skip & use original image</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────
const PURPLE = '#7C3AED';
const PURPLE_LIGHT = '#EDE9FE';

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F3FF' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  headerSub: { fontSize: 12, color: '#6B7280', marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 120 },

  // Preview card
  previewCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  previewToggleRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  toggleBtnActive: { backgroundColor: PURPLE },
  toggleBtnText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleBtnTextActive: { color: '#FFF' },

  imagePreviewWrap: {
    width: '100%',
    height: 280,
    backgroundColor: '#F9FAFB',
    position: 'relative',
  },
  previewImage: { width: '100%', height: '100%' },

  processingOverlay: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F3FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingInner: { alignItems: 'center', gap: 12 },
  processingTitle: { fontSize: 17, fontWeight: '700', color: PURPLE },
  processingStep: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 4 },

  afterBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: PURPLE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  afterBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  // Section labels
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 2 },
  sectionSub: { fontSize: 13, color: '#6B7280', marginBottom: 14 },

  // Styles row
  stylesRow: { marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 16 },
  styleCard: {
    width: 100,
    marginRight: 10,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    padding: 10,
    position: 'relative',
  },
  styleCardSelected: { borderColor: PURPLE, backgroundColor: PURPLE_LIGHT },
  customStyleCard: { borderStyle: 'dashed', borderColor: PURPLE },
  styleThumbnail: { width: 64, height: 64, borderRadius: 8, marginBottom: 6 },
  styleThumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  stylePlaceholderEmoji: { fontSize: 28 },
  customSceneThumbnail: { width: 64, height: 64, borderRadius: 8, marginBottom: 6 },
  customScenePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: PURPLE_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  styleCardName: { fontSize: 11, color: '#374151', textAlign: 'center', fontWeight: '500' },
  styleCardNameSelected: { color: PURPLE, fontWeight: '700' },
  selectedBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: PURPLE,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info card
  infoCard: {
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  infoText: { fontSize: 12, color: '#4C1D95', flex: 1, lineHeight: 18 },

  // Enhance button
  enhanceBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  enhanceBtnDisabled: { backgroundColor: '#C4B5FD', shadowOpacity: 0 },
  enhanceBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  // Result actions
  resultActions: { gap: 12 },
  resultSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  resultSuccessText: { fontSize: 14, fontWeight: '600', color: '#065F46' },

  promoteBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoteBtnText: { color: '#FFF', fontSize: 15, fontWeight: '700' },

  retryBtn: {
    borderWidth: 1.5,
    borderColor: PURPLE,
    borderRadius: 12,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: { color: PURPLE, fontSize: 14, fontWeight: '600' },

  skipBtn: { alignItems: 'center', paddingVertical: 12 },
  skipBtnText: { color: '#9CA3AF', fontSize: 13 },
});
