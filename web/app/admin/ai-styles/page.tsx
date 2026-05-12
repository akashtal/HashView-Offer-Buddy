'use client';

import { useState, useEffect } from 'react';
import { FiZap, FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiTrash2, FiX, FiCheck } from 'react-icons/fi';

interface AiStyle {
    _id: string;
    name: string;
    slug: string;
    promptTemplate: string;
    negativePrompt?: string;
    thumbnailUrl?: string;
    isActive: boolean;
    createdAt: string;
}

const EMPTY_FORM = {
    name: '',
    promptTemplate: '',
    negativePrompt: '',
    thumbnailUrl: '',
    isActive: true,
};

const STYLE_EMOJIS: Record<string, string> = {
    'amazon-clean': '🛒',
    'luxury-gold': '✨',
    'instagram-viral': '📸',
    'nike-style': '💪',
    'nature-organic': '🌿',
};

export default function AdminAiStylesPage() {
    const [styles, setStyles] = useState<AiStyle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStyle, setEditingStyle] = useState<AiStyle | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadStyles = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/ai-styles?active=false');
            const data = await res.json();
            setStyles(data.data?.styles || []);
        } catch {
            setError('Failed to load styles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadStyles(); }, []);

    const openCreate = () => {
        setEditingStyle(null);
        setForm(EMPTY_FORM);
        setError('');
        setShowModal(true);
    };

    const openEdit = (style: AiStyle) => {
        setEditingStyle(style);
        setForm({
            name: style.name,
            promptTemplate: style.promptTemplate,
            negativePrompt: style.negativePrompt || '',
            thumbnailUrl: style.thumbnailUrl || '',
            isActive: style.isActive,
        });
        setError('');
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.promptTemplate) {
            setError('Name and Prompt Template are required.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const url = editingStyle
                ? `/api/admin/ai-styles/${editingStyle._id}`
                : '/api/admin/ai-styles';
            const method = editingStyle ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.error);
            setShowModal(false);
            setSuccess(editingStyle ? 'Style updated!' : 'Style created!');
            loadStyles();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err: any) {
            setError(err.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const toggleActive = async (style: AiStyle) => {
        try {
            await fetch(`/api/admin/ai-styles/${style._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !style.isActive }),
            });
            setStyles(prev => prev.map(s => s._id === style._id ? { ...s, isActive: !s.isActive } : s));
        } catch {
            setError('Failed to update');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deactivate this style? Vendors will no longer see it.')) return;
        try {
            await fetch(`/api/admin/ai-styles/${id}`, { method: 'DELETE' });
            loadStyles();
        } catch {
            setError('Failed to delete');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <FiZap className="text-purple-600" /> AI Styles
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage the AI Character styles vendors can apply to their product photos
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
                >
                    <FiPlus /> New Style
                </button>
            </div>

            {/* Success message */}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 flex items-center gap-2">
                    <FiCheck /> {success}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500">Total Styles</p>
                    <p className="text-2xl font-bold text-gray-900">{styles.length}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">{styles.filter(s => s.isActive).length}</p>
                </div>
                <div className="bg-white rounded-xl border p-4">
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-gray-400">{styles.filter(s => !s.isActive).length}</p>
                </div>
            </div>

            {/* Styles Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl border p-5 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-2/3 mb-3" />
                            <div className="h-4 bg-gray-100 rounded w-full mb-2" />
                            <div className="h-4 bg-gray-100 rounded w-4/5" />
                        </div>
                    ))}
                </div>
            ) : styles.length === 0 ? (
                <div className="bg-white rounded-2xl border py-16 text-center">
                    <FiZap className="mx-auto text-gray-300 mb-4" size={48} />
                    <h3 className="font-semibold text-gray-600 mb-2">No AI Styles Yet</h3>
                    <p className="text-gray-400 text-sm mb-4">Run <code className="bg-gray-100 px-2 py-0.5 rounded">npm run seed:ai-styles</code> to seed defaults</p>
                    <button onClick={openCreate} className="px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 text-sm font-semibold">
                        Create Manually
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {styles.map(style => (
                        <div key={style._id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${style.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                            {/* Card header */}
                            <div className="flex items-center gap-3 p-5 border-b">
                                <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-2xl flex-shrink-0">
                                    {STYLE_EMOJIS[style.slug] || '🎨'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 truncate">{style.name}</p>
                                    <p className="text-xs text-gray-400 font-mono">{style.slug}</p>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${style.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {style.isActive ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Prompt preview */}
                            <div className="px-5 py-4">
                                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Prompt</p>
                                <p className="text-sm text-gray-700 line-clamp-3">{style.promptTemplate}</p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 px-5 pb-4">
                                <button
                                    onClick={() => openEdit(style)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 hover:text-purple-600 hover:border-purple-300 rounded-lg text-sm font-medium transition-colors"
                                >
                                    <FiEdit2 className="w-3.5 h-3.5" /> Edit
                                </button>
                                <button
                                    onClick={() => toggleActive(style)}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 rounded-lg text-sm font-medium transition-colors"
                                    title={style.isActive ? 'Deactivate' : 'Activate'}
                                >
                                    {style.isActive ? <FiToggleRight className="w-4 h-4" /> : <FiToggleLeft className="w-4 h-4" />}
                                    {style.isActive ? 'Deactivate' : 'Activate'}
                                </button>
                                <button
                                    onClick={() => handleDelete(style._id)}
                                    className="p-2 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 rounded-lg transition-colors"
                                    title="Delete"
                                >
                                    <FiTrash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Create / Edit Modal ── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingStyle ? 'Edit AI Style' : 'Create New AI Style'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                                <FiX />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Style Name *</label>
                                <input
                                    value={form.name}
                                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    placeholder="e.g. Luxury Gold"
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    Prompt Template *
                                </label>
                                <p className="text-xs text-gray-400 mb-1.5">Use <code className="bg-gray-100 px-1 rounded">{'{product}'}</code> as a placeholder for the product name.</p>
                                <textarea
                                    value={form.promptTemplate}
                                    onChange={e => setForm(f => ({ ...f, promptTemplate: e.target.value }))}
                                    placeholder="A professional product photo of a {product}, placed on..."
                                    rows={4}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Negative Prompt</label>
                                <textarea
                                    value={form.negativePrompt}
                                    onChange={e => setForm(f => ({ ...f, negativePrompt: e.target.value }))}
                                    placeholder="blurry, low quality, watermark..."
                                    rows={2}
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thumbnail URL (optional)</label>
                                <input
                                    value={form.thumbnailUrl}
                                    onChange={e => setForm(f => ({ ...f, thumbnailUrl: e.target.value }))}
                                    placeholder="https://..."
                                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                                    className="w-4 h-4 accent-purple-600"
                                />
                                <span className="text-sm text-gray-700 font-medium">Active (visible to vendors)</span>
                            </label>
                        </div>

                        <div className="flex gap-3 p-6 border-t">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Saving…' : editingStyle ? 'Save Changes' : 'Create Style'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
