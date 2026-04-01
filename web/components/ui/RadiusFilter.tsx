'use client';

import { useState } from 'react';
import { MapPin, Plus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RadiusFilterProps {
    value: number;
    onChange: (radius: number) => void;
    className?: string;
}

export default function RadiusFilter({ value, onChange, className = '' }: RadiusFilterProps) {
    const [showCustom, setShowCustom] = useState(false);
    const [customValue, setCustomValue] = useState(value.toString());

    const presetRadii = [5, 10, 20, 50];

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
        <div className={`flex items-center gap-2 flex-shrink-0 ${className}`}>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-700 text-sm font-medium">
                <MapPin size={14} className="text-[#FDB913]" />
                <span className="hidden sm:inline">Range:</span>
            </div>

            <div className="flex items-center gap-1.5 bg-gray-100/50 p-1 rounded-full border border-gray-100 relative">
                {presetRadii.map((radius) => (
                    <button
                        key={radius}
                        onClick={() => handlePresetClick(radius)}
                        suppressHydrationWarning
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-200 z-10 relative ${value === radius && !showCustom
                            ? 'text-black'
                            : 'text-gray-500 hover:text-gray-900'
                            }`}
                    >
                        {radius}km
                        {value === radius && !showCustom && (
                            <motion.div
                                layoutId="radius-pill"
                                className="absolute inset-0 bg-[#FDB913] rounded-full shadow-sm z-[-1]"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ))}

                {!showCustom ? (
                    <button
                        onClick={() => setShowCustom(true)}
                        suppressHydrationWarning
                        className={`relative w-7 h-7 flex items-center justify-center rounded-full text-xs font-bold transition-all duration-200 ${!presetRadii.includes(value)
                            ? 'text-black'
                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                    >
                        <span className="z-10">{!presetRadii.includes(value) ? `${value}` : <Plus size={14} />}</span>
                        {!presetRadii.includes(value) && (
                            <motion.div
                                layoutId="radius-pill"
                                className="absolute inset-0 bg-[#FDB913] rounded-full shadow-sm z-0"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                    </button>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex items-center gap-1 pl-1"
                    >
                        <input
                            type="number"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
                            placeholder="km"
                            className="w-10 bg-transparent text-center text-xs font-bold text-gray-900 outline-none border-b border-gray-300 focus:border-[#FDB913]"
                            autoFocus
                        />
                        <button
                            onClick={handleCustomSubmit}
                            suppressHydrationWarning
                            className="w-6 h-6 flex items-center justify-center bg-[#FDB913] text-black rounded-full hover:bg-[#E5A600]"
                        >
                            <Check size={12} />
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
