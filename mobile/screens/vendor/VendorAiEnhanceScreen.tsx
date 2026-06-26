import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

import { Image } from 'expo-image';
type Tab = 'enhance' | 'tryon';
type Mode = 'style' | 'custom-scene' | 'tryon-model' | 'tryon-custom' | null;
type Segment = 'upper_body' | 'lower_body' | 'dresses' | 'full_body';

type AiStyle = { _id: string; name: string; slug: string; description?: string; bestFor?: string; thumbnailUrl?: string; categoryCompatibility?: string[]; sceneType?: string };
type AiModel = { _id: string; name: string; gender: string; bodySegment?: Segment; garmentCategories?: Segment[]; imageUrl: string; thumbnailUrl?: string; description?: string };

const PURPLE = '#9333EA';
const DARK = '#6D28D9';
const SOFT = '#FAF5FF';
const GREEN = '#059669';
const sceneSteps = ['Uploading product', 'Understanding category', 'Removing background', 'Generating scene', 'Compositing product', 'Uploading final image'];
const tryonSteps = ['Analyzing garment', 'Preparing garment', 'Matching category', 'Mapping to model', 'Running try-on', 'Finalizing image'];

const styleMeta: Record<string, { icon: keyof typeof Feather.glyphMap; desc: string; best: string }> = {
  'amazon-clean': { icon: 'shopping-cart', desc: 'Classic white marketplace background', best: 'All products' },
  'luxury-gold': { icon: 'star', desc: 'Black marble and gold accents, premium feel', best: 'Jewelry, Watch, Perfume' },
  'instagram-viral': { icon: 'camera', desc: 'Bright pastels with botanical props', best: 'Fashion, Cosmetics, Bags' },
  'nike-style': { icon: 'activity', desc: 'Dark athletic studio, dramatic shadows', best: 'Footwear, Sportswear' },
  'nature-organic': { icon: 'sun', desc: 'Earthy wood and green botanical mood', best: 'Cosmetics, Furniture' },
  'fashion-model': { icon: 'user', desc: 'Clean studio sweep for clothing and sarees', best: 'Fashion, Saree, Bags' },
  'jewelry-premium': { icon: 'aperture', desc: 'Black velvet macro with sparkle highlights', best: 'Jewelry, Watch' },
  'tech-commercial': { icon: 'monitor', desc: 'Minimal futuristic Apple-style studio', best: 'Electronics, Gadgets' },
  'furniture-room': { icon: 'home', desc: 'Modern interior room with daylight', best: 'Furniture, Home Decor' },
};

const cats: Record<string, string[]> = {
  jewelry: ['ring', 'jewelry', 'jewellery', 'diamond', 'necklace', 'bracelet', 'earring'],
  watch: ['watch', 'wristwatch', 'chronograph'],
  fashion: ['jeans', 'pant', 'shirt', 'dress', 'saree', 'sari', 'kurta', 'clothing', 'top', 'jacket', 'blouse', 't-shirt', 'tshirt', 'tee', 'hoodie', 'sweater', 'coat', 'garment', 'apparel', 'trouser', 'skirt'],
  footwear: ['shoe', 'sneaker', 'sandal', 'boot'], electronics: ['phone', 'laptop', 'earbud', 'headphone', 'speaker', 'camera', 'tablet'],
  furniture: ['chair', 'sofa', 'table', 'bed', 'desk'], perfume: ['perfume', 'fragrance', 'cologne'], cosmetics: ['makeup', 'lipstick', 'serum', 'cream'], bags: ['bag', 'purse', 'wallet', 'backpack', 'handbag'],
};

const textOf = (p: any, fallback: string) => [p?.title || fallback, p?.description, p?.category?.name, p?.subcategory?.name, ...(p?.tags || [])].filter(Boolean).join(' ').toLowerCase();
const inferCategory = (p: any, fallback: string) => { const txt = textOf(p, fallback); for (const [cat, words] of Object.entries(cats)) if (words.some(w => txt.includes(w))) return cat; return 'generic'; };
const isFashion = (p: any, fallback: string) => inferCategory(p, fallback) === 'fashion' || cats.fashion.some(w => textOf(p, fallback).includes(w));
const inferSegment = (p: any, fallback: string): Segment => { const txt = textOf(p, fallback); if (['dress', 'gown', 'saree', 'sari', 'lehenga', 'jumpsuit', 'set'].some(w => txt.includes(w))) return 'dresses'; if (['jeans', 'pant', 'pants', 'trouser', 'shorts', 'skirt', 'legging', 'palazzo', 'bottom'].some(w => txt.includes(w))) return 'lower_body'; return 'upper_body'; };
const segmentLabel = (s?: Segment) => s === 'upper_body' ? 'Upper Body' : s === 'lower_body' ? 'Lower Body' : s === 'dresses' ? 'Dress / Outfit' : s === 'full_body' ? 'Full Body' : 'Fashion Model';
const styleOk = (s: AiStyle, cat: string) => !s.categoryCompatibility?.length || s.categoryCompatibility.includes(cat);
const modelOk = (m: AiModel, seg: Segment) => m.bodySegment === 'full_body' || m.bodySegment === seg || !!m.garmentCategories?.includes(seg);

export default function VendorAiEnhanceScreen() {
  const router = useRouter(); const params = useLocalSearchParams(); const token = useAuthStore(s => s.token);
  const productId = params.productId as string; const imageUrl = params.imageUrl as string; const productName = (params.productName as string) || 'product'; const isPreview = !productId || productId === 'preview';
  const [product, setProduct] = useState<any>(null); const [selectedImage, setSelectedImage] = useState(imageUrl || ''); const [loading, setLoading] = useState(!isPreview);
  const [stylesData, setStylesData] = useState<AiStyle[]>([]); const [models, setModels] = useState<AiModel[]>([]); const [assetsLoading, setAssetsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('enhance'); const [mode, setMode] = useState<Mode>(null); const [styleId, setStyleId] = useState<string | null>(null); const [modelId, setModelId] = useState<string | null>(null);
  const [customScene, setCustomScene] = useState<string | null>(null); const [customModel, setCustomModel] = useState<string | null>(null); const [uploading, setUploading] = useState(false);
  const [quality, setQuality] = useState<'preview' | 'premium'>('preview'); const [processing, setProcessing] = useState(false); const [step, setStep] = useState(0); const [enhanced, setEnhanced] = useState<string | null>(null); const [showAfter, setShowAfter] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const detectProduct = product || { title: productName, images: imageUrl ? [imageUrl] : [] }; const category = inferCategory(detectProduct, productName); const fashion = isFashion(detectProduct, productName); const segment = inferSegment(detectProduct, productName);
  const recommendedStyles = useMemo(() => stylesData.filter(s => category !== 'generic' && styleOk(s, category)), [stylesData, category]);
  const otherStyles = useMemo(() => stylesData.filter(s => category === 'generic' || !styleOk(s, category)), [stylesData, category]);
  const recommendedModels = useMemo(() => models.filter(m => modelOk(m, segment)), [models, segment]); const otherModels = useMemo(() => models.filter(m => !modelOk(m, segment)), [models, segment]);

  useEffect(() => { if (isPreview) { setLoading(false); return; } (async () => { try { const res = await axios.get(`/api/products/${productId}`, { headers: {} }); const p = res.data.data?.product; setProduct(p); setSelectedImage(imageUrl || p?.images?.[0] || ''); if (isFashion(p, productName)) setTab('tryon'); } catch { Alert.alert('Product Error', 'Could not load product details.'); } finally { setLoading(false); } })(); }, [imageUrl, isPreview, productId, productName, token]);
  useEffect(() => { (async () => { try { const [sr, mr] = await Promise.all([axios.get('/api/ai-styles'), axios.get('/api/ai-models')]); setStylesData(sr.data.data?.styles || []); setModels(mr.data.data?.models || []); } catch { Alert.alert('AI Studio Error', 'Could not load AI styles and models.'); } finally { setAssetsLoading(false); } })(); }, []);
  useEffect(() => { if (!processing) { pulse.stopAnimation(); pulse.setValue(1); return; } Animated.loop(Animated.sequence([Animated.timing(pulse, { toValue: 1.04, duration: 700, useNativeDriver: true }), Animated.timing(pulse, { toValue: 0.98, duration: 700, useNativeDriver: true })])).start(); const steps = tab === 'tryon' ? tryonSteps : sceneSteps; const id = setInterval(() => setStep(s => (s + 1) % steps.length), 3000); return () => clearInterval(id); }, [processing, pulse, tab]);

  const reset = (next?: Tab) => { setEnhanced(null); setShowAfter(false); setMode(null); setStyleId(null); setModelId(null); setCustomScene(null); setCustomModel(null); setProcessing(false); setStep(0); if (next) setTab(next); };
  const uploadMedia = async (target: 'scene' | 'model') => { const perm = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (perm.status !== 'granted') return Alert.alert('Permission needed', 'Allow photo library access.'); const pick = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.85 }); if (pick.canceled || !pick.assets?.[0]) return; setUploading(true); try { const a = pick.assets[0]; const fd = new FormData(); fd.append('file', { uri: a.uri, type: a.mimeType || 'image/jpeg', name: a.fileName || `${target}.jpg` } as any); const res = await axios.post('/api/upload', fd, { headers: { 'Content-Type': 'multipart/form-data', ...({}) } }); const url = res.data.data.url as string; if (target === 'scene') { setCustomScene(url); setStyleId(null); setMode('custom-scene'); } else { setCustomModel(url); setModelId(null); setMode('tryon-custom'); } } catch (e: any) { Alert.alert('Upload failed', e.response?.data?.error || e.message || 'Could not upload image.'); } finally { setUploading(false); } };

  const runAI = async () => { 
    if (!selectedImage) return Alert.alert('Image required', 'Please select a product image.'); 
    if (!mode) return Alert.alert('Selection required', tab === 'tryon' ? 'Choose a model first.' : 'Choose a style first.'); 
    if (tab === 'tryon' && isPreview) return Alert.alert('Save product first', 'Virtual Try-On needs a saved product gallery.'); 
    
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    const { signal } = abortControllerRef.current;

    setProcessing(true); 
    setStep(0); 
    setEnhanced(null); 
    setShowAfter(false); 
    
    try { 
      let endpoint = '/api/vendor/products/ai-enhance'; 
      let payload: any = { productId: isPreview ? 'preview' : productId, imageUrl: selectedImage, productName }; 
      
      if (tab === 'enhance') {
        payload = { ...payload, mode, generationQuality: quality, styleId: mode === 'style' ? styleId : undefined, customSceneUrl: mode === 'custom-scene' ? customScene : undefined }; 
      } else { 
        endpoint = '/api/vendor/products/ai-tryon'; 
        const modelImageUrl = mode === 'tryon-model' ? models.find(m => m._id === modelId)?.imageUrl : customModel; 
        if (!modelImageUrl) throw new Error('Please choose or upload a model image.'); 
        payload = { productId, imageUrl: selectedImage, modelImageUrl, garmentDescription: product?.title || productName || 'fashion garment' }; 
      } 
      
      const res = await axios.post(endpoint, payload, { signal, headers: {}, timeout: 180000 }); 
      const immediate = res.data.data?.enhancedUrl; 
      const entryId = res.data.data?.aiGalleryEntryId; 
      
      if (immediate) { setEnhanced(immediate); setShowAfter(true); return; } 
      if (!entryId) throw new Error('No AI job returned from server.'); 
      
      const statusEndpoint = tab === 'tryon' ? '/api/vendor/products/ai-tryon/status' : '/api/vendor/products/ai-enhance/status'; 
      const wait = tab === 'tryon' ? 6000 : quality === 'premium' ? 5000 : 4000; 
      const max = tab === 'tryon' ? 80 : quality === 'premium' ? 72 : 50; 
      
      for (let i = 0; i < max; i++) { 
        if (signal.aborted) return;
        await new Promise(r => setTimeout(r, wait)); 
        if (signal.aborted) return;

        const sr = await axios.get(`${statusEndpoint}?productId=${productId}&entryId=${entryId}`, { signal, headers: {} }); 
        const st = sr.data.data?.status; 
        const done = sr.data.data?.enhancedUrl; 
        
        if (st === 'done' && done) { setEnhanced(done); setShowAfter(true); return; } 
        if (st === 'failed') throw new Error('AI generation failed. Please try another style or model.'); 
      } 
      throw new Error('AI processing timed out. The job may still finish in the product gallery.'); 
    } catch (e: any) { 
      if (axios.isCancel(e) || signal.aborted) {
        console.log('AI polling aborted due to unmount');
        return;
      }
      Alert.alert('AI generation failed', e.response?.data?.error || e.message || 'Please try again.'); 
    } finally { 
      if (!signal.aborted) {
        setProcessing(false); 
      }
    } 
  };
  const saveImage = async () => { if (!enhanced) return; if (isPreview) return Alert.alert('Image ready', 'This enhanced image will be added to your product draft.', [{ text: 'Use Image', onPress: () => router.replace({ pathname: '/vendor/products/new', params: { aiEnhancedUrl: enhanced } } as any) }]); try { await axios.post('/api/vendor/products/ai-promote', { productId, enhancedUrl: enhanced }, { headers: {} }); Alert.alert('Saved', 'AI image saved as the primary product image.', [{ text: 'Back', onPress: () => router.replace({ pathname: '/vendor/products/[id]/edit', params: { id: productId } } as any) }]); } catch (e: any) { Alert.alert('Save failed', e.response?.data?.error || e.message || 'Could not save image.'); } };

  const images = product?.images?.length ? product.images : selectedImage ? [selectedImage] : []; const steps = tab === 'tryon' ? tryonSteps : sceneSteps; const canGenerate = !!mode && !!selectedImage && !processing;
  if (loading) return <SafeAreaView style={st.safe}><View style={st.center}><ActivityIndicator color={PURPLE} /><Text style={st.muted}>Loading AI Product Studio...</Text></View></SafeAreaView>;

  return <SafeAreaView style={st.safe}><View style={st.header}><TouchableOpacity onPress={() => router.back()} style={st.back}><Feather name="arrow-left" size={22} color="#111827" /></TouchableOpacity><View style={{ flex: 1 }}><View style={st.titleRow}><Feather name="zap" size={18} color={PURPLE} /><Text style={st.title}>AI Product Studio</Text></View><Text style={st.sub} numberOfLines={2}>{tab === 'tryon' ? `Put fashion products on AI models - ${productName}` : `Transform your photo into a professional ecommerce image - ${productName}`}</Text></View></View><ScrollView contentContainerStyle={st.scroll} showsVerticalScrollIndicator={false}>
    <View style={st.tabs}>{fashion && !isPreview && <TabButton active={tab === 'tryon'} icon="user" label="Virtual Try-On" hint="Recommended" onPress={() => reset('tryon')} />}<TabButton active={tab === 'enhance'} icon="layers" label="Scene Enhancement" hint={fashion ? 'Props and studio' : undefined} onPress={() => reset('enhance')} /></View>
    {category !== 'generic' && tab === 'enhance' && <View style={st.category}><Text style={st.muted}>AI detected:</Text><Text style={st.badge}>{category}</Text></View>}
    {fashion && tab === 'enhance' && !isPreview && <View style={st.notice}><Feather name="info" size={15} color="#92400E" /><Text style={st.noticeText}>Clothing detected. For shirts, dresses, sarees, or jeans on a model, use Virtual Try-On.</Text></View>}
    <View style={st.preview}><View style={st.toggleRow}><PressPill active={!showAfter} label="Before" onPress={() => setShowAfter(false)} /><PressPill active={showAfter} label="After" disabled={!enhanced} onPress={() => enhanced && setShowAfter(true)} /></View><View style={st.imageBox}>{processing ? <Animated.View style={[st.processing, { transform: [{ scale: pulse }] }]}><ActivityIndicator color={PURPLE} size="large" /><Text style={st.processTitle}>AI is working...</Text><Text style={st.processStep}>{steps[step]}</Text>{tab === 'tryon' && <Text style={st.hint}>Virtual try-on can take a few minutes on cold starts.</Text>}<View style={st.dots}>{steps.map((_, i) => <View key={i} style={[st.dot, i === step && st.dotActive]} />)}</View></Animated.View> : <Image source={{ uri: showAfter && enhanced ? enhanced : selectedImage }} style={st.mainImage} contentFit="contain" />}{!processing && showAfter && enhanced && <View style={st.aiBadge}><Text style={st.aiBadgeText}>AI Enhanced</Text></View>}{!processing && !showAfter && <View style={st.original}><Text style={st.originalText}>Original</Text></View>}</View></View>
    {images.length > 1 && <View style={st.section}><Text style={st.sectionTitle}>{tab === 'tryon' ? 'Select garment image' : 'Select image to enhance'}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{images.map((u: string, i: number) => <TouchableOpacity key={`${u}-${i}`} style={[st.thumbBtn, selectedImage === u && st.thumbActive]} onPress={() => setSelectedImage(u)}><Image source={{ uri: u }} style={st.thumb} /></TouchableOpacity>)}</ScrollView></View>}
    {tab === 'tryon' && <Tips />}
    {!enhanced && <><Text style={st.sectionTitle}>{tab === 'tryon' ? 'Upload Custom Model' : 'Upload Custom Scene'}</Text><TouchableOpacity style={[st.upload, mode?.includes('custom') && st.selected]} onPress={() => uploadMedia(tab === 'tryon' ? 'model' : 'scene')} disabled={uploading}><View style={st.uploadIcon}>{uploading ? <ActivityIndicator color={PURPLE} /> : tab === 'tryon' && customModel ? <Image source={{ uri: customModel }} style={st.fill} /> : tab === 'enhance' && customScene ? <Image source={{ uri: customScene }} style={st.fill} /> : <Feather name={tab === 'tryon' ? 'user' : 'image'} size={22} color={PURPLE} />}</View><View style={{ flex: 1 }}><Text style={st.uploadTitle}>{tab === 'tryon' ? customModel ? 'Custom model selected' : '+ Upload My Model' : customScene ? 'Custom scene selected' : '+ Upload Custom Scene'}</Text><Text style={st.muted}>{tab === 'tryon' ? 'Try this product on your own model' : 'Place product in your own background'}</Text></View>{mode?.includes('custom') && <Feather name="check" size={18} color={DARK} />}</TouchableOpacity><View style={st.dividerRow}><View style={st.line} /><Text style={st.dividerText}>{tab === 'tryon' ? 'OR CHOOSE PRESET MODEL' : 'OR CHOOSE A PRESET SCENE'}</Text><View style={st.line} /></View>{assetsLoading ? <ActivityIndicator color={PURPLE} style={{ margin: 24 }} /> : tab === 'tryon' ? <View>{recommendedModels.length > 0 && <><Text style={st.reco}>Best for {segmentLabel(segment)}</Text>{recommendedModels.map(m => <ModelCard key={m._id} model={m} selected={modelId === m._id} recommended onPress={() => { setModelId(m._id); setCustomModel(null); setMode('tryon-model'); }} />)}</>}{otherModels.length > 0 && <Text style={st.all}>All model presets</Text>}{(recommendedModels.length ? otherModels : models).map(m => <ModelCard key={m._id} model={m} selected={modelId === m._id} onPress={() => { setModelId(m._id); setCustomModel(null); setMode('tryon-model'); }} />)}</View> : <View>{recommendedStyles.length > 0 && <><Text style={st.reco}>Best for {category}</Text>{recommendedStyles.map(s => <StyleCard key={s._id} item={s} selected={styleId === s._id} recommended onPress={() => { setStyleId(s._id); setCustomScene(null); setMode('style'); }} />)}</>}{(recommendedStyles.length ? otherStyles : stylesData).length > 0 && <Text style={st.all}>{recommendedStyles.length ? 'All styles' : 'Choose a preset scene'}</Text>}{(recommendedStyles.length ? otherStyles : stylesData).map(s => <StyleCard key={s._id} item={s} selected={styleId === s._id} onPress={() => { setStyleId(s._id); setCustomScene(null); setMode('style'); }} />)}</View>}{tab === 'enhance' && <View style={st.quality}><Text style={st.sectionTitle}>Output quality</Text><View style={st.qualityRow}><Quality active={quality === 'preview'} title="Fast preview" sub="Good for drafts" onPress={() => setQuality('preview')} /><Quality active={quality === 'premium'} title="Premium HD" sub="Sharper scenes" onPress={() => setQuality('premium')} /></View></View>}<TouchableOpacity style={[st.generate, !canGenerate && st.disabled]} disabled={!canGenerate} onPress={runAI}>{processing ? <ActivityIndicator color="#FFF" /> : <><Feather name="zap" size={18} color="#FFF" /><Text style={st.generateText}>{buttonLabel(tab, mode, stylesData, styleId, models, modelId)}</Text></>}</TouchableOpacity></>}
    {enhanced && !processing && <View style={st.actions}><View style={st.success}><Feather name="check-circle" size={20} color={GREEN} /><Text style={st.successText}>{tab === 'tryon' ? 'Virtual Try-On complete.' : 'AI enhancement complete.'}</Text></View><TouchableOpacity style={st.promote} onPress={saveImage}><Feather name="image" size={16} color="#FFF" /><Text style={st.promoteText}>{isPreview ? 'Use This Image' : 'Save as Primary Image'}</Text></TouchableOpacity><TouchableOpacity style={st.retry} onPress={() => reset(tab)}><Feather name="refresh-cw" size={14} color={DARK} /><Text style={st.retryText}>{tab === 'tryon' ? 'Try Another Model' : 'Try a Different Style'}</Text></TouchableOpacity></View>}
  </ScrollView></SafeAreaView>;
}

function TabButton({ active, icon, label, hint, onPress }: { active: boolean; icon: keyof typeof Feather.glyphMap; label: string; hint?: string; onPress: () => void }) { return <TouchableOpacity style={[st.tab, active && st.tabActive]} onPress={onPress}><Feather name={icon} size={15} color={active ? DARK : '#6B7280'} /><View><Text style={[st.tabText, active && st.tabTextActive]}>{label}</Text>{hint && <Text style={st.tabHint}>{hint}</Text>}</View></TouchableOpacity>; }
function PressPill({ active, label, disabled, onPress }: { active: boolean; label: string; disabled?: boolean; onPress: () => void }) { return <TouchableOpacity style={[st.pill, active && st.pillActive, disabled && { opacity: 0.45 }]} disabled={disabled} onPress={onPress}><Text style={[st.pillText, active && st.pillTextActive]}>{label}</Text></TouchableOpacity>; }
function Tips() { return <View style={st.tips}><Text style={st.tipsTitle}>Tips for best try-on results</Text>{['Front-facing flat lay or ghost mannequin', 'Plain white or light background', 'Full garment visible in frame', 'Upper-body models for shirts/tops', 'Lower-body models for jeans/pants', 'Full-body models for dresses/sarees'].map(t => <Text key={t} style={st.good}>OK  {t}</Text>)}{['Close-up face-only portraits', 'Busy backgrounds', 'Cropped garment photos'].map(t => <Text key={t} style={st.bad}>Avoid  {t}</Text>)}</View>; }
function StyleCard({ item, selected, recommended, onPress }: { item: AiStyle; selected: boolean; recommended?: boolean; onPress: () => void }) { const meta = styleMeta[item.slug] || { icon: 'aperture' as keyof typeof Feather.glyphMap, desc: item.description || item.sceneType || 'Professional scene', best: item.bestFor || 'Products' }; return <TouchableOpacity style={[st.card, recommended && st.cardReco, selected && st.selected]} onPress={onPress}><View style={st.icon}>{item.thumbnailUrl ? <Image source={{ uri: item.thumbnailUrl }} style={st.fill} /> : <Feather name={meta.icon} size={20} color={DARK} />}</View><View style={{ flex: 1 }}><View style={st.cardTitleRow}><Text style={st.cardTitle}>{item.name}</Text>{recommended && <Text style={st.recoPill}>Recommended</Text>}</View><Text style={st.cardSub}>{meta.desc}</Text>{selected && <Text style={st.cardMeta}>Best for: {meta.best}</Text>}</View>{selected && <Feather name="check" size={18} color={DARK} />}</TouchableOpacity>; }
function ModelCard({ model, selected, recommended, onPress }: { model: AiModel; selected: boolean; recommended?: boolean; onPress: () => void }) { return <TouchableOpacity style={[st.card, recommended && st.cardReco, selected && st.selected]} onPress={onPress}><View style={st.modelThumb}>{model.thumbnailUrl || model.imageUrl ? <Image source={{ uri: model.thumbnailUrl || model.imageUrl }} style={st.fill} /> : <Feather name="user" size={22} color="#9CA3AF" />}</View><View style={{ flex: 1 }}><View style={st.cardTitleRow}><Text style={st.cardTitle}>{model.name}</Text>{recommended && <Text style={st.recoPill}>Recommended</Text>}</View><Text style={st.cardSub}>{model.gender} - {segmentLabel(model.bodySegment)}</Text>{!!model.description && <Text style={st.cardMeta} numberOfLines={2}>{model.description}</Text>}</View>{selected && <Feather name="check" size={18} color={DARK} />}</TouchableOpacity>; }
function Quality({ active, title, sub, onPress }: { active: boolean; title: string; sub: string; onPress: () => void }) { return <TouchableOpacity style={[st.qualityOption, active && st.qualityActive]} onPress={onPress}><Text style={[st.qualityTitle, active && { color: DARK }]}>{title}</Text><Text style={st.muted}>{sub}</Text></TouchableOpacity>; }
function buttonLabel(tab: Tab, mode: Mode, stylesData: AiStyle[], styleId: string | null, models: AiModel[], modelId: string | null) { if (tab === 'tryon') { if (mode === 'tryon-custom') return 'Run Virtual Try-On'; if (mode === 'tryon-model') return `Try On ${models.find(m => m._id === modelId)?.name || 'Model'}`; return 'Select a Model to Continue'; } if (mode === 'custom-scene') return 'Place in Custom Scene'; if (mode === 'style') return `Apply ${stylesData.find(s => s._id === styleId)?.name || 'Style'}`; return 'Select a Style to Continue'; }

const st = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FBFAFF' }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }, header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: '#FFF', borderBottomWidth: 1, borderColor: '#E5E7EB' }, back: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' }, titleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 }, title: { fontSize: 18, fontWeight: '800', color: '#111827' }, sub: { fontSize: 12, color: '#6B7280', marginTop: 2 }, scroll: { padding: 16, paddingBottom: 42 }, tabs: { flexDirection: 'row', gap: 10, borderBottomWidth: 1, borderColor: '#E5E7EB', marginBottom: 14 }, tab: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', flexShrink: 1 }, tabActive: { borderBottomColor: PURPLE }, tabText: { fontSize: 13, fontWeight: '700', color: '#6B7280' }, tabTextActive: { color: DARK }, tabHint: { fontSize: 10, color: GREEN, fontWeight: '700' }, category: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 }, muted: { fontSize: 12, color: '#6B7280' }, badge: { overflow: 'hidden', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: '#F3E8FF', color: DARK, fontSize: 12, fontWeight: '800', textTransform: 'capitalize' }, notice: { flexDirection: 'row', gap: 8, backgroundColor: '#FFFBEB', borderColor: '#FDE68A', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 }, noticeText: { flex: 1, color: '#92400E', fontSize: 12, lineHeight: 17 }, preview: { backgroundColor: '#FFF', borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#EDE9FE', marginBottom: 16, elevation: 3 }, toggleRow: { flexDirection: 'row', gap: 8, padding: 12, borderBottomWidth: 1, borderColor: '#F3F4F6' }, pill: { flex: 1, alignItems: 'center', paddingVertical: 9, borderRadius: 9, backgroundColor: '#F9FAFB' }, pillActive: { backgroundColor: PURPLE }, pillText: { color: '#9CA3AF', fontWeight: '800', fontSize: 13 }, pillTextActive: { color: '#FFF' }, imageBox: { minHeight: 360, backgroundColor: '#F9FAFB', alignItems: 'center', justifyContent: 'center', position: 'relative' }, mainImage: { width: '100%', height: 360 }, processing: { alignItems: 'center', justifyContent: 'center', padding: 22 }, processTitle: { marginTop: 14, color: DARK, fontWeight: '800', fontSize: 16 }, processStep: { marginTop: 5, color: PURPLE, fontSize: 13, textAlign: 'center' }, hint: { marginTop: 8, color: '#8B5CF6', fontSize: 11, textAlign: 'center' }, dots: { flexDirection: 'row', gap: 5, marginTop: 16 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#DDD6FE' }, dotActive: { width: 24, backgroundColor: PURPLE }, aiBadge: { position: 'absolute', top: 12, right: 12, backgroundColor: PURPLE, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 }, aiBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '800' }, original: { position: 'absolute', bottom: 12, left: 12, backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E5E7EB' }, originalText: { color: '#6B7280', fontSize: 11, fontWeight: '700' }, section: { marginBottom: 16 }, sectionTitle: { fontSize: 12, fontWeight: '800', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }, thumbBtn: { width: 58, height: 58, borderRadius: 12, borderWidth: 2, borderColor: 'transparent', overflow: 'hidden', opacity: 0.62, marginRight: 9 }, thumbActive: { borderColor: PURPLE, opacity: 1 }, thumb: { width: '100%', height: '100%' }, tips: { borderWidth: 1, borderColor: '#EDE9FE', backgroundColor: SOFT, borderRadius: 14, padding: 12, marginBottom: 16 }, tipsTitle: { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 7 }, good: { color: '#047857', fontSize: 11, lineHeight: 17 }, bad: { color: '#DC2626', fontSize: 11, lineHeight: 17 }, upload: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#D1D5DB', backgroundColor: '#FFF', borderRadius: 15, padding: 12, marginBottom: 16 }, selected: { borderStyle: 'solid', borderColor: PURPLE, backgroundColor: SOFT }, uploadIcon: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#F3E8FF', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, uploadTitle: { fontSize: 14, color: DARK, fontWeight: '800' }, fill: { width: '100%', height: '100%' }, dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }, line: { flex: 1, height: 1, backgroundColor: '#E5E7EB' }, dividerText: { fontSize: 10, color: '#9CA3AF', fontWeight: '800' }, reco: { fontSize: 10, color: GREEN, fontWeight: '900', textTransform: 'uppercase', marginBottom: 7 }, all: { fontSize: 10, color: '#9CA3AF', fontWeight: '900', textTransform: 'uppercase', marginTop: 6, marginBottom: 7 }, card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF', borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14, padding: 11, marginBottom: 9 }, cardReco: { borderColor: '#A7F3D0' }, icon: { width: 46, height: 46, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, modelThumb: { width: 56, height: 56, borderRadius: 12, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }, cardTitle: { fontSize: 14, color: '#111827', fontWeight: '800', flexShrink: 1 }, recoPill: { overflow: 'hidden', borderRadius: 999, backgroundColor: '#D1FAE5', color: '#047857', fontSize: 9, fontWeight: '900', paddingHorizontal: 6, paddingVertical: 2 }, cardSub: { fontSize: 11, color: '#6B7280', marginTop: 3 }, cardMeta: { fontSize: 10, color: DARK, fontWeight: '700', marginTop: 4 }, quality: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', borderWidth: 1, borderRadius: 14, padding: 12, marginBottom: 14 }, qualityRow: { flexDirection: 'row', gap: 8 }, qualityOption: { flex: 1, borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: '#FFF', borderRadius: 10, padding: 10 }, qualityActive: { borderColor: PURPLE, backgroundColor: SOFT }, qualityTitle: { fontSize: 12, fontWeight: '800', color: '#374151' }, generate: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 18 }, disabled: { backgroundColor: '#D8B4FE' }, generateText: { color: '#FFF', fontSize: 15, fontWeight: '900', flexShrink: 1, textAlign: 'center' }, actions: { gap: 12, marginBottom: 18 }, success: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ECFDF5', borderColor: '#A7F3D0', borderWidth: 1, borderRadius: 13, padding: 13 }, successText: { color: '#065F46', fontWeight: '800', fontSize: 13 }, promote: { backgroundColor: PURPLE, borderRadius: 14, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, promoteText: { color: '#FFF', fontSize: 15, fontWeight: '900' }, retry: { borderColor: PURPLE, borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 }, retryText: { color: DARK, fontSize: 14, fontWeight: '800' },
});
