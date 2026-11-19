import type { ReactNode } from 'react';
import { LAYOUTS, normalizeLayoutId, type LayoutId } from '@/lib/portfolio/layouts';
import type { TemplateProps } from './kit';
import { ModernTemplate } from './ModernTemplate';
import { MinimalTemplate } from './MinimalTemplate';
import { CreativeTemplate } from './CreativeTemplate';
import { SpotlightTemplate } from './SpotlightTemplate';
import { AuroraTemplate } from './AuroraTemplate';
import { DualityTemplate } from './DualityTemplate';
import { StatementTemplate } from './StatementTemplate';
import { ProfessionalTemplate } from './ProfessionalTemplate';
import { OrbitTemplate } from './OrbitTemplate';
import { DashboardTemplate } from './DashboardTemplate';

/** Renders the portfolio in the chosen layout (unknown ids fall back to Modern) */
export function PortfolioLayout({ template, ...props }: TemplateProps & { template: string }) {
    switch (normalizeLayoutId(template)) {
        case 'professional': return <ProfessionalTemplate {...props} />;
        case 'duality': return <DualityTemplate {...props} />;
        case 'minimal': return <MinimalTemplate {...props} />;
        case 'spotlight': return <SpotlightTemplate {...props} />;
        case 'aurora': return <AuroraTemplate {...props} />;
        case 'statement': return <StatementTemplate {...props} />;
        case 'orbit': return <OrbitTemplate {...props} />;
        case 'dashboard': return <DashboardTemplate {...props} />;
        case 'creative': return <CreativeTemplate {...props} />;
        default: return <ModernTemplate {...props} />;
    }
}

const bar = (cls: string) => <div className={`rounded-full ${cls}`} />;

/** Tiny static sketches used in the layout pickers */
const THUMBS: Record<LayoutId, ReactNode> = {
    modern: (
        <div className="h-full bg-slate-50 p-2 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 bg-white p-1.5 rounded-sm">
                <div className="flex-1 space-y-1">{bar('h-1.5 w-3/4 bg-slate-800')}{bar('h-1 w-1/2 bg-indigo-400')}</div>
                <div className="h-5 w-5 rounded-full bg-indigo-300" />
            </div>
            <div className="grid grid-cols-3 gap-1">{[0, 1, 2].map(i => <div key={i} className="h-4 bg-white rounded-sm" />)}</div>
            <div className="grid grid-cols-2 gap-1">{[0, 1].map(i => <div key={i} className="h-5 bg-white rounded-sm" />)}</div>
        </div>
    ),
    professional: (
        <div className="h-full bg-white p-2 flex flex-col gap-1.5">
            <div className="h-1.5 w-full border-b border-slate-200" />
            <div className="flex items-center gap-2">
                <div className="flex-1 space-y-1">{bar('h-1 w-1/3 bg-slate-200')}{bar('h-2 w-3/4 bg-slate-800')}{bar('h-1 w-1/2 bg-slate-400')}
                    <div className="flex gap-1 pt-0.5"><div className="h-1.5 w-5 rounded-sm bg-slate-900" /><div className="h-1.5 w-5 rounded-sm border border-slate-300" /></div></div>
                <div className="h-8 w-8 rounded-full bg-slate-300 border-2 border-white shadow" />
            </div>
        </div>
    ),
    duality: (
        <div className="h-full bg-slate-50 flex flex-col">
            <div className="h-2 bg-slate-900" />
            <div className="flex-1 flex items-center justify-between px-2">
                {bar('h-1.5 w-6 bg-slate-500')}<div className="h-9 w-9 rounded-full bg-slate-300 border-2 border-white" />{bar('h-1.5 w-6 bg-rose-400')}
            </div>
            <div className="grid grid-cols-3 gap-1 p-1.5">{[0, 1, 2].map(i => <div key={i} className="h-3 bg-white shadow-sm rounded-sm" />)}</div>
        </div>
    ),
    minimal: (
        <div className="h-full bg-white p-3 flex flex-col gap-1.5">
            {bar('h-2 w-1/2 bg-slate-900')}{bar('h-1 w-3/4 bg-slate-200')}
            <div className="h-px bg-slate-100 my-1" />
            {bar('h-1 w-full bg-slate-100')}{bar('h-1 w-5/6 bg-slate-100')}{bar('h-1 w-2/3 bg-slate-100')}
        </div>
    ),
    spotlight: (
        <div className="h-full bg-[#1f2124] p-2 grid grid-cols-3 gap-1 items-center">
            <div className="space-y-1">{bar('h-0.5 w-3 bg-white')}{bar('h-1.5 w-full bg-white')}{bar('h-1.5 w-3/4 bg-white')}<div className="h-3 w-3 rounded-full bg-blue-500" /></div>
            <div className="h-12 rounded-md bg-slate-500" />
            <div className="space-y-1">{bar('h-1 w-2/3 bg-slate-400')}{bar('h-1 w-full bg-slate-600')}{bar('h-1 w-2/3 bg-slate-400')}{bar('h-1 w-full bg-slate-600')}</div>
        </div>
    ),
    aurora: (
        <div className="relative h-full bg-[#05070a] overflow-hidden p-2">
            <div className="absolute -top-4 -right-4 h-14 w-14 rounded-full bg-cyan-400 opacity-40 blur-lg" />
            <div className="mx-auto h-1.5 w-12 rounded-sm border border-white/20" />
            <div className="relative mt-2 flex items-center gap-2">
                <div className="flex-1 space-y-1">{bar('h-1 w-1/3 bg-white/30')}{bar('h-2 w-full bg-white')}{bar('h-2 w-2/3 bg-slate-500')}<div className="h-1.5 w-5 rounded-sm bg-cyan-400" /></div>
                <div className="h-10 w-9 rounded-md bg-cyan-700 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
            </div>
        </div>
    ),
    statement: (
        <div className="h-full bg-[#14131c] flex flex-col">
            <div className="flex justify-between"><div className="h-2 w-6 bg-black" /><div className="h-2 w-4 bg-violet-500" /></div>
            <div className="flex-1 grid grid-cols-[2fr_3fr]">
                <div className="bg-black/60 flex items-center justify-center"><div className="h-8 w-6 bg-slate-500" /></div>
                <div className="p-1.5 space-y-1 self-center">{bar('h-1.5 w-full bg-white')}{bar('h-1.5 w-5/6 bg-white')}{bar('h-1.5 w-2/3 bg-slate-500')}</div>
            </div>
        </div>
    ),
    orbit: (
        <div className="h-full bg-[#0f1729] p-2 flex items-center gap-2">
            <div className="flex-1 space-y-1">{bar('h-1 w-1/3 bg-white')}{bar('h-2 w-full bg-white')}<div className="flex gap-1"><div className="h-1.5 w-4 rounded-sm bg-orange-500" /><div className="h-1.5 w-4 rounded-sm border border-white/30" /></div></div>
            <div className="h-12 w-12 rounded-full border-4 border-orange-500 flex items-center justify-center"><div className="h-8 w-8 rounded-full bg-slate-500" /></div>
        </div>
    ),
    dashboard: (
        <div className="h-full bg-[#1c1c1f] p-1.5 space-y-1">
            <div className="flex items-center gap-1 rounded-md bg-[#2b2b2f] p-1.5">
                <div className="flex-1 space-y-1">{bar('h-1.5 w-2/3 bg-amber-400')}{bar('h-1 w-1/2 bg-white')}</div>
                <div className="h-6 w-6 rounded-full bg-slate-500 ring-1 ring-amber-400" />
            </div>
            <div className="grid grid-cols-5 gap-0.5 rounded-md bg-[#2b2b2f] p-1">
                {[0, 1, 2, 3, 4].map(i => <div key={i} className={`h-2.5 rounded-sm ${i === 0 ? 'bg-amber-400' : 'bg-[#1c1c1f]'}`} />)}
            </div>
            <div className="h-3 rounded-md bg-[#2b2b2f]" />
        </div>
    ),
    creative: (
        <div className="h-full bg-slate-950 flex">
            <div className="w-1/3 bg-slate-900 p-1 space-y-1 border-r border-slate-800">{bar('h-1 w-5 bg-indigo-500')}{bar('h-1.5 w-full bg-slate-800')}{bar('h-1.5 w-3/4 bg-slate-800')}</div>
            <div className="w-2/3 p-1.5 space-y-1"><div className="h-6 rounded-md bg-slate-900 border border-slate-800" /><div className="h-6 rounded-md bg-slate-900 border border-slate-800" /></div>
        </div>
    ),
};

/** Grid of layout cards with thumbnails; used on the Generate and Customize pages */
export function LayoutPicker({ value, onChange, columns = 'grid-cols-2' }: { value: string; onChange: (id: LayoutId) => void; columns?: string }) {
    const current = normalizeLayoutId(value);
    return (
        <div className={`grid ${columns} gap-3`} role="radiogroup" aria-label="Portfolio layout">
            {LAYOUTS.map(l => {
                const active = current === l.id;
                return (
                    <button key={l.id} type="button" role="radio" aria-checked={active} onClick={() => onChange(l.id)}
                        className={`group overflow-hidden rounded-xl border-2 text-left transition-all ${active ? 'border-indigo-600 ring-2 ring-indigo-600/20' : 'border-slate-200 hover:border-indigo-300 dark:border-slate-700'}`}>
                        <div className="aspect-[16/10] overflow-hidden border-b border-slate-100 dark:border-slate-800">{THUMBS[l.id]}</div>
                        <div className="p-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white">{l.name}</span>
                                {active && <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-medium text-white">Selected</span>}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">{l.description}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
