'use client';

interface FilterBarProps {
    onFilterSelect?: (filterId: string) => void;
    selectedFilter?: string;
}

export default function FilterBar({ onFilterSelect, selectedFilter }: FilterBarProps = {}) {
    const filters = [
        { id: 'relevance', label: 'Relevance' },
        { id: 'delivery', label: 'Delivery Time' },
        { id: 'rating', label: 'Rating' },
        { id: 'cost-low', label: 'Cost: Low to High' },
        { id: 'cost-high', label: 'Cost: High to Low' },
    ];

    return (
        <section className="py-2 bg-white border-b border-[#E9E9EB]">
            <div className="container-custom">
                <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
                    {filters.map((filter) => (
                        <button
                            key={filter.id}
                            onClick={() => onFilterSelect?.(filter.id === selectedFilter ? '' : filter.id)}
                            className={`filter-chip ${selectedFilter === filter.id ? 'active' : ''}`}
                        >
                            {filter.label}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
