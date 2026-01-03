'use client';

import { useState } from 'react';
import { MapPin } from 'lucide-react';

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
        <div className={`flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ${className}`}>
            {/* Icon only on mobile, icon + label on desktop */}
            <MapPin size={16} className="text-gray-500 flex-shrink-0" />
            <span className="hidden sm:inline text-sm font-medium text-gray-700 whitespace-nowrap">Within:</span>

            <div className="flex items-center gap-1 sm:gap-1.5">
                {presetRadii.map((radius) => (
                    <button
                        key={radius}
                        onClick={() => handlePresetClick(radius)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${value === radius && !showCustom
                                ? 'bg-[#FDB913] text-black shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {radius}km
                    </button>
                ))}

                {!showCustom ? (
                    <button
                        onClick={() => setShowCustom(true)}
                        className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${!presetRadii.includes(value)
                                ? 'bg-[#FDB913] text-black shadow-md'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {!presetRadii.includes(value) ? `${value}km` : '+'}
                    </button>
                ) : (
                    <div className="flex items-center gap-1">
                        <input
                            type="number"
                            value={customValue}
                            onChange={(e) => setCustomValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleCustomSubmit()}
                            placeholder="km"
                            min="1"
                            max="100"
                            className="w-14 sm:w-20 px-1.5 sm:px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#FDB913] focus:border-transparent"
                            autoFocus
                        />
                        <button
                            onClick={handleCustomSubmit}
                            className="px-1.5 sm:px-2 py-1 bg-[#FDB913] text-black text-xs sm:text-sm font-medium rounded-md hover:bg-[#e5a812] transition-colors"
                        >
                            ✓
                        </button>
                        <button
                            onClick={() => setShowCustom(false)}
                            className="px-1.5 sm:px-2 py-1 bg-gray-200 text-gray-700 text-xs sm:text-sm font-medium rounded-md hover:bg-gray-300 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
