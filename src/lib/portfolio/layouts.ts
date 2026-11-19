/** Every portfolio layout, in the order they are offered. Plain data so server code can validate ids. */
export const LAYOUTS = [
    { id: 'modern', name: 'Modern', description: 'Clean white page with skill cards and a timeline', dark: false },
    { id: 'professional', name: 'Professional', description: 'Light, sticky nav, "available for work" hero', dark: false },
    { id: 'duality', name: 'Duality', description: 'Split hero with your photo between two words', dark: false },
    { id: 'minimal', name: 'Minimal', description: 'Typography-first, almost no decoration', dark: false },
    { id: 'spotlight', name: 'Spotlight', description: 'Dark, big headline with a side column', dark: true },
    { id: 'aurora', name: 'Aurora', description: 'Near-black with a soft colour glow', dark: true },
    { id: 'statement', name: 'Statement', description: 'One huge sentence about who you are', dark: true },
    { id: 'orbit', name: 'Orbit', description: 'Navy with a ring around your photo and stats', dark: true },
    { id: 'dashboard', name: 'Dashboard', description: 'Dark panels, skill tiles and a timeline', dark: true },
    { id: 'creative', name: 'Creative', description: 'Dark sidebar profile with bold cards', dark: true },
] as const;

export type LayoutId = (typeof LAYOUTS)[number]['id'];

export const isLayoutId = (value: unknown): value is LayoutId =>
    typeof value === 'string' && LAYOUTS.some(l => l.id === value);

/** Older saves used these ids */
const ALIASES: Record<string, LayoutId> = { startup: 'creative' };
export const normalizeLayoutId = (value: unknown): LayoutId =>
    isLayoutId(value) ? value : (typeof value === 'string' && ALIASES[value]) || 'modern';
