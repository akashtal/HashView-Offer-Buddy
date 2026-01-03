import {
    Factory,
    Cpu,
    Building2,
    Shirt,
    HeartPulse,
    Wheat,
    Package,
    FlaskConical,
    Truck,
    HardHat,
    Lightbulb,
    Wrench,
    Zap,
    TreePine,
    PaintBucket,
    Grid3x3,
    Car,
    Home,
    ChefHat,
    Sparkles,
    Heart,
    Gamepad2,
    Book,
    Music,
    Film,
    PawPrint,
    Dumbbell,
    Mountain,
} from 'lucide-react';

// Icon and color mapping for common categories
export const categoryIconMap: Record<string, { icon: any; color: string; bgColor: string }> = {
    // Automotive & Vehicles
    'car': { icon: Car, color: '#DC2626', bgColor: '#FEE2E2' },
    'auto': { icon: Car, color: '#DC2626', bgColor: '#FEE2E2' },
    'automotive': { icon: Truck, color: '#0F766E', bgColor: '#CCFBF1' },
    'transport': { icon: Truck, color: '#0D9488', bgColor: '#CCFBF1' },
    'vehicle': { icon: Truck, color: '#0F766E', bgColor: '#CCFBF1' },

    // Home & Kitchen
    'home': { icon: Home, color: '#7C3AED', bgColor: '#EDE9FE' },
    'kitchen': { icon: ChefHat, color: '#EA580C', bgColor: '#FED7AA' },
    'house': { icon: Home, color: '#7C3AED', bgColor: '#EDE9FE' },

    // Beauty & Personal Care
    'beauty': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    'personal': { icon: Heart, color: '#DB2777', bgColor: '#FCE7F3' },
    'care': { icon: Heart, color: '#DB2777', bgColor: '#FCE7F3' },
    'cosmetic': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },

    // Toys & Games
    'toy': { icon: Gamepad2, color: '#F59E0B', bgColor: '#FEF3C7' },
    'game': { icon: Gamepad2, color: '#F59E0B', bgColor: '#FEF3C7' },
    'toys': { icon: Gamepad2, color: '#FBBF24', bgColor: '#FEF3C7' },
    'games': { icon: Gamepad2, color: '#FBBF24', bgColor: '#FEF3C7' },

    // Books, Music, Movies & Entertainment
    'book': { icon: Book, color: '#0891B2', bgColor: '#CFFAFE' },
    'music': { icon: Music, color: '#A855F7', bgColor: '#F3E8FF' },
    'movie': { icon: Film, color: '#DC2626', bgColor: '#FEE2E2' },
    'film': { icon: Film, color: '#DC2626', bgColor: '#FEE2E2' },
    'tv': { icon: Film, color: '#EF4444', bgColor: '#FEE2E2' },

    // Pet Supplies
    'pet': { icon: PawPrint, color: '#16A34A', bgColor: '#DCFCE7' },
    'animal': { icon: PawPrint, color: '#15803D', bgColor: '#DCFCE7' },
    'supplies': { icon: Package, color: '#7C3AED', bgColor: '#EDE9FE' },

    // Sports & Outdoors
    'sport': { icon: Dumbbell, color: '#2563EB', bgColor: '#DBEAFE' },
    'outdoor': { icon: Mountain, color: '#059669', bgColor: '#D1FAE5' },
    'fitness': { icon: Dumbbell, color: '#1D4ED8', bgColor: '#DBEAFE' },

    // Manufacturing & Industrial
    'industrial': { icon: Factory, color: '#1E40AF', bgColor: '#DBEAFE' },
    'machinery': { icon: Factory, color: '#7C3AED', bgColor: '#EDE9FE' },
    'plants': { icon: Factory, color: '#2563EB', bgColor: '#DBEAFE' },

    // Electronics
    'electronics': { icon: Cpu, color: '#0891B2', bgColor: '#CFFAFE' },
    'electronic': { icon: Cpu, color: '#0891B2', bgColor: '#CFFAFE' },

    // Construction
    'building': { icon: Building2, color: '#EA580C', bgColor: '#FED7AA' },
    'construction': { icon: HardHat, color: '#D97706', bgColor: '#FEF3C7' },

    // Apparel & Textiles
    'clothing': { icon: Shirt, color: '#DB2777', bgColor: '#FCE7F3' },
    'apparel': { icon: Shirt, color: '#E11D48', bgColor: '#FFE4E6' },
    'textile': { icon: Shirt, color: '#BE185D', bgColor: '#FCE7F3' },
    'shoe': { icon: Shirt, color: '#DB2777', bgColor: '#FCE7F3' },
    'jewelry': { icon: Sparkles, color: '#A855F7', bgColor: '#F3E8FF' },

    // Medical & Healthcare
    'medical': { icon: HeartPulse, color: '#DC2626', bgColor: '#FEE2E2' },
    'healthcare': { icon: HeartPulse, color: '#EF4444', bgColor: '#FEE2E2' },
    'health': { icon: HeartPulse, color: '#DC2626', bgColor: '#FEE2E2' },
    'household': { icon: Home, color: '#7C3AED', bgColor: '#EDE9FE' },

    // Food & Agriculture
    'food': { icon: Wheat, color: '#16A34A', bgColor: '#DCFCE7' },
    'agriculture': { icon: Wheat, color: '#15803D', bgColor: '#DCFCE7' },
    'grains': { icon: Wheat, color: '#16A34A', bgColor: '#DCFCE7' },

    // Packaging
    'packaging': { icon: Package, color: '#9333EA', bgColor: '#F3E8FF' },
    'package': { icon: Package, color: '#7C3AED', bgColor: '#EDE9FE' },

    // Chemicals
    'chemical': { icon: FlaskConical, color: '#059669', bgColor: '#D1FAE5' },
    'chemicals': { icon: FlaskConical, color: '#059669', bgColor: '#D1FAE5' },

    // Tools & Hardware
    'tools': { icon: Wrench, color: '#4338CA', bgColor: '#E0E7FF' },
    'hardware': { icon: Wrench, color: '#4F46E5', bgColor: '#E0E7FF' },

    // Electrical
    'electrical': { icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
    'electric': { icon: Lightbulb, color: '#FBBF24', bgColor: '#FEF3C7' },

    // Wood & Furniture
    'wood': { icon: TreePine, color: '#78350F', bgColor: '#FED7AA' },
    'furniture': { icon: TreePine, color: '#92400E', bgColor: '#FED7AA' },

    // Paint & Coatings
    'paint': { icon: PaintBucket, color: '#C026D3', bgColor: '#FAE8FF' },
    'coating': { icon: PaintBucket, color: '#A21CAF', bgColor: '#FAE8FF' },
};

// Default icon if no match found
export const defaultCategoryIcon = {
    icon: Grid3x3,
    color: '#6366F1',
    bgColor: '#E0E7FF',
};

// Function to get icon for a category based on name matching
export function getCategoryIcon(categoryName: string) {
    if (!categoryName) return defaultCategoryIcon;

    const lowerName = categoryName.toLowerCase();

    // Check for partial matches
    for (const [key, value] of Object.entries(categoryIconMap)) {
        if (lowerName.includes(key)) {
            return value;
        }
    }

    return defaultCategoryIcon;
}
