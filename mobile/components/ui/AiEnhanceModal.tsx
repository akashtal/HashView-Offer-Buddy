import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import * as ImagePicker from 'expo-image-picker';
import Button from './Button';

interface AiStyle {
  _id: string;
  name: string;
  thumbnailUrl?: string;
}

interface AiEnhanceModalProps {
  visible: boolean;
  onClose: () => void;
  imageUrl: string;
  productId: string;
  productName: string;
  onSuccess: (newImageUrl: string) => void;
}

export default function AiEnhanceModal({ visible, onClose, imageUrl, productId, productName, onSuccess }: AiEnhanceModalProps) {
  const token = useAuthStore(state => state.token);
  
  const [mode, setMode] = useState<'style' | 'custom-scene'>('style');
  const [aiStyles, setAiStyles] = useState<AiStyle[]>([]);
  const [selectedStyleId, setSelectedStyleId] = useState<string>('');
  
  const [customSceneUrl, setCustomSceneUrl] = useState<string>('');
  const [uploadingScene, setUploadingScene] = useState(false);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) {
      loadStyles();
      setMode('style');
      setIsProcessing(false);
      setStatusText('');
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  const loadStyles = async () => {
    try {
      const res = await axios.get('/api/ai-styles', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.data) {
        setAiStyles(res.data.data.styles);
        if (res.data.data.styles.length > 0) {
          setSelectedStyleId(res.data.data.styles[0]._id);
        }
      }
    } catch (err) {
      console.error('Failed to load styles', err);
    }
  };

  const pickAndUploadScene = async () => {
    try {
      setUploadingScene(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      
      if (result.canceled || !result.assets?.[0]) return;
      
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
      setCustomSceneUrl(res.data.data.url);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message || 'Could not upload custom scene');
    } finally {
      setUploadingScene(false);
    }
  };

  const startEnhancement = async () => {
    if (!productId || productId === 'preview') {
      Alert.alert('Product Required', 'You must save this product first before applying AI enhancements.');
      return;
    }
    
    if (mode === 'style' && !selectedStyleId) {
      Alert.alert('Selection Required', 'Please select an AI style.');
      return;
    }
    if (mode === 'custom-scene' && !customSceneUrl) {
      Alert.alert('Upload Required', 'Please upload a background scene.');
      return;
    }

    setIsProcessing(true);
    setStatusText('Removing background & initializing AI...');

    try {
      const payload = {
        productId,
        imageUrl,
        mode,
        styleId: mode === 'style' ? selectedStyleId : undefined,
        customSceneUrl: mode === 'custom-scene' ? customSceneUrl : undefined,
        productName
      };

      const res = await axios.post('/api/vendor/products/ai-enhance', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const entryId = res.data.data.aiGalleryEntryId;
      
      setStatusText('Generating image... this takes 15-30s.');
      
      // Start polling
      const interval = setInterval(() => pollStatus(entryId), 3000);
      setPollingInterval(interval);

    } catch (err: any) {
      setIsProcessing(false);
      Alert.alert('Error', err.response?.data?.error || err.message || 'Failed to start enhancement');
    }
  };

  const pollStatus = async (entryId: string) => {
    try {
      const res = await axios.get(`/api/vendor/products/ai-enhance/status?productId=${productId}&entryId=${entryId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const status = res.data.data.status;
      
      if (status === 'done') {
        if (pollingInterval) clearInterval(pollingInterval);
        setIsProcessing(false);
        onSuccess(res.data.data.enhancedUrl);
        onClose();
        Alert.alert('Success!', 'Your image has been beautifully enhanced by AI.');
      } else if (status === 'failed') {
        if (pollingInterval) clearInterval(pollingInterval);
        setIsProcessing(false);
        Alert.alert('AI Error', 'The AI failed to process this image. Please try another image or style.');
      }
    } catch (err) {
      console.error('Polling error', err);
      // We don't stop polling on a single network error, just wait for the next tick
    }
  };

  const handleClose = () => {
    if (isProcessing) {
      Alert.alert(
        'Cancel Enhancement?',
        'The AI is still processing your image. If you close now, it will continue in the background but you will not see the result immediately.',
        [
          { text: 'Keep Waiting', style: 'cancel' },
          { text: 'Close', onPress: () => {
            if (pollingInterval) clearInterval(pollingInterval);
            setIsProcessing(false);
            onClose();
          }, style: 'destructive'}
        ]
      );
      return;
    }
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <Feather name="x" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>✨ AI Studio</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="contain" />
            <View style={styles.originalBadge}>
              <Text style={styles.badgeText}>Original</Text>
            </View>
          </View>

          <View style={styles.tabContainer}>
            <TouchableOpacity 
              style={[styles.tab, mode === 'style' && styles.activeTab]} 
              onPress={() => setMode('style')}
            >
              <Text style={[styles.tabText, mode === 'style' && styles.activeTabText]}>Pro Styles</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, mode === 'custom-scene' && styles.activeTab]} 
              onPress={() => setMode('custom-scene')}
            >
              <Text style={[styles.tabText, mode === 'custom-scene' && styles.activeTabText]}>Custom Scene</Text>
            </TouchableOpacity>
          </View>

          {mode === 'style' ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Choose a Professional Style</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stylesScroll}>
                {aiStyles.map(style => (
                  <TouchableOpacity 
                    key={style._id} 
                    style={[styles.styleCard, selectedStyleId === style._id && styles.activeStyleCard]}
                    onPress={() => setSelectedStyleId(style._id)}
                  >
                    {style.thumbnailUrl ? (
                      <Image source={{ uri: style.thumbnailUrl }} style={styles.styleImage} />
                    ) : (
                      <View style={[styles.styleImage, styles.styleImageFallback]}>
                        <Feather name="aperture" size={28} color="#7C3AED" />
                      </View>
                    )}
                    <View style={styles.styleOverlay}>
                      <Text style={styles.styleName}>{style.name}</Text>
                    </View>
                    {selectedStyleId === style._id && (
                      <View style={styles.checkIcon}>
                        <Feather name="check-circle" size={18} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Upload Background Scene</Text>
              <Text style={styles.sectionDesc}>
                The AI will perfectly integrate your product into this background, matching the lighting and shadows.
              </Text>
              
              <TouchableOpacity style={styles.uploadBox} onPress={pickAndUploadScene}>
                {uploadingScene ? (
                  <ActivityIndicator color="#4F46E5" />
                ) : customSceneUrl ? (
                  <Image source={{ uri: customSceneUrl }} style={styles.customScenePreview} />
                ) : (
                  <>
                    <Feather name="image" size={32} color="#9CA3AF" />
                    <Text style={styles.uploadText}>Tap to pick a background</Text>
                  </>
                )}
              </TouchableOpacity>
              {customSceneUrl ? (
                <TouchableOpacity onPress={() => setCustomSceneUrl('')} style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={{ color: '#EF4444', fontWeight: '500' }}>Remove Scene</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" style={{ marginBottom: 16 }} />
              <Text style={styles.processingTitle}>AI is working its magic...</Text>
              <Text style={styles.processingSub}>{statusText}</Text>
            </View>
          ) : (
            <Button 
              variant="primary" 
              fullWidth 
              size="lg" 
              onPress={startEnhancement}
              style={styles.generateBtn}
            >
              <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 16 }}>⚡ Generate Professional Image</Text>
            </Button>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' },
  closeBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#4C1D95' },
  
  content: { padding: 20, paddingBottom: 100 },
  
  previewContainer: { width: '100%', height: 250, backgroundColor: '#E5E7EB', borderRadius: 16, overflow: 'hidden', marginBottom: 24, position: 'relative' },
  previewImage: { width: '100%', height: '100%' },
  originalBadge: { position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

  tabContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeTab: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  activeTabText: { color: '#111827', fontWeight: '600' },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  sectionDesc: { fontSize: 13, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  
  stylesScroll: { paddingRight: 20 },
  styleCard: { width: 120, height: 160, borderRadius: 12, marginRight: 12, overflow: 'hidden', borderWidth: 2, borderColor: 'transparent', position: 'relative' },
  activeStyleCard: { borderColor: '#4F46E5' },
  styleImage: { width: '100%', height: '100%' },
  styleImageFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#EEF2FF' },
  styleOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 8, backgroundColor: 'rgba(0,0,0,0.4)' },
  styleName: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  checkIcon: { position: 'absolute', top: 8, right: 8, backgroundColor: '#4F46E5', borderRadius: 12, padding: 2 },

  uploadBox: { width: '100%', height: 180, borderRadius: 12, borderWidth: 2, borderColor: '#D1D5DB', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF', overflow: 'hidden' },
  uploadText: { marginTop: 12, fontSize: 14, color: '#6B7280', fontWeight: '500' },
  customScenePreview: { width: '100%', height: '100%', resizeMode: 'cover' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#FFF', borderTopWidth: 1, borderColor: '#E5E7EB', paddingBottom: 34 },
  generateBtn: { backgroundColor: '#4C1D95', flexDirection: 'row', alignItems: 'center' },
  
  processingContainer: { alignItems: 'center', paddingVertical: 10 },
  processingTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 4 },
  processingSub: { fontSize: 14, color: '#6B7280' },
});
