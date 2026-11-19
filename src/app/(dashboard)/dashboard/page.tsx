'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    Sparkles, Eye, Github, FileText, Linkedin, CheckCircle2, AlertCircle, FolderGit2, Briefcase, Cpu, Database,
    Activity, ArrowRight, Palette, GitBranch, Circle, Loader2,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDashboardOverview, type DashboardOverview } from '@/actions/dashboard';

function ago(iso: string | null) {
    if (!iso) return 'never';
    const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
}

const stamp = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });

const SOURCE_ICON = { github: Github, resume: FileText, linkedin: Linkedin };

export default function DashboardPage() {
    const [data, setData] = useState<DashboardOverview | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardOverview()
            .then(d => { if (!d) window.location.href = '/login'; else setData(d); })
            .catch(err => console.error('Failed to load overview', err))
            .finally(() => setLoading(false));
    }, []);

    if (loading || !data) return <DashboardSkeleton />;

    const { portfolio, counts, sources, health } = data;
    const connectedSources = sources.filter(s => s.connected).length;
    const maxTech = Math.max(1, ...data.topTech.map(t => t.count));
    const totalSkills = data.skillCategories.reduce((n, c) => n + c.count, 0);
    const catColor: Record<string, string> = { Frontend: 'bg-indigo-500', Backend: 'bg-emerald-500', Tools: 'bg-amber-500' };

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome back, {data.userName} 👋</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Build status, content and data pipeline for your portfolio.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/generate"><Button variant="primary" leftIcon={<Sparkles className="h-4 w-4" />}>Regenerate</Button></Link>
                    <Link href="/preview"><Button variant="outline" leftIcon={<Eye className="h-4 w-4" />}>Preview</Button></Link>
                </div>
            </div>

            {/* Build status strip */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 px-5 py-4 font-mono text-xs text-slate-300 shadow-sm">
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                    <span className="flex items-center gap-2">
                        <Circle className={`h-2.5 w-2.5 fill-current ${portfolio.isPublished ? 'text-emerald-400' : portfolio.exists ? 'text-amber-400' : 'text-slate-500'}`} />
                        <span className="font-semibold text-white">{portfolio.isPublished ? 'LIVE' : portfolio.exists ? 'DRAFT' : 'NOT BUILT'}</span>
                    </span>
                    <span><span className="text-slate-500">route</span> {portfolio.subdomain ? `/portfolio/${portfolio.subdomain}` : '—'}</span>
                    <span><span className="text-slate-500">layout</span> {portfolio.layout.toLowerCase()}</span>
                    <span><span className="text-slate-500">theme</span> {portfolio.theme}</span>
                    <span><span className="text-slate-500">last build</span> {ago(portfolio.lastGeneratedAt)}</span>
                    <span><span className="text-slate-500">last edit</span> {ago(portfolio.updatedAt)}</span>
                    <span><span className="text-slate-500">sources</span> {connectedSources}/3</span>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Metric icon={<FolderGit2 className="h-5 w-5" />} color="text-indigo-600 bg-indigo-100" label="Projects"
                    value={counts.visibleProjects} detail={`${counts.projects} total · ${counts.withRepo} with repo`} />
                <Metric icon={<Briefcase className="h-5 w-5" />} color="text-purple-600 bg-purple-100" label="Experience"
                    value={counts.experiences} detail={`${counts.education} education entr${counts.education === 1 ? 'y' : 'ies'}`} />
                <Metric icon={<Cpu className="h-5 w-5" />} color="text-emerald-600 bg-emerald-100" label="Skills"
                    value={counts.skills} detail={data.skillCategories.map(c => `${c.count} ${c.label.toLowerCase()}`).join(' · ')} />
                <Metric icon={<Database className="h-5 w-5" />} color="text-amber-600 bg-amber-100" label="Data sources"
                    value={`${connectedSources}/3`} detail={sources.filter(s => s.connected).map(s => s.label).join(', ') || 'none connected'} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Health */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Portfolio Health</CardTitle>
                                    <CardDescription>{health.checks.filter(c => c.completed).length} of {health.checks.length} checks passing</CardDescription>
                                </div>
                                <span className="font-mono text-2xl font-bold text-indigo-600">{health.score}%</span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                                <div className="h-2 rounded-full bg-gradient-primary" style={{ width: `${health.score}%` }} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {health.checks.map(check => (
                                    <Link key={check.label} href={check.href}
                                        className={`group flex items-start gap-2.5 rounded-lg p-2.5 text-sm transition-colors ${check.completed ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}>
                                        {check.completed ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
                                        <span>
                                            <span className="block font-medium">{check.label}</span>
                                            {!check.completed && <span className="block text-xs opacity-80">{check.hint} →</span>}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tech stack */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2"><GitBranch className="h-4 w-4 text-indigo-600" /> Tech stack in projects</CardTitle>
                                <CardDescription>Technologies by number of projects using them</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {data.topTech.length ? (
                                    <ul className="space-y-2.5">
                                        {data.topTech.map(t => (
                                            <li key={t.name} className="grid grid-cols-[96px_1fr_24px] items-center gap-3 text-sm">
                                                <span className="truncate text-slate-700 dark:text-slate-300" title={t.name}>{t.name}</span>
                                                <span className="h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                                                    <span className="block h-2 rounded-full bg-indigo-500" style={{ width: `${(t.count / maxTech) * 100}%` }} />
                                                </span>
                                                <span className="text-right font-mono text-xs text-slate-500">{t.count}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : <p className="text-sm text-slate-500">No project technologies yet.</p>}
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4 text-emerald-600" /> Skill distribution</CardTitle>
                                <CardDescription>{totalSkills} skills across categories</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                                    {data.skillCategories.filter(c => c.count).map(c => (
                                        <span key={c.label} className={catColor[c.label]} style={{ width: `${(c.count / Math.max(1, totalSkills)) * 100}%` }} title={`${c.label}: ${c.count}`} />
                                    ))}
                                </div>
                                <ul className="space-y-2 text-sm">
                                    {data.skillCategories.map(c => (
                                        <li key={c.label} className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300"><span className={`h-2.5 w-2.5 rounded-sm ${catColor[c.label]}`} />{c.label}</span>
                                            <span className="font-mono text-xs text-slate-500">{c.count} · {totalSkills ? Math.round((c.count / totalSkills) * 100) : 0}%</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Data pipeline */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4 text-amber-600" /> Data sources</CardTitle>
                            <CardDescription>What each generation can read from</CardDescription>
                        </CardHeader>
                        <CardContent className="overflow-x-auto">
                            <table className="w-full min-w-[480px] text-sm">
                                <thead>
                                    <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wider text-slate-500">
                                        <th className="pb-2 font-medium">Source</th>
                                        <th className="pb-2 font-medium">Identifier</th>
                                        <th className="pb-2 font-medium">Last sync</th>
                                        <th className="pb-2 font-medium text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sources.map(s => {
                                        const Icon = SOURCE_ICON[s.type];
                                        return (
                                            <tr key={s.type} className="border-b border-slate-50 last:border-0">
                                                <td className="py-2.5"><span className="flex items-center gap-2 font-medium text-slate-900 dark:text-white"><Icon className="h-4 w-4" />{s.label}</span></td>
                                                <td className="py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400 max-w-[180px] truncate">{s.identifier || '—'}</td>
                                                <td className="py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{s.connected ? ago(s.lastSyncedAt) : '—'}</td>
                                                <td className="py-2.5 text-right">
                                                    {s.connected ? (
                                                        <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{s.status}</span>
                                                    ) : (
                                                        <Link href="/connect" className="text-xs font-medium text-indigo-600 hover:underline">connect →</Link>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>

                {/* Right column */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-indigo-600" /> Activity log</CardTitle>
                            <CardDescription>Latest events on your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {data.activity.length ? (
                                <ol className="relative ml-1 space-y-4 border-l border-slate-200 dark:border-slate-800 pl-5">
                                    {data.activity.map(a => (
                                        <li key={a.id} className="relative">
                                            <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ring-4 ring-white dark:ring-slate-950 ${a.read ? 'bg-slate-300' : 'bg-indigo-500'}`} />
                                            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{a.title}</p>
                                            <p className="text-xs text-slate-500 line-clamp-2">{a.body}</p>
                                            <p className="mt-0.5 font-mono text-[11px] text-slate-400">{stamp(a.createdAt)}</p>
                                        </li>
                                    ))}
                                </ol>
                            ) : <p className="text-sm text-slate-500">No activity yet.</p>}
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-3">
                        <QuickAction href="/connect" icon={<Github className="h-5 w-5 text-indigo-600" />} title="Sync sources" text="Re-fetch GitHub or upload new PDFs" />
                        <QuickAction href="/projects" icon={<FolderGit2 className="h-5 w-5 text-purple-600" />} title="Edit projects" text="Descriptions, tags and visibility" />
                        <QuickAction href="/customize" icon={<Palette className="h-5 w-5 text-amber-600" />} title="Customize layout" text="10 layouts, colours and fonts" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ icon, color, label, value, detail }: { icon: React.ReactNode; color: string; label: string; value: number | string; detail: string }) {
    return (
        <Card>
            <CardContent className="p-5">
                <div className="flex items-center gap-3">
                    <span className={`rounded-lg p-2 ${color}`}>{icon}</span>
                    <span className="text-sm font-medium text-slate-500">{label}</span>
                </div>
                <p className="mt-3 font-mono text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                <p className="mt-1 truncate text-xs text-slate-500" title={detail}>{detail}</p>
            </CardContent>
        </Card>
    );
}

function QuickAction({ href, icon, title, text }: { href: string; icon: React.ReactNode; title: string; text: string }) {
    return (
        <Link href={href} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-950">
            <span className="rounded-lg bg-slate-50 p-2 group-hover:bg-indigo-50">{icon}</span>
            <span className="flex-1">
                <span className="block text-sm font-semibold text-slate-900 dark:text-white">{title}</span>
                <span className="block text-xs text-slate-500">{text}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600" />
        </Link>
    );
}

function DashboardSkeleton() {
    return (
        <div className="flex items-center justify-center gap-2 py-24 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading overview…
        </div>
    );
}
