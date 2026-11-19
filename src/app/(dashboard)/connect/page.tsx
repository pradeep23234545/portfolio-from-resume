'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Github, Upload, Linkedin, CheckCircle2, ArrowRight, FileText, Globe, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getUserConnections } from '@/actions/user-data';
import { applyResumeData } from '@/actions/resume';
import { linkGithubUsername, syncGithubRepositories } from '@/actions/github';

type Source = 'github' | 'resume' | 'linkedin';
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

function summarize(results: { experiences: number; education: number; skills: number; projects: number }) {
    const parts = [
        results.experiences && `${results.experiences} experience${results.experiences > 1 ? 's' : ''}`,
        results.education && `${results.education} education`,
        results.skills && `${results.skills} skill${results.skills > 1 ? 's' : ''}`,
        results.projects && `${results.projects} project${results.projects > 1 ? 's' : ''}`,
    ].filter(Boolean);
    return parts.length ? `Added ${parts.join(', ')}.` : 'Nothing new to add — your portfolio already has these entries.';
}

export default function ConnectPage() {
    const [githubUsername, setGithubUsername] = useState<string | null>(null);
    const [githubInput, setGithubInput] = useState('');
    const [resumeUploaded, setResumeUploaded] = useState(false);
    const [linkedinUploaded, setLinkedinUploaded] = useState(false);
    const [busy, setBusy] = useState<Source | null>(null);
    const [status, setStatus] = useState<Record<Source, Status>>({ github: null, resume: null, linkedin: null });

    const resumeInput = useRef<HTMLInputElement>(null);
    const linkedinInput = useRef<HTMLInputElement>(null);

    const setSourceStatus = (source: Source, value: Status) =>
        setStatus(prev => ({ ...prev, [source]: value }));

    useEffect(() => {
        getUserConnections().then(connections => {
            if (!connections) return;
            setGithubUsername(connections.githubUsername);
            setResumeUploaded(connections.resume);
            setLinkedinUploaded(connections.linkedin);
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
        const res = await syncGithubRepositories();
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

            if (type === 'resume') setResumeUploaded(true);
            else setLinkedinUploaded(true);

            const result = await applyResumeData(type);
            if (result.error) {
                setSourceStatus(type, { kind: 'error', text: `Uploaded, but could not add the data: ${result.error}` });
            } else if (result.results) {
                const warn = result.warnings?.length ? ` Some entries were skipped: ${result.warnings[0]}` : '';
                setSourceStatus(type, { kind: warn ? 'error' : 'success', text: summarize(result.results) + warn });
            }
        } catch (error) {
            setSourceStatus(type, { kind: 'error', text: error instanceof Error ? error.message : 'Upload failed' });
        } finally {
            setBusy(null);
        }
    };

    const githubConnected = !!githubUsername;
    const anyConnected = githubConnected || resumeUploaded || linkedinUploaded;
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
                        {githubConnected ? (
                            <Button
                                variant="outline"
                                className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                                onClick={handleResync}
                                loading={busy === 'github'}
                                leftIcon={<RefreshCw className="h-4 w-4" />}
                            >
                                Sync repositories again
                            </Button>
                        ) : (
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
                                    Connect
                                </Button>
                            </form>
                        )}
                        <StatusMessage status={status.github} />
                        {!githubConnected && (
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
                                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                    Data Sources Connected
                                </h3>
                                <p className="text-slate-400 mt-1">
                                    You&apos;re ready to generate your AI portfolio!
                                </p>
                            </div>
                            <Link href="/generate">
                                <Button size="lg" variant="primary" rightIcon={<ArrowRight className="h-5 w-5" />} className="shadow-lg shadow-indigo-500/25">
                                    Generate Portfolio Now
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
