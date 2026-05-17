import type { IAiStyle } from '@/models/AiStyle';

export type ProductCategory =
  | 'footwear'
  | 'watch'
  | 'saree'
  | 'perfume'
  | 'electronics'
  | 'furniture'
  | 'jewelry'
  | 'fashion'
  | 'cosmetics'
  | 'bags'
  | 'generic';

export type ProductOrientation = 'horizontal' | 'vertical' | 'square';
export type GenerationQuality = 'preview' | 'premium';

export interface ProductUnderstanding {
  category: ProductCategory;
  subcategory: string;
  material: string;
  orientation: ProductOrientation;
  dominantColor: string;
  style: string;
  sceneType: string;
  composition: string;
  confidence: number;
  source: 'gemini-vision' | 'openai-vision' | 'heuristic';
}

export interface LightingProfile {
  name: string;
  direction: 'left' | 'right' | 'top' | 'front' | 'back';
  temperature: 'cool' | 'neutral' | 'warm';
  brightness: number;
  contrast: number;
  shadowOpacity: number;
  shadowBlur: number;
}

export interface CompositionPlan {
  canvasSize: number;
  productMaxWidth: number;
  productMaxHeight: number;
  gravity: 'center' | 'bottom' | 'lower-third' | 'upper-third';
  xOffset: number;
  yOffset: number;
  floorY: number;
}

export interface ScenePrompt {
  prompt: string;
  negativePrompt: string;
  styleName: string;
  sceneType: string;
  lightingProfile: LightingProfile;
  quality: GenerationQuality;
  cacheKey: string;
}

export interface AiPhotographyMetadata {
  category: ProductCategory;
  subcategory: string;
  material: string;
  orientation: ProductOrientation;
  dominantColor: string;
  sceneType: string;
  lightingProfile: LightingProfile;
  composition: CompositionPlan;
  prompt: string;
  negativePrompt: string;
  generationQuality: GenerationQuality;
  productUnderstanding: ProductUnderstanding;
  vendorModelReference?: string | null;
  workflow: 'product-scene-composite' | 'custom-scene-composite' | 'virtual-try-on-reference';
  cutoutUrl?: string | null;
}

export type AiStyleLike = Pick<
  IAiStyle,
  | 'name'
  | 'slug'
  | 'promptTemplate'
  | 'negativePrompt'
  | 'lightingConfig'
  | 'sceneType'
  | 'compositionRules'
  | 'categoryCompatibility'
>;
