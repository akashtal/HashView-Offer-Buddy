'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { FiZap, FiUpload, FiCheck, FiRefreshCw, FiArrowLeft, FiImage, FiUser, FiInfo, FiLayers } from 'react-icons/fi';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AiStyle {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  bestFor?: string;
  emoji?: string;
  thumbnailUrl?: string;
  categoryCompatibility?: string[];
  sceneType?: string;
}

interface AiModel {
  _id: string;
  name: string;
  gender: string;
  imageUrl: string;
  thumbnailUrl?: string;
}

type Mode = 'style' | 'custom-scene' | 'tryon-model' | 'tryon-custom' | null;
type Tab = 'enhance' | 'tryon';

// ─── Style metadata (emoji + description) shown in the UI ────────────────────
const STYLE_META: Record<string, { emoji: string; desc: string; bestFor: string }> = {
  'amazon-clean':    { emoji: '🛒', desc: 'Classic white marketplace background',         bestFor: 'All products' },
  'luxury-gold':     { emoji: '✨', desc: 'Black marble + gold accents, premium feel',    bestFor: 'Jewelry · Watch · Perfume' },
  'instagram-viral': { emoji: '📸', desc: 'Bright pastels with botanical props',          bestFor: 'Fashion · Cosmetics · Bags' },
  'nike-style':      { emoji: '💪', desc: 'Dark athletic studio, dramatic shadows',       bestFor: 'Footwear · Sportswear' },
  'nature-organic':  { emoji: '🌿', desc: 'Earthy wood & green botanical mood',           bestFor: 'Cosmetics · Furniture' },
  'fashion-model':   { emoji: '👗', desc: 'Clean studio sweep for clothing / sarees',     bestFor: 'Fashion · Saree · Bags' },
  'jewelry-premium': { emoji: '💍', desc: 'Black velvet macro with sparkle highlights',   bestFor: 'Jewelry · Watch' },
  'tech-commercial': { emoji: '💻', desc: 'Minimal futuristic Apple-style studio',        bestFor: 'Electronics · Gadgets' },
  'furniture-room':  { emoji: '🪑', desc: 'Modern Scandinavian interior with daylight',  bestFor: 'Furniture · Home Decor' },
};

const PROCESSING_STEPS = [
  'Uploading your image…',
  'Analysing product with AI…',
  'Removing background…',
  'Generating AI scene…',
  'Compositing & shadow pass…',
  'Uploading final image…',
];

const TRYON_PROCESSING_STEPS = [
  'Analyzing garment…',
  'Preparing AI Model…',
  'Mapping garment to model…',
  'Running VTON diffusion…',
  'Enhancing details…',
  'Finalizing image…',
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  jewelry:     ['ring', 'jewelry', 'jewellery', 'diamond', 'necklace', 'bracelet', 'earring', 'bangle'],
  watch:       ['watch', 'wristwatch', 'chronograph'],
  fashion:     ['jeans', 'pant', 'shirt', 'dress', 'saree', 'sari', 'kurta', 'clothing', 'top', 'jacket'],
  footwear:    ['shoe', 'sneaker', 'sandal', 'boot', 'trainer'],
  electronics: ['phone', 'laptop', 'earbud', 'headphone', 'speaker', 'camera', 'tablet'],
  furniture:   ['chair', 'sofa', 'table', 'bed', 'desk', 'cabinet'],
  perfume:     ['perfume', 'fragrance', 'cologne', 'scent'],
  cosmetics:   ['makeup', 'lipstick', 'serum', 'cream', 'cosmetic', 'skincare'],
  bags:        ['bag', 'purse', 'wallet', 'backpack', 'handbag'],
};

function inferCategory(product: any): string {
  const text = [product?.title, product?.description, product?.category?.name, ...(product?.tags || [])]
    .filter(Boolean).join(' ').toLowerCase();
  for (const [cat, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(k => text.includes(k))) return cat;
  }
  return 'generic';
}

function isCompatible(style: AiStyle, category: string) {
  return !style.categoryCompatibility?.length || style.categoryCompatibility.includes(category);
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function VendorAiEnhancePage() {
  const params  = useParams();
  const router  = useRouter();
  const productId = params.id as string;

  const [activeTab, setActiveTab]         = useState<Tab>('enhance');

  const [product, setProduct]             = useState<any>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [styles, setStyles]               = useState<AiStyle[]>([]);
  const [models, setModels]               = useState<AiModel[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(true);

  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [mode, setMode]                   = useState<Mode>(null);
  const [customSceneUrl, setCustomSceneUrl] = useState<string | null>(null);
  const [customModelUrl, setCustomModelUrl] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [hoveredStyle, setHoveredStyle]   = useState<string | null>(null);

  const [processing, setProcessing]       = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [enhancedUrl, setEnhancedUrl]     = useState<string | null>(null);
  const [showAfter, setShowAfter]         = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');

  const detectedCategory  = inferCategory(product);
  const recommendedStyles = styles.filter(s => isCompatible(s, detectedCategory) && detectedCategory !== 'generic');
  const otherStyles       = styles.filter(s => !isCompatible(s, detectedCategory) || detectedCategory === 'generic');

  // Determine if product is fashion (eligible for try-on)
  const isFashion = detectedCategory === 'fashion';

  // ── Load product ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!productId || productId === 'undefined') { setLoadingProduct(false); return; }
    (async () => {
      try {
        const res  = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        const p    = data.data?.product;
        setProduct(p);
        if (p?.images?.[0]) setSelectedImage(p.images[0]);
      } catch { setError('Failed to load product'); }
      finally  { setLoadingProduct(false); }
    })();
  }, [productId]);

  // ── Load AI styles & models ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [stylesRes, modelsRes] = await Promise.all([
          fetch('/api/ai-styles'),
          fetch('/api/ai-models')
        ]);
        const stylesData = await stylesRes.json();
        const modelsData = await modelsRes.json();
        setStyles(stylesData.data?.styles || []);
        setModels(modelsData.data?.models || []);
      } catch { console.error('Failed to load AI assets'); }
      finally  { setLoadingAssets(false); }
    })();
  }, []);

  // ── Processing step ticker ──────────────────────────────────────────────────
  useEffect(() => {
    if (!processing) return;
    const steps = activeTab === 'tryon' ? TRYON_PROCESSING_STEPS : PROCESSING_STEPS;
    const id = setInterval(() => setProcessingStep(s => (s + 1) % steps.length), 3000);
    return () => clearInterval(id);
  }, [processing, activeTab]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleCustomUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'scene' | 'model') => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMedia(true);
    setError('');
    try {
      const fd  = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      
      if (type === 'scene') {
        setCustomSceneUrl(data.data.url);
        setMode('custom-scene');
        setSelectedStyleId(null);
      } else {
        setCustomModelUrl(data.data.url);
        setMode('tryon-custom');
        setSelectedModelId(null);
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploadingMedia(false);
    }
  };

  const selectStyle = (id: string) => { setSelectedStyleId(id); setMode('style'); setCustomSceneUrl(null); };
  const selectModel = (id: string) => { setSelectedModelId(id); setMode('tryon-model'); setCustomModelUrl(null); };

  const handleEnhance = async () => {
    if (!mode || !selectedImage) return;
    setProcessing(true); setProcessingStep(0); setEnhancedUrl(null); setError('');

    try {
      let endpoint = '/api/vendor/products/ai-enhance';
      let payload: any = { productId, imageUrl: selectedImage, productName: product?.title || 'product' };
      
      if (activeTab === 'enhance') {
        payload.mode = mode;
        if (mode === 'style') payload.styleId = selectedStyleId;
        if (mode === 'custom-scene') payload.customSceneUrl = customSceneUrl;
      } else {
        endpoint = '/api/vendor/products/ai-tryon';
        const modelUrl = mode === 'tryon-model' ? models.find(m => m._id === selectedModelId)?.imageUrl : customModelUrl;
        payload = {
          productId,
          imageUrl: selectedImage,
          modelImageUrl: modelUrl,
          garmentDescription: product?.title || 'fashion garment'
        };
      }

      const res  = await fetch(endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const { aiGalleryEntryId, enhancedUrl: immediateUrl } = data.data;

      if (immediateUrl) {
        setEnhancedUrl(immediateUrl); setShowAfter(true); setProcessing(false); return;
      }

      if (!aiGalleryEntryId) throw new Error('No entry ID returned from server');

      const statusEndpoint = activeTab === 'tryon' ? '/api/vendor/products/ai-tryon/status' : '/api/vendor/products/ai-enhance/status';
      const steps = activeTab === 'tryon' ? TRYON_PROCESSING_STEPS : PROCESSING_STEPS;

      // IDM-VTON (A100 GPU) can take 4-7 minutes with cold start.
      // Use longer interval + more polls for try-on vs scene enhance.
      const pollInterval = activeTab === 'tryon' ? 6000 : 4000;
      const maxPolls     = activeTab === 'tryon' ? 80 : 50; // 80x6s=8min | 50x4s=3.3min

      for (let i = 0; i < maxPolls; i++) {
        await new Promise(r => setTimeout(r, pollInterval));
        const sr   = await fetch(`${statusEndpoint}?productId=${productId}&entryId=${aiGalleryEntryId}`, { cache: 'no-store' });
        const sd   = await sr.json();
        if (!sd.success) continue;
        if (sd.data.status === 'done' && sd.data.enhancedUrl) {
          setEnhancedUrl(sd.data.enhancedUrl); setShowAfter(true); setProcessing(false); return;
        }
        if (sd.data.status === 'failed') throw new Error('AI generation failed. Please try again.');
        setProcessingStep(s => (s + 1) % steps.length);
      }
      const timeoutMins = Math.round((pollInterval * maxPolls) / 60000);
      throw new Error(`AI processing timed out (>${timeoutMins} min). The job may still be running — check back in your gallery shortly.`);
    } catch (err: any) {
      setError(err.message || 'AI processing failed. Please try again.');
      setProcessing(false);
    }
  };

  const handlePromote = async () => {
    if (!enhancedUrl) return;
    try {
      const res  = await fetch('/api/vendor/products/ai-promote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, enhancedUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess('✅ AI image added to your product gallery!');
    } catch (err: any) { setError(err.message || 'Failed to save image'); }
  };

  const reset = () => { setEnhancedUrl(null); setShowAfter(false); setMode(null); setSelectedStyleId(null); setCustomSceneUrl(null); setSelectedModelId(null); setCustomModelUrl(null); setError(''); setSuccess(''); };

  // ── Handlers & Renderers ────────────────────────────────────────────────────────
  
  const renderStyleCard = (s: AiStyle, recommended = false) => {
    const meta      = STYLE_META[s.slug] || { emoji: '🎨', desc: s.description || s.sceneType || '', bestFor: s.bestFor || '' };
    const isSelected = selectedStyleId === s._id;
    const isHovered  = hoveredStyle === s._id;

    return (
      <button
        key={s._id}
        onClick={() => selectStyle(s._id)}
        onMouseEnter={() => setHoveredStyle(s._id)}
        onMouseLeave={() => setHoveredStyle(null)}
        className={`w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden
          ${isSelected
            ? 'border-purple-600 bg-purple-50 shadow-md shadow-purple-100'
            : recommended
              ? 'border-emerald-200 hover:border-purple-400 hover:bg-purple-50/60 hover:shadow-sm'
              : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-sm'
          }`}
      >
        <div className="flex items-center gap-3 p-3">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl flex-shrink-0 overflow-hidden
            ${isSelected ? 'bg-purple-100' : 'bg-gray-100'}`}>
            {s.thumbnailUrl
              ? <Image src={s.thumbnailUrl} alt={s.name} width={44} height={44} className="w-full h-full object-cover" />
              : <span>{meta.emoji}</span>
            }
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-sm font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
                {s.name}
              </span>
              {recommended && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Recommended
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-tight truncate">{meta.desc}</p>
          </div>
          {isSelected && <FiCheck className="ml-auto text-purple-600 w-4 h-4 flex-shrink-0" />}
        </div>
        {(isSelected || isHovered) && meta.bestFor && (
          <div className={`px-3 pb-2.5 pt-0 flex items-center gap-1.5 ${isSelected ? 'bg-purple-50' : 'bg-purple-50/40'}`}>
            <FiInfo className="w-3 h-3 text-purple-400 flex-shrink-0" />
            <span className="text-[10px] text-purple-600 font-medium">Best for: {meta.bestFor}</span>
          </div>
        )}
      </button>
    );
  };

  const renderModelCard = (m: AiModel) => {
    const isSelected = selectedModelId === m._id;
    return (
      <button
        key={m._id}
        onClick={() => selectModel(m._id)}
        className={`w-full text-left rounded-xl border-2 transition-all duration-200 overflow-hidden
          ${isSelected
            ? 'border-purple-600 bg-purple-50 shadow-md shadow-purple-100'
            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/40 hover:shadow-sm'
          }`}
      >
        <div className="flex items-center gap-3 p-3">
          <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-100`}>
            {m.thumbnailUrl || m.imageUrl
              ? <Image src={m.thumbnailUrl || m.imageUrl} alt={m.name} width={56} height={56} className="w-full h-full object-cover" />
              : <FiUser className="w-6 h-6 text-gray-400" />
            }
          </div>
          <div className="min-w-0 flex-1">
            <span className={`text-sm font-semibold ${isSelected ? 'text-purple-700' : 'text-gray-800'}`}>
              {m.name}
            </span>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-tight truncate capitalize">{m.gender} Model</p>
          </div>
          {isSelected && <FiCheck className="ml-auto text-purple-600 w-4 h-4 flex-shrink-0" />}
        </div>
      </button>
    );
  };

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loadingProduct) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-violet-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading product…</p>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-white border border-gray-200 transition-colors">
            <FiArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FiZap className="text-purple-600" /> AI Product Studio
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Transform your photo into a professional ecommerce image
              {product?.title && <> — <span className="font-medium text-gray-700">{product.title}</span></>}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200 pb-px">
          <button
            onClick={() => { setActiveTab('enhance'); reset(); }}
            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'enhance' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
          >
            <span className="flex items-center gap-2"><FiLayers /> Scene Enhancement</span>
          </button>
          {isFashion && (
            <button
              onClick={() => { setActiveTab('tryon'); reset(); }}
              className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'tryon' ? 'border-purple-600 text-purple-700' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
            >
              <span className="flex items-center gap-2"><FiUser /> Virtual Try-On</span>
            </button>
          )}
        </div>

        {/* Category badge */}
        {detectedCategory !== 'generic' && activeTab === 'enhance' && (
          <div className="mb-5 flex items-center gap-2">
            <span className="text-xs text-gray-500">AI detected:</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 capitalize">
              {detectedCategory}
            </span>
            <span className="text-xs text-gray-400">— recommended styles are highlighted below</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* ── Left: Preview ── */}
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-100">
              {/* Before / After toggle */}
              <div className="flex p-3 gap-2 border-b border-gray-100">
                <button
                  onClick={() => setShowAfter(false)}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                    ${!showAfter ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:bg-gray-50'}`}
                >Before</button>
                <button
                  onClick={() => enhancedUrl && setShowAfter(true)}
                  disabled={!enhancedUrl}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                    ${showAfter ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'}`}
                >After ✨</button>
              </div>

              {/* Image area */}
              <div className="relative bg-[#f9f9fb]" style={{ minHeight: 400 }}>
                {processing ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50/80">
                    <div className="w-14 h-14 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-purple-700 font-bold text-base">AI is working…</p>
                    <p className="text-purple-500 text-sm mt-1 mb-2 text-center px-4">
                      {(activeTab === 'tryon' ? TRYON_PROCESSING_STEPS : PROCESSING_STEPS)[processingStep]}
                    </p>
                    {activeTab === 'tryon' && (
                      <p className="text-[10px] text-purple-400 font-medium text-center px-4 max-w-[200px] leading-tight">
                        Virtual Try-On models are highly complex and can take 2-5 minutes to complete. Please be patient.
                      </p>
                    )}
                    <div className="flex gap-1 mt-4">
                      {(activeTab === 'tryon' ? TRYON_PROCESSING_STEPS : PROCESSING_STEPS).map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all duration-500
                          ${i === processingStep ? 'w-6 bg-purple-500' : 'w-1.5 bg-purple-200'}`} />
                      ))}
                    </div>
                  </div>
                ) : showAfter && enhancedUrl ? (
                  <div className="relative w-full" style={{ minHeight: 400 }}>
                    <Image src={enhancedUrl} alt="AI Enhanced" fill className="object-contain" />
                    <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                      ✨ AI Enhanced
                    </div>
                  </div>
                ) : selectedImage ? (
                  <div className="relative w-full" style={{ minHeight: 400 }}>
                    <Image src={selectedImage} alt="Original" fill className="object-contain" />
                    {!enhancedUrl && !processing && (
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-gray-600 text-xs px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        Original garment
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-96 text-gray-300">
                    <FiImage className="w-14 h-14" />
                  </div>
                )}
              </div>
            </div>

            {/* Multi-image selector */}
            {product?.images?.length > 1 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Select image to enhance</p>
                <div className="flex gap-2 flex-wrap">
                  {product.images.map((url: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(url)}
                      className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all
                        ${selectedImage === url ? 'border-purple-600 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                    >
                      <Image src={url} alt={`Image ${i + 1}`} width={56} height={56} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── Right: Controls ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Error / Success */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                ⚠️ {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                <FiCheck className="w-4 h-4 flex-shrink-0" /> {success}
              </div>
            )}

            {!enhancedUrl ? (
              <>
                {/* Custom scene / model upload */}
                <div>
                  <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    {activeTab === 'tryon' ? 'Upload Custom Model' : 'Upload Custom Scene'}
                  </h2>
                  <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                    ${mode?.includes('custom') ? 'border-purple-600 bg-purple-50' : 'border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50/30'}`}>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCustomUpload(e, activeTab === 'tryon' ? 'model' : 'scene')} />
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden
                      ${(mode === 'custom-scene' && customSceneUrl) || (mode === 'tryon-custom' && customModelUrl) ? '' : 'bg-purple-100'}`}>
                      {uploadingMedia
                        ? <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        : (activeTab === 'tryon' && customModelUrl)
                          ? <Image src={customModelUrl} alt="Model" width={40} height={40} className="w-full h-full object-cover" />
                          : (activeTab === 'enhance' && customSceneUrl)
                            ? <Image src={customSceneUrl} alt="Scene" width={40} height={40} className="w-full h-full object-cover" />
                            : <FiUser className="text-purple-600 w-4 h-4" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-purple-700">
                        {(activeTab === 'tryon' && customModelUrl) || (activeTab === 'enhance' && customSceneUrl) ? 'Custom selected ✓' : (activeTab === 'tryon' ? '+ Upload My Model' : '+ Upload Custom Scene')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {activeTab === 'tryon' ? 'Try this product on your own model' : 'Place product in your own background'}
                      </p>
                    </div>
                    {mode?.includes('custom') && <FiCheck className="text-purple-600 w-4 h-4 flex-shrink-0" />}
                  </label>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">
                    {activeTab === 'tryon' ? 'OR CHOOSE PRESET MODEL' : 'OR CHOOSE A PRESET SCENE'}
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                {/* Options list */}
                <div>
                  {loadingAssets ? (
                    <div className="text-center py-6">
                      <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-0.5">
                      {activeTab === 'tryon' ? (
                        models.map(m => renderModelCard(m))
                      ) : (
                        <>
                          {recommendedStyles.length > 0 && (
                            <>
                              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide px-1 pt-1">
                                ⭐ Best for {detectedCategory}
                              </p>
                              {recommendedStyles.map(s => renderStyleCard(s, true))}
                              {otherStyles.length > 0 && (
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide px-1 pt-2">
                                  All styles
                                </p>
                              )}
                            </>
                          )}
                          {(detectedCategory === 'generic' ? styles : otherStyles).map(s => renderStyleCard(s, false))}
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Enhance CTA */}
                <button
                  onClick={handleEnhance}
                  disabled={!mode || processing}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700
                    disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold rounded-xl
                    transition-all shadow-lg shadow-purple-200 text-sm"
                >
                  <FiZap className="w-4 h-4" />
                  {processing
                    ? 'Processing…'
                    : mode === 'tryon-custom'
                      ? 'Try On Custom Model'
                      : mode === 'tryon-model'
                        ? `Try On ${models.find(m => m._id === selectedModelId)?.name || 'Model'}`
                        : mode === 'custom-scene'
                          ? 'Place in Custom Scene'
                          : mode === 'style'
                            ? `Apply — ${styles.find(s => s._id === selectedStyleId)?.name || ''}`
                            : activeTab === 'tryon' ? 'Select a Model to Continue' : 'Select a Style to Continue'}
                </button>
              </>
            ) : (
              /* Result actions */
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                  <p className="font-bold text-green-700 flex items-center gap-2 text-sm">
                    <FiCheck className="w-4 h-4" /> {activeTab === 'tryon' ? 'Virtual Try-On complete!' : 'Enhancement complete!'}
                  </p>
                  <p className="text-xs text-green-600 mt-1">Toggle "After ✨" above to compare with the original.</p>
                </div>

                <button
                  onClick={handlePromote}
                  disabled={!!success}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700
                    disabled:bg-green-600 text-white font-bold rounded-xl transition-all text-sm"
                >
                  <FiImage className="w-4 h-4" />
                  {success ? 'Saved to Gallery ✓' : 'Add to Product Gallery'}
                </button>

                <button
                  onClick={reset}
                  className="w-full flex items-center justify-center gap-2 py-3 border-2 border-purple-200
                    text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all text-sm"
                >
                  <FiRefreshCw className="w-4 h-4" /> {activeTab === 'tryon' ? 'Try Another Model' : 'Try a Different Style'}
                </button>

                <button onClick={() => router.back()} className="w-full text-xs text-gray-400 hover:text-gray-600 py-2 transition-colors">
                  Skip & go back
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
