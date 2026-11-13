'use client';

import { useRef, useState } from 'react';
import { usePortfolioStore } from '@/lib/store/usePortfolioStore';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Upload, Github, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ProfilePhoto } from '@/components/templates/shared';
import { formatPeriod } from '@/lib/portfolio/period';
import type { PortfolioData } from '@/lib/data/mockData';

const newId = () => `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const splitList = (v: string) => v.split(',').map(s => s.trim()).filter(Boolean);

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
    return (
        <div className="space-y-1.5">
            <Label className="text-xs">{label}</Label>
            {children}
            {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
        </div>
    );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                {action}
            </div>
            {children}
        </div>
    );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" className="h-4 w-4 accent-indigo-600" checked={checked} onChange={e => onChange(e.target.checked)} />
            {label}
        </label>
    );
}

/** Move an item up/down in a list. */
function move<T>(list: T[], index: number, delta: number): T[] {
    const to = index + delta;
    if (to < 0 || to >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[to]] = [copy[to], copy[index]];
    return copy;
}

export default function ContentEditor() {
    const { data, updateData } = usePortfolioStore();
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInput = useRef<HTMLInputElement>(null);

    const set = (patch: Partial<PortfolioData>) => updateData(patch);
    const setSocial = (patch: Partial<PortfolioData['socials']>) => set({ socials: { ...data.socials, ...patch } });

    const githubUser = data.socials.github.replace(/^https?:\/\/(www\.)?github\.com\//i, '').split(/[/?#]/)[0];

    const uploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        setUploading(true);
        setUploadError(null);
        try {
            const form = new FormData();
            form.append('file', file);
            const res = await fetch('/api/upload/avatar', { method: 'POST', body: form });
            const json = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(json.error || 'Upload failed');
            set({ avatarUrl: json.url });
        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const updateItem = <K extends 'projects' | 'experience' | 'education'>(key: K, index: number, patch: Partial<NonNullable<PortfolioData[K]>[number]>) => {
        const list = [...((data[key] || []) as any[])];
        list[index] = { ...list[index], ...patch };
        set({ [key]: list } as Partial<PortfolioData>);
    };
    const removeItem = (key: 'projects' | 'experience' | 'education', index: number) =>
        set({ [key]: ((data[key] || []) as any[]).filter((_, i) => i !== index) } as Partial<PortfolioData>);
    const moveItem = (key: 'projects' | 'experience' | 'education', index: number, delta: number) =>
        set({ [key]: move((data[key] || []) as any[], index, delta) } as Partial<PortfolioData>);

    const ItemTools = ({ k, i, visible, onVisible }: { k: 'projects' | 'experience' | 'education'; i: number; visible?: boolean; onVisible?: (v: boolean) => void }) => (
        <div className="flex items-center justify-between pt-2">
            {onVisible ? <Toggle checked={visible !== false} onChange={onVisible} label="Show on portfolio" /> : <span />}
            <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveItem(k, i, -1)} aria-label="Move up"><ArrowUp className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => moveItem(k, i, 1)} aria-label="Move down"><ArrowDown className="h-3.5 w-3.5" /></Button>
                <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => removeItem(k, i)}>
                    <Trash2 className="h-3 w-3 mr-1" /> Remove
                </Button>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            {/* ── Profile ───────────────────────────────────── */}
            <Section title="Profile">
                <div className="flex items-center gap-4">
                    <ProfilePhoto data={data} className="h-16 w-16 shrink-0" />
                    <div className="flex flex-wrap gap-2">
                        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
                        <Button variant="outline" size="sm" className="h-8 text-xs" loading={uploading} onClick={() => fileInput.current?.click()}
                            leftIcon={<Upload className="h-3 w-3" />}>
                            Upload photo
                        </Button>
                        {githubUser && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => set({ avatarUrl: `https://github.com/${githubUser}.png` })}
                                leftIcon={<Github className="h-3 w-3" />}>
                                Use GitHub photo
                            </Button>
                        )}
                        {data.avatarUrl && (
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-slate-500" onClick={() => set({ avatarUrl: '' })}>Remove</Button>
                        )}
                    </div>
                </div>
                {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
                <Field label="Full name"><Input value={data.name} onChange={e => set({ name: e.target.value })} /></Field>
                <Field label="Headline" hint="Shown under your name, e.g. “Full-Stack Developer & CS Student”">
                    <Input value={data.title} onChange={e => set({ title: e.target.value })} />
                </Field>
                <Field label="Location"><Input value={data.location} placeholder="Mumbai, India" onChange={e => set({ location: e.target.value })} /></Field>
                <Field label="About me">
                    <Textarea value={data.bio} onChange={e => set({ bio: e.target.value })} className="h-40 text-sm" />
                </Field>
            </Section>

            <div className="h-px bg-slate-100" />

            {/* ── Contact ───────────────────────────────────── */}
            <Section title="Contact & links">
                <Field label="Email">
                    <Input value={data.email} disabled />
                </Field>
                <Toggle checked={data.showEmail !== false} onChange={v => set({ showEmail: v })} label="Show email on portfolio" />
                <Field label="Phone"><Input value={data.phone || ''} placeholder="+91 98765 43210" onChange={e => set({ phone: e.target.value })} /></Field>
                <Toggle checked={!!data.showPhone} onChange={v => set({ showPhone: v })} label="Show phone on portfolio" />
                <Field label="GitHub"><Input value={data.socials.github} placeholder="https://github.com/username" onChange={e => setSocial({ github: e.target.value })} /></Field>
                <Field label="LinkedIn"><Input value={data.socials.linkedin} placeholder="https://linkedin.com/in/username" onChange={e => setSocial({ linkedin: e.target.value })} /></Field>
                <Field label="Website"><Input value={data.website || ''} placeholder="https://yoursite.com" onChange={e => set({ website: e.target.value })} /></Field>
                <Field label="X / Twitter"><Input value={data.socials.twitter || ''} placeholder="@username" onChange={e => setSocial({ twitter: e.target.value })} /></Field>
            </Section>

            <div className="h-px bg-slate-100" />

            {/* ── Projects ──────────────────────────────────── */}
            <Section
                title={`Projects (${data.projects.length})`}
                action={
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                        onClick={() => set({ projects: [{ id: newId(), title: 'New project', description: '', tags: [], link: '', repoUrl: '', visible: true }, ...data.projects] })}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                }
            >
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {data.projects.map((p, i) => (
                        <AccordionItem key={p.id} value={String(p.id)} className="border rounded-lg px-3 bg-white">
                            <AccordionTrigger className="hover:no-underline py-3 text-sm">
                                <span className={`font-medium truncate mr-2 text-left flex items-center gap-2 ${p.visible === false ? 'text-slate-400' : ''}`}>
                                    {p.visible === false && <EyeOff className="h-3.5 w-3.5 shrink-0" />}
                                    {p.title || 'Untitled'}
                                </span>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-2 pb-4">
                                <Field label="Title"><Input value={p.title} onChange={e => updateItem('projects', i, { title: e.target.value })} className="h-8 text-sm" /></Field>
                                <Field label="Description"><Textarea value={p.description} onChange={e => updateItem('projects', i, { description: e.target.value })} className="h-24 text-sm" /></Field>
                                <Field label="Technologies" hint="Comma separated">
                                    <Input value={p.tags.join(', ')} onChange={e => updateItem('projects', i, { tags: splitList(e.target.value) })} className="h-8 text-sm" />
                                </Field>
                                <Field label="Live site URL"><Input value={p.link} placeholder="https://" onChange={e => updateItem('projects', i, { link: e.target.value })} className="h-8 text-sm" /></Field>
                                <Field label="Source code URL"><Input value={p.repoUrl || ''} placeholder="https://github.com/..." onChange={e => updateItem('projects', i, { repoUrl: e.target.value })} className="h-8 text-sm" /></Field>
                                <ItemTools k="projects" i={i} visible={p.visible} onVisible={v => updateItem('projects', i, { visible: v })} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </Section>

            <div className="h-px bg-slate-100" />

            {/* ── Experience ────────────────────────────────── */}
            <Section
                title={`Experience (${data.experience.length})`}
                action={
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                        onClick={() => set({ experience: [{ id: newId(), role: 'Role', company: 'Company', period: '', description: '', startDate: '', endDate: '', isCurrent: false, visible: true }, ...data.experience] })}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                }
            >
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {data.experience.map((e, i) => {
                        const update = (patch: Partial<typeof e>) => {
                            const next = { ...e, ...patch };
                            updateItem('experience', i, { ...patch, period: formatPeriod(next.startDate, next.endDate, next.isCurrent) });
                        };
                        return (
                            <AccordionItem key={e.id} value={String(e.id)} className="border rounded-lg px-3 bg-white">
                                <AccordionTrigger className="hover:no-underline py-3 text-sm">
                                    <span className={`font-medium truncate mr-2 text-left ${e.visible === false ? 'text-slate-400' : ''}`}>
                                        {e.role} · {e.company}
                                    </span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2 pb-4">
                                    <Field label="Role"><Input value={e.role} onChange={ev => update({ role: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <Field label="Company"><Input value={e.company} onChange={ev => update({ company: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label="Start"><Input type="month" value={e.startDate || ''} onChange={ev => update({ startDate: ev.target.value })} className="h-8 text-sm" /></Field>
                                        <Field label="End"><Input type="month" value={e.endDate || ''} disabled={e.isCurrent} onChange={ev => update({ endDate: ev.target.value })} className="h-8 text-sm" /></Field>
                                    </div>
                                    <Toggle checked={!!e.isCurrent} onChange={v => update({ isCurrent: v })} label="I currently work here" />
                                    <Field label="Location"><Input value={e.location || ''} onChange={ev => update({ location: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <Field label="Description"><Textarea value={e.description} onChange={ev => update({ description: ev.target.value })} className="h-24 text-sm" /></Field>
                                    <ItemTools k="experience" i={i} visible={e.visible} onVisible={v => update({ visible: v })} />
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </Section>

            <div className="h-px bg-slate-100" />

            {/* ── Education ─────────────────────────────────── */}
            <Section
                title={`Education (${data.education?.length || 0})`}
                action={
                    <Button variant="outline" size="sm" className="h-8 text-xs"
                        onClick={() => set({ education: [{ id: newId(), institution: 'School / University', degree: '', field: '', period: '', startDate: '', endDate: '', grade: '' }, ...(data.education || [])] })}>
                        <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                }
            >
                <Accordion type="single" collapsible className="w-full space-y-2">
                    {(data.education || []).map((e, i) => {
                        const update = (patch: Partial<typeof e>) => {
                            const next = { ...e, ...patch };
                            updateItem('education', i, { ...patch, period: formatPeriod(next.startDate, next.endDate) });
                        };
                        return (
                            <AccordionItem key={e.id} value={String(e.id)} className="border rounded-lg px-3 bg-white">
                                <AccordionTrigger className="hover:no-underline py-3 text-sm">
                                    <span className="font-medium truncate mr-2 text-left">{e.institution}</span>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 pt-2 pb-4">
                                    <Field label="Institution"><Input value={e.institution} onChange={ev => update({ institution: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <Field label="Degree"><Input value={e.degree} placeholder="B.E." onChange={ev => update({ degree: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <Field label="Field of study"><Input value={e.field || ''} placeholder="Computer Science" onChange={ev => update({ field: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Field label="Start"><Input type="month" value={e.startDate || ''} onChange={ev => update({ startDate: ev.target.value })} className="h-8 text-sm" /></Field>
                                        <Field label="End (or expected)"><Input type="month" value={e.endDate || ''} onChange={ev => update({ endDate: ev.target.value })} className="h-8 text-sm" /></Field>
                                    </div>
                                    <Field label="Grade / CGPA"><Input value={e.grade || ''} onChange={ev => update({ grade: ev.target.value })} className="h-8 text-sm" /></Field>
                                    <ItemTools k="education" i={i} />
                                </AccordionContent>
                            </AccordionItem>
                        );
                    })}
                </Accordion>
            </Section>

            <div className="h-px bg-slate-100" />

            {/* ── Skills ────────────────────────────────────── */}
            <Section title="Skills">
                {(['frontend', 'backend', 'tools'] as const).map(cat => (
                    <Field key={cat} label={cat === 'tools' ? 'Tools & other' : cat[0].toUpperCase() + cat.slice(1)} hint="Comma separated">
                        <SkillList
                            value={data.skills[cat]}
                            onChange={list => set({ skills: { ...data.skills, [cat]: list } })}
                        />
                    </Field>
                ))}
            </Section>

            <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <Eye className="h-3 w-3" /> Changes show in the preview right away. Click Save to publish them.
            </p>
        </div>
    );
}

/** Comma-separated list input that keeps what you type until you leave the field. */
function SkillList({ value, onChange }: { value: string[]; onChange: (list: string[]) => void }) {
    const [text, setText] = useState<string | null>(null);
    return (
        <Textarea
            value={text ?? value.join(', ')}
            onFocus={() => setText(value.join(', '))}
            onChange={e => setText(e.target.value)}
            onBlur={() => { if (text !== null) onChange(splitList(text)); setText(null); }}
            className="h-20 text-sm"
        />
    );
}
