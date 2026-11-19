'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Github, Upload, Linkedin, CheckCircle2, ArrowRight, FileText, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getUserConnections } from '@/actions/user-data';
import { linkGithubUsername, syncGithubRepositories } from '@/actions/github';
import { ALL_SOURCES, SOURCE_LABELS, type DataSource as Source } from '@/lib/portfolio/sources';
import { refreshNotifications } from '@/components/dashboard/NotificationBell';

const SELECTION_KEY = 'portfolio-sources';
type Status = { kind: 'success' | 'error'; text: string } | null;

function StatusMessage({ status }: { status: Status }) {
    if (!status) return null;
    const ok = status.kind === 'success';
    return (
        <p className={`mt-2 flex items-start gap-1.5 text-xs break-words ${ok ? 'text-emerald-600' : 'text-red-600'}`}>
            {ok ? <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0" /> : <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />}
            <span>{status.text}</span>
        </p>
    );
}

/** "Use in portfolio" switch shown on a connected source card */
function UseSourceToggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
    return (
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            Use in my portfolio
        </label>
    );
}

/** "Read Jane Doe: 2 experiences, 1 education, 8 skills. Click Generate to build your portfolio." */
function summarize(data: { name?: string; experiences?: unknown[]; education?: unknown[]; skills?: unknown[]; projects?: unknown[] } | null) {
    const count = (v: unknown) => (Array.isArray(v) ? v.length : 0);
    const n = { experiences: count(data?.experiences), education: count(data?.education), skills: count(data?.skills), projects: count(data?.projects) };
    const parts = [
        n.experiences && `${n.experiences} experience${n.experiences > 1 ? 's' : ''}`,
        n.education && `${n.education} education`,
        n.skills && `${n.skills} skill${n.skills > 1 ? 's' : ''}`,
        n.projects && `${n.projects} project${n.projects > 1 ? 's' : ''}`,
    ].filter(Boolean);
    const who = data?.name ? `Read ${data.name}` : 'Read the PDF';
    return `${who}${parts.length ? `: ${parts.join(', ')}` : ''}. Click Generate to build your portfolio from it.`;
}

export default function ConnectPage() {
    const [githubUsername, setGithubUsername] = useState<string | null>(null);
    const [githubInput, setGithubInput] = useState('');
    const [resumeUploaded, setResumeUploaded] = useState(false);
    const [linkedinUploaded, setLinkedinUploaded] = useState(false);
    const [busy, setBusy] = useState<Source | null>(null);
    const [status, setStatus] = useState<Record<Source, Status>>({ github: null, resume: null, linkedin: null });
    const [editingGithub, setEditingGithub] = useState(false);
    // Sources the user wants the portfolio built from; null until connections load
    const [selected, setSelected] = useState<Set<Source> | null>(null);

    const resumeInput = useRef<HTMLInputElement>(null);
    const linkedinInput = useRef<HTMLInputElement>(null);

    const setSourceStatus = (source: Source, value: Status) =>
        setStatus(prev => ({ ...prev, [source]: value }));

    const storeSelection = (next: Set<Source>) => {
        try { localStorage.setItem(SELECTION_KEY, JSON.stringify([...next])); } catch { /* storage unavailable */ }
    };
    const toggleSource = (source: Source, on: boolean) => {
        const next = new Set(selected ?? []);
        if (on) next.add(source); else next.delete(source);
        setSelected(next);
        storeSelection(next);
    };
    /** A newly connected source is used by default */
    const markConnected = (source: Source) => {
        setSelected(prev => {
            const next = new Set(prev ?? []);
            next.add(source);
            storeSelection(next);
            return next;
        });
    };

    useEffect(() => {
        getUserConnections().then(connections => {
            if (!connections) return;
            setGithubUsername(connections.githubUsername);
            setResumeUploaded(connections.resume);
            setLinkedinUploaded(connections.linkedin);

            // Restore the last choice; default to every connected source
            let saved: string[] | null = null;
            try {
                const parsed = JSON.parse(localStorage.getItem(SELECTION_KEY) || 'null');
                if (Array.isArray(parsed)) saved = parsed;
            } catch { /* storage unavailable */ }
            const connected = ALL_SOURCES.filter(s => connections[s]);
            setSelected(new Set(saved ? connected.filter(s => saved.includes(s)) : connected));
        });

        if (new URLSearchParams(window.location.search).get('github') === 'not-configured') {
            setSourceStatus('github', {
                kind: 'error',
                text: 'GitHub sign-in is not set up for this app yet. Enter your GitHub username below instead.',
            });
        }
    }, []);

    const handleLinkGithub = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!githubInput.trim()) return;
        setBusy('github');
        setSourceStatus('github', null);
        try {
            const res = await linkGithubUsername(githubInput);
            if (res.error) {
                setSourceStatus('github', { kind: 'error', text: res.error });
            } else {
                setGithubUsername(res.username ?? githubInput);
                setGithubInput('');
                setEditingGithub(false);
                markConnected('github');
                refreshNotifications();
                setSourceStatus('github', res.syncError
                    ? { kind: 'error', text: `Linked, but syncing repos failed: ${res.syncError}` }
                    : { kind: 'success', text: `Imported ${res.count} repositories.` });
            }
        } catch (err) {
            setSourceStatus('github', { kind: 'error', text: err instanceof Error ? err.message : 'Failed to link GitHub' });
        } finally {
            setBusy(null);
        }
    };

    const handleResync = async () => {
        setBusy('github');
        setSourceStatus('github', null);
        const res = await syncGithubRepositories({ notify: true });
        setSourceStatus('github', res.error
            ? { kind: 'error', text: res.error }
            : { kind: 'success', text: `Synced ${res.count} repositories.` });
        setBusy(null);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'resume' | 'linkedin') => {
        const file = e.target.files?.[0];
        e.target.value = ''; // allow choosing the same file again
        if (!file) return;

        // Read the bytes now: cloud-only files (OneDrive/Google Drive placeholders) can come through as 0 bytes.
        let bytes: ArrayBuffer;
        try {
            bytes = await file.arrayBuffer();
        } catch {
            setSourceStatus(type, { kind: 'error', text: 'Could not read that file. Copy it to your computer (not a cloud-only file) and try again.' });
            return;
        }
        if (bytes.byteLength === 0) {
            setSourceStatus(type, { kind: 'error', text: 'That file is empty (0 bytes). If it is stored in OneDrive/Google Drive, make it available offline or copy it to your computer, then try again.' });
            return;
        }

        setBusy(type);
        setSourceStatus(type, { kind: 'success', text: 'Reading your PDF with AI — this can take up to a minute…' });

        try {
            const formData = new FormData();
            formData.append('file', new Blob([bytes], { type: 'application/pdf' }), file.name);
            const response = await fetch(`/api/upload/${type}`, { method: 'POST', body: formData });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Upload failed with status ${response.status}`);
            }

            refreshNotifications();
            if (type === 'resume') setResumeUploaded(true);
            else setLinkedinUploaded(true);
            markConnected(type);

            // The upload is only saved here; Generate builds the portfolio from it, so a
            // new file never mixes with content from an earlier upload
            const { data } = await response.json().catch(() => ({ data: null }));
            setSourceStatus(type, { kind: 'success', text: summarize(data) });
        } catch (error) {
            setSourceStatus(type, { kind: 'error', text: error instanceof Error ? error.message : 'Upload failed' });
        } finally {
            setBusy(null);
        }
    };

    const githubConnected = !!githubUsername;
    const connectedMap: Record<Source, boolean> = { github: githubConnected, resume: resumeUploaded, linkedin: linkedinUploaded };
    const anyConnected = githubConnected || resumeUploaded || linkedinUploaded;
    const chosen = ALL_SOURCES.filter(s => connectedMap[s] && selected?.has(s));
    const isChosen = (s: Source) => !!selected?.has(s);
    const doneCard = 'border-emerald-500/50 bg-emerald-50/10';
    const idleCard = 'border-slate-200 hover:border-indigo-200';

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Connect Data Sources</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">
                    Link your professional profiles to automatically generate your portfolio content.
                </p>
            </div>

            {/* Hidden file pickers */}
            <input ref={resumeInput} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'resume')} />
            <input ref={linkedinInput} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => handleFileUpload(e, 'linkedin')} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* GitHub */}
                <Card className={`border-2 transition-all ${githubConnected ? doneCard : idleCard}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-slate-900 rounded-xl text-white">
                                <Github className="h-6 w-6" />
                            </div>
                            {githubConnected && (
                                <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>@{githubUsername}</Badge>
                            )}
                        </div>
                        <CardTitle className="mt-4">GitHub</CardTitle>
                        <CardDescription>
                            Import your public repositories, contribution graph, and coding languages.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-slate-500 space-y-2 mb-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Repository details & stars</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Contribution statistics</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Language breakdown</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch">
                        {githubConnected && !editingGithub ? (
                            <>
                            <Button
                                variant="outline"
                                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                onClick={handleResync}
                                loading={busy === 'github'}
                                leftIcon={<RefreshCw className="h-4 w-4" />}
                            >
                                Sync repositories again
                            </Button>
                            <button
                                type="button"
                                className="mt-2 text-center text-xs text-slate-500 underline-offset-2 hover:underline"
                                onClick={() => { setEditingGithub(true); setSourceStatus('github', null); }}
                            >
                                Use a different GitHub account
                            </button>
                            </>
                        ) : (
                            <>
                            {editingGithub && (
                                <p className="mb-2 text-xs text-slate-500">
                                    Repositories from @{githubUsername} will be replaced by the new account&apos;s.
                                </p>
                            )}
                            <form onSubmit={handleLinkGithub} className="flex w-full gap-2">
                                <div className="flex-1">
                                    <Input
                                        placeholder="GitHub username"
                                        value={githubInput}
                                        onChange={(e) => setGithubInput(e.target.value)}
                                        aria-label="GitHub username"
                                        disabled={busy === 'github'}
                                    />
                                </div>
                                <Button type="submit" variant="primary" loading={busy === 'github'} disabled={!githubInput.trim()}>
                                    {editingGithub ? 'Switch' : 'Fetch'}
                                </Button>
                                {editingGithub && (
                                    <Button type="button" variant="ghost" onClick={() => setEditingGithub(false)} disabled={busy === 'github'}>
                                        Cancel
                                    </Button>
                                )}
                            </form>
                            </>
                        )}
                        <StatusMessage status={status.github} />
                        {githubConnected && <UseSourceToggle checked={isChosen('github')} onChange={(v) => toggleSource('github', v)} />}
                        {!githubConnected && !editingGithub && (
                            <a href="/api/auth/github" className="mt-3 text-center text-xs text-slate-500 underline-offset-2 hover:underline">
                                or sign in with GitHub
                            </a>
                        )}
                    </CardFooter>
                </Card>

                {/* Resume */}
                <Card className={`border-2 transition-all ${resumeUploaded ? doneCard : idleCard}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-blue-600 rounded-xl text-white">
                                <FileText className="h-6 w-6" />
                            </div>
                            {resumeUploaded && (
                                <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>Uploaded</Badge>
                            )}
                        </div>
                        <CardTitle className="mt-4">Resume / CV</CardTitle>
                        <CardDescription>
                            Upload your PDF resume to extract work experience, education, and skills.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-slate-500 space-y-2 mb-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Work history parsing</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Education timeline</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Skills extraction</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch">
                        <Button
                            variant="outline"
                            className={`w-full ${resumeUploaded ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800' : ''}`}
                            onClick={() => resumeInput.current?.click()}
                            loading={busy === 'resume'}
                            disabled={!!busy}
                            leftIcon={<Upload className="h-4 w-4" />}
                        >
                            {resumeUploaded ? 'Upload a new resume' : 'Upload PDF'}
                        </Button>
                        <StatusMessage status={status.resume} />
                        {resumeUploaded && <UseSourceToggle checked={isChosen('resume')} onChange={(v) => toggleSource('resume', v)} />}
                    </CardFooter>
                </Card>

                {/* LinkedIn */}
                <Card className={`border-2 transition-all ${linkedinUploaded ? doneCard : idleCard}`}>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-[#0A66C2] rounded-xl text-white">
                                <Linkedin className="h-6 w-6" />
                            </div>
                            {linkedinUploaded && (
                                <Badge variant="success" icon={<CheckCircle2 className="h-3 w-3" />}>Imported</Badge>
                            )}
                        </div>
                        <CardTitle className="mt-4">LinkedIn</CardTitle>
                        <CardDescription>
                            On your LinkedIn profile, click <strong>More → Save to PDF</strong>, then upload that file here.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ul className="text-sm text-slate-500 space-y-2 mb-4">
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Professional summary</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Experience & education</li>
                            <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Skills & certifications</li>
                        </ul>
                    </CardContent>
                    <CardFooter className="flex-col items-stretch">
                        <Button
                            variant="outline"
                            className={`w-full ${linkedinUploaded ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800' : ''}`}
                            onClick={() => linkedinInput.current?.click()}
                            loading={busy === 'linkedin'}
                            disabled={!!busy}
                            leftIcon={<Upload className="h-4 w-4" />}
                        >
                            {linkedinUploaded ? 'Upload a new LinkedIn PDF' : 'Upload PDF Export'}
                        </Button>
                        <StatusMessage status={status.linkedin} />
                        {linkedinUploaded && <UseSourceToggle checked={isChosen('linkedin')} onChange={(v) => toggleSource('linkedin', v)} />}
                    </CardFooter>
                </Card>

                {/* Manual */}
                <Card className="border-2 border-dashed border-slate-200 hover:border-indigo-200 transition-colors bg-slate-50/50">
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="p-3 bg-amber-500 rounded-xl text-white">
                                <Globe className="h-6 w-6" />
                            </div>
                        </div>
                        <CardTitle className="mt-4">Manual Entry</CardTitle>
                        <CardDescription>
                            Want to add details manually? You can always edit your portfolio directly.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-slate-500 mb-4">
                            Perfect for custom projects, freelance work, or skills that aren&apos;t listed on your other profiles.
                        </p>
                    </CardContent>
                    <CardFooter>
                        <Link href="/projects" className="w-full">
                            <Button variant="ghost" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                                Go to Content Manager
                            </Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>

            {anyConnected && (
                <div className="sticky bottom-6 animate-slide-up">
                    <Card className="bg-slate-900 border-slate-800 text-white overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20" />
                        <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    {chosen.length
                                        ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                        : <AlertCircle className="h-5 w-5 text-amber-400" />}
                                    {chosen.length ? 'Ready to generate' : 'No source selected'}
                                </h3>
                                <p className="text-slate-400 mt-1">
                                    {chosen.length
                                        ? <>Your portfolio will be built from <strong className="text-white">{chosen.map(s => SOURCE_LABELS[s]).join(' + ')}</strong> only.</>
                                        : 'Tick “Use in my portfolio” on at least one connected source.'}
                                </p>
                            </div>
                            {chosen.length ? (
                                <Link href={`/generate?sources=${chosen.join(',')}`}>
                                    <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-5 w-5" />} className="shadow-lg shadow-indigo-500/25">
                                        Generate Portfolio Now
                                    </Button>
                                </Link>
                            ) : (
                                <Button size="lg" variant="primary" disabled rightIcon={<ArrowRight className="h-5 w-5" />}>
                                    Generate Portfolio Now
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
