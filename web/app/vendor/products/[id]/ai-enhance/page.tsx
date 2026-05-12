'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { FiZap, FiUpload, FiCheck, FiRefreshCw, FiArrowLeft, FiImage, FiUser } from 'react-icons/fi';

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────
interface AiStyle {
    _id: string;
    name: string;
    slug: string;
    thumbnailUrl?: string;
}

type Mode = 'style' | 'custom-scene' | null;

const STYLE_EMOJIS: Record<string, string> = {
    'amazon-clean': '🛒',
    'luxury-gold': '✨',
    'instagram-viral': '📸',
    'nike-style': '💪',
    'nature-organic': '🌿',
};

const PROCESSING_STEPS = [
    'Analysing your image…',
    'Removing background…',
    'Applying AI magic…',
    'Generating styled photo…',
    'Uploading result…',
];

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export default function VendorAiEnhancePage() {
    const params = useParams();
    const router = useRouter();
    const productId = params.id as string;

    // Product state
    const [product, setProduct] = useState<any>(null);
    const [loadingProduct, setLoadingProduct] = useState(true);

    // AI Styles
    const [styles, setStyles] = useState<AiStyle[]>([]);
    const [loadingStyles, setLoadingStyles] = useState(true);

    // Enhancement state
    const [selectedImage, setSelectedImage] = useState<string>('');
    const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
    const [mode, setMode] = useState<Mode>(null);
    const [customSceneUrl, setCustomSceneUrl] = useState<string | null>(null);
    const [uploadingScene, setUploadingScene] = useState(false);

    const [processing, setProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState(0);
    const [enhancedUrl, setEnhancedUrl] = useState<string | null>(null);
    const [showAfter, setShowAfter] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // ── Load product ────────────────────────────────────────────
    useEffect(() => {
        if (!productId || productId === 'undefined') {
            setLoadingProduct(false);
            return;
        }
        (async () => {
            try {
                const res = await fetch(`/api/products/${productId}`);
                const data = await res.json();
                const p = data.data?.product;
                setProduct(p);
                if (p?.images?.[0]) setSelectedImage(p.images[0]);
            } catch {
                setError('Failed to load product');
            } finally {
                setLoadingProduct(false);
            }
        })();
    }, [productId]);

    // ── Load AI styles ──────────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                // Public endpoint — no admin role needed
                const res = await fetch('/api/ai-styles');
                const data = await res.json();
                setStyles(data.data?.styles || []);
            } catch {
                console.error('Failed to load styles');
            } finally {
                setLoadingStyles(false);
            }
        })();
    }, []);

    // ── Processing step ticker ──────────────────────────────────
    useEffect(() => {
        if (!processing) return;
        const interval = setInterval(() => {
            setProcessingStep(s => (s + 1) % PROCESSING_STEPS.length);
        }, 3500);
        return () => clearInterval(interval);
    }, [processing]);

    // ── Upload custom scene ─────────────────────────────────────
    const handleCustomSceneUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingScene(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch('/api/upload', { method: 'POST', body: formData });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setCustomSceneUrl(data.data.url);
            setMode('custom-scene');
            setSelectedStyleId(null);
        } catch (err: any) {
            setError(err.message || 'Upload failed');
        } finally {
            setUploadingScene(false);
        }
    };

    // ── Select style ────────────────────────────────────────────
    const selectStyle = (id: string) => {
        setSelectedStyleId(id);
        setMode('style');
        setCustomSceneUrl(null);
    };

    // ── Trigger AI ──────────────────────────────────────────────
    const handleEnhance = async () => {
        if (!mode || !selectedImage) return;
        setProcessing(true);
        setProcessingStep(0);
        setEnhancedUrl(null);
        setError('');

        try {
            // Step 1: Start the AI job
            const payload: any = {
                productId,
                imageUrl: selectedImage,
                mode,
                productName: product?.title || 'product',
            };
            if (mode === 'style') payload.styleId = selectedStyleId;
            if (mode === 'custom-scene') payload.customSceneUrl = customSceneUrl;

            const res = await fetch('/api/vendor/products/ai-enhance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const { aiGalleryEntryId, predictionId, enhancedUrl: immediateUrl } = data.data;

            // Preview mode returns the URL immediately (synchronous pipeline)
            if (immediateUrl) {
                setEnhancedUrl(immediateUrl);
                setShowAfter(true);
                setProcessing(false);
                return;
            }

            // Step 2: Poll status endpoint until Replicate finishes (~30-90s)
            if (!aiGalleryEntryId) throw new Error('No entry ID returned from server');

            const MAX_POLLS = 50;
            const POLL_INTERVAL = 4000; // 4s

            for (let i = 0; i < MAX_POLLS; i++) {
                await new Promise(r => setTimeout(r, POLL_INTERVAL));

                const statusRes = await fetch(
                    `/api/vendor/products/ai-enhance/status?productId=${productId}&entryId=${aiGalleryEntryId}`,
                    { cache: 'no-store' }
                );
                const statusData = await statusRes.json();

                if (!statusData.success) continue; // transient network error, keep trying

                const { status, enhancedUrl: doneUrl } = statusData.data;

                if (status === 'done' && doneUrl) {
                    setEnhancedUrl(doneUrl);
                    setShowAfter(true);
                    setProcessing(false);
                    return;
                }

                if (status === 'failed') {
                    throw new Error('AI generation failed on Replicate. Please try again.');
                }

                // Update processing step animation
                setProcessingStep(s => (s + 1) % PROCESSING_STEPS.length);
            }

            throw new Error('AI processing timed out (>3 min). Please try again.');
        } catch (err: any) {
            setError(err.message || 'AI processing failed. Please try again.');
            setProcessing(false);
        }
    };


    // ── Promote to gallery ──────────────────────────────────────
    const handlePromote = async () => {
        if (!enhancedUrl) return;
        try {
            const res = await fetch('/api/vendor/products/ai-promote', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, enhancedUrl }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setSuccess('✅ AI image added to your product gallery!');
        } catch (err: any) {
            setError(err.message || 'Failed to save image');
        }
    };

    const reset = () => {
        setEnhancedUrl(null);
        setShowAfter(false);
        setMode(null);
        setSelectedStyleId(null);
        setCustomSceneUrl(null);
        setError('');
        setSuccess('');
    };

    if (loadingProduct) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-500">Loading product…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-violet-50">
            <div className="max-w-5xl mx-auto px-4 py-8">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 rounded-lg hover:bg-white border border-gray-200 transition-colors"
                    >
                        <FiArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <FiZap className="text-purple-600" /> AI Product Enhancement
                        </h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Transform your product photo into a professional e-commerce image
                            {product?.title && <> — <span className="font-medium text-gray-700">{product.title}</span></>}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    {/* ── Left: Preview ── */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* Before/After Toggle */}
                        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-purple-100">
                            <div className="flex p-3 gap-2 border-b">
                                <button
                                    onClick={() => setShowAfter(false)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!showAfter
                                        ? 'bg-purple-600 text-white shadow'
                                        : 'text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    Before
                                </button>
                                <button
                                    onClick={() => enhancedUrl && setShowAfter(true)}
                                    disabled={!enhancedUrl}
                                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${showAfter
                                        ? 'bg-purple-600 text-white shadow'
                                        : 'text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    After ✨
                                </button>
                            </div>

                            <div className="relative bg-gray-50" style={{ minHeight: 400 }}>
                                {processing ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-purple-50 animate-pulse">
                                        <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-purple-700 font-bold text-lg">AI is working…</p>
                                        <p className="text-purple-500 text-sm mt-1">{PROCESSING_STEPS[processingStep]}</p>
                                    </div>
                                ) : (showAfter && enhancedUrl) ? (
                                    <div className="relative w-full h-full" style={{ minHeight: 400 }}>
                                        <Image src={enhancedUrl} alt="AI Enhanced" fill className="object-contain" />
                                        <div className="absolute top-3 right-3 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                                            ✨ AI Enhanced
                                        </div>
                                    </div>
                                ) : selectedImage ? (
                                    <div className="relative w-full" style={{ minHeight: 400 }}>
                                        <Image src={selectedImage} alt="Original" fill className="object-contain" />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-96 text-gray-400">
                                        <FiImage className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Image selector (if product has multiple images) */}
                        {product?.images?.length > 1 && (
                            <div>
                                <p className="text-sm font-medium text-gray-600 mb-2">Select image to enhance:</p>
                                <div className="flex gap-2 flex-wrap">
                                    {product.images.map((url: string, i: number) => (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedImage(url)}
                                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === url ? 'border-purple-600 scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                                        >
                                            <Image src={url} alt={`Image ${i + 1}`} width={64} height={64} className="w-full h-full object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── Right: Controls ── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Error / Success */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm flex items-center gap-2">
                                <FiCheck className="w-5 h-5 flex-shrink-0" />
                                {success}
                            </div>
                        )}

                        {!enhancedUrl ? (
                            <>
                                {/* Style Selection */}
                                <div>
                                    <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">
                                        Choose AI Style
                                    </h2>

                                    {/* Custom Scene Upload */}
                                    <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all mb-2 ${mode === 'custom-scene' ? 'border-purple-600 bg-purple-50' : 'border-dashed border-gray-300 hover:border-purple-400'}`}>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleCustomSceneUpload} />
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden ${mode === 'custom-scene' && customSceneUrl ? '' : 'bg-purple-100'}`}>
                                            {uploadingScene ? (
                                                <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                                            ) : customSceneUrl ? (
                                                <Image src={customSceneUrl} alt="Custom scene" width={48} height={48} className="w-full h-full object-cover" />
                                            ) : (
                                                <FiUser className="text-purple-600 w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-purple-700">
                                                {customSceneUrl ? 'Custom Model/Scene ✓' : '+ Upload My Model / Scene'}
                                            </p>
                                            <p className="text-xs text-gray-500">Use your own model photo or background</p>
                                        </div>
                                        {mode === 'custom-scene' && (
                                            <FiCheck className="ml-auto text-purple-600 w-5 h-5 flex-shrink-0" />
                                        )}
                                    </label>

                                    {/* Divider */}
                                    <div className="flex items-center gap-2 my-3">
                                        <div className="h-px flex-1 bg-gray-200" />
                                        <span className="text-xs text-gray-400">OR CHOOSE A PRESET</span>
                                        <div className="h-px flex-1 bg-gray-200" />
                                    </div>

                                    {/* Predefined Styles */}
                                    {loadingStyles ? (
                                        <div className="text-center py-4">
                                            <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {styles.map(s => (
                                                <button
                                                    key={s._id}
                                                    onClick={() => selectStyle(s._id)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${selectedStyleId === s._id
                                                        ? 'border-purple-600 bg-purple-50'
                                                        : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                                                        }`}
                                                >
                                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden ${selectedStyleId === s._id ? 'bg-purple-100' : 'bg-gray-100'}`}>
                                                        {s.thumbnailUrl ? (
                                                            <Image src={s.thumbnailUrl} alt={s.name} width={48} height={48} className="w-full h-full object-cover" />
                                                        ) : (
                                                            STYLE_EMOJIS[s.slug] || '🎨'
                                                        )}
                                                    </div>
                                                    <span className={`text-sm font-semibold ${selectedStyleId === s._id ? 'text-purple-700' : 'text-gray-700'}`}>
                                                        {s.name}
                                                    </span>
                                                    {selectedStyleId === s._id && (
                                                        <FiCheck className="ml-auto text-purple-600 w-5 h-5 flex-shrink-0" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Enhance Button */}
                                <button
                                    onClick={handleEnhance}
                                    disabled={!mode || processing}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-200"
                                >
                                    <FiZap className="w-5 h-5" />
                                    {processing
                                        ? 'Processing…'
                                        : mode === 'custom-scene'
                                            ? 'Place in Custom Scene'
                                            : mode === 'style'
                                                ? `Apply ${styles.find(s => s._id === selectedStyleId)?.name || ''}`
                                                : 'Select a Style First'}
                                </button>
                            </>
                        ) : (
                            /* ── Result Actions ── */
                            <div className="space-y-3">
                                <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                    <p className="font-bold text-green-700 flex items-center gap-2">
                                        <FiCheck className="w-5 h-5" /> Enhancement complete!
                                    </p>
                                    <p className="text-sm text-green-600 mt-1">Toggle "After" above to see your result.</p>
                                </div>

                                <button
                                    onClick={handlePromote}
                                    disabled={!!success}
                                    className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-green-600 text-white font-bold rounded-xl transition-all"
                                >
                                    <FiImage className="w-5 h-5" />
                                    {success ? 'Saved to Gallery ✓' : 'Add to Product Gallery'}
                                </button>

                                <button
                                    onClick={reset}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-purple-200 text-purple-600 font-semibold rounded-xl hover:bg-purple-50 transition-all"
                                >
                                    <FiRefreshCw className="w-4 h-4" />
                                    Try a Different Style
                                </button>

                                <button
                                    onClick={() => router.back()}
                                    className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
                                >
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
