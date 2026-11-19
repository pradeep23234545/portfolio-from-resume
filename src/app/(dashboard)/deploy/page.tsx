'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
    Rocket, Download, FolderPlus, UploadCloud, Globe, RefreshCw, AlertTriangle, CheckCircle2, ExternalLink, Sparkles, Eye, Copy, Check,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { downloadWebsite } from '@/lib/download-website';
import { refreshNotifications } from '@/components/dashboard/NotificationBell';

type Step = { title: string; body: React.ReactNode };
type Stage = { id: string; label: string; title: string; icon: typeof Rocket; color: string; steps: Step[] };

const NETLIFY_DROP = 'https://app.netlify.com/drop';

function Kbd({ children }: { children: React.ReactNode }) {
    return <kbd className="rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-700">{children}</kbd>;
}

export default function DeployGuidePage() {
    const [downloading, setDownloading] = useState(false);
    const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
    const [copied, setCopied] = useState(false);

    const download = async () => {
        setDownloading(true);
        setMessage(null);
        try {
            await downloadWebsite();
            refreshNotifications();
            setMessage({ ok: true, text: 'index.html saved to your Downloads folder. Continue with step B below.' });
        } catch (err) {
            setMessage({ ok: false, text: err instanceof Error ? err.message : 'Download failed' });
        } finally {
            setDownloading(false);
        }
    };

    const copyDropLink = async () => {
        try {
            await navigator.clipboard.writeText(NETLIFY_DROP);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch { /* clipboard unavailable */ }
    };

    const stages: Stage[] = [
        {
            id: 'a', label: 'A', title: 'Get your portfolio file', icon: Download, color: 'bg-indigo-600',
            steps: [
                { title: 'Generate your portfolio', body: <>Open <Link href="/generate" className="font-medium text-indigo-600 hover:underline">Generate</Link>, choose your sources and a layout, then click <b>Start Formatting</b>.</> },
                { title: 'Check it in Preview', body: <>Open <Link href="/preview" className="font-medium text-indigo-600 hover:underline">Preview</Link>. To change the layout, colours or text use <Link href="/customize" className="font-medium text-indigo-600 hover:underline">Customize</Link> and click <b>Save Changes</b>.</> },
                { title: 'Click “Download website”', body: <>Use the button at the top of this page (or on Preview). Your browser saves a single file named <code className="font-mono text-xs">index.html</code>, usually in <b>Downloads</b>.</> },
            ],
        },
        {
            id: 'b', label: 'B', title: 'Make the website folder', icon: FolderPlus, color: 'bg-purple-600',
            steps: [
                { title: 'Create a new folder', body: <>For example <code className="font-mono text-xs">my-portfolio</code> on your Desktop (right-click → <b>New → Folder</b>).</> },
                { title: 'Move index.html into it', body: <>Keep the name exactly <code className="font-mono text-xs">index.html</code> — that is the page hosts open first.</> },
                { title: 'Optional: test it', body: <>Double-click <code className="font-mono text-xs">index.html</code>. It opens in your browser and should look like your Preview.</> },
            ],
        },
        {
            id: 'c', label: 'C', title: 'Upload to Netlify', icon: UploadCloud, color: 'bg-teal-600',
            steps: [
                { title: 'Open Netlify Drop', body: <>Go to <a href={NETLIFY_DROP} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 hover:underline">app.netlify.com/drop</a>.</> },
                { title: 'Sign up or log in (free)', body: <><b>Sign up with GitHub</b> is the quickest.</> },
                { title: 'Drag the whole folder onto the page', body: <>Drop your <b>my-portfolio folder</b> (not just the file) on the box that says <i>“Drag and drop your site output folder here”</i>.</> },
                { title: 'Open your live link', body: <>After a few seconds Netlify shows <b>“Your site is deployed”</b> with a link like <code className="font-mono text-xs">https://lucky-name-123abc.netlify.app</code>. Anyone can open it now.</> },
            ],
        },
        {
            id: 'd', label: 'D', title: 'Give it a nice address', icon: Globe, color: 'bg-amber-500',
            steps: [
                { title: 'Rename the site', body: <>In Netlify open your site → <b>Site configuration → General → Site details → Change site name</b>.</> },
                { title: 'Choose your name', body: <>For example <code className="font-mono text-xs">your-name</code> → your link becomes <code className="font-mono text-xs">https://your-name.netlify.app</code>.</> },
                { title: 'Share it', body: <>Add the link to your resume, LinkedIn and GitHub profile. A custom domain can be added later under <b>Domain management → Add a domain</b>.</> },
            ],
        },
        {
            id: 'e', label: 'E', title: 'Update it later', icon: RefreshCw, color: 'bg-slate-700',
            steps: [
                { title: 'Download again', body: <>After you regenerate or edit, click <b>Download website</b> again.</> },
                { title: 'Replace the file', body: <>Put the new <code className="font-mono text-xs">index.html</code> in your folder, replacing the old one.</> },
                { title: 'Re-deploy', body: <>In Netlify open your site → <b>Deploys</b> tab → drag the folder onto <i>“Need to update your site? Drag and drop…”</i>. The same link updates in seconds.</> },
            ],
        },
    ];

    // Step numbers continue across stages: 1, 2, 3 … 16
    const firstStep = stages.map((_, i) => stages.slice(0, i).reduce((sum, st) => sum + st.steps.length, 0) + 1);

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                        <Rocket className="h-7 w-7 text-indigo-600" /> Deploy your portfolio
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2">
                        Turn your portfolio into a standalone website and put it online for free with Netlify — it does not depend on this app.
                    </p>
                </div>
                <Button variant="primary" onClick={download} loading={downloading} leftIcon={<Download className="h-4 w-4" />}>
                    Download website
                </Button>
            </div>

            {message && (
                <p role="status" className={`flex items-center gap-2 text-sm ${message.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {message.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} {message.text}
                </p>
            )}

            {/* Why not Ctrl+S */}
            <Card className="border-amber-200 bg-amber-50/60 dark:bg-amber-950/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2 text-amber-800">
                        <AlertTriangle className="h-5 w-5" /> Don&apos;t use <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> to save the page
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-amber-900 space-y-2">
                    <p>
                        Saving the Preview with <Kbd>Ctrl</Kbd> + <Kbd>S</Kbd> (“Save page as”) copies the app&apos;s internal code along with your
                        portfolio — developer tools, scripts and hidden page data that includes your account details. It also still links back to this app.
                    </p>
                    <p>
                        <b>Download website</b> creates one clean <code className="font-mono text-xs">index.html</code> instead: only your portfolio and its
                        styling, your photo built in, no scripts and no account data.
                    </p>
                </CardContent>
            </Card>

            {/* Overview strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {stages.map(s => (
                    <a key={s.id} href={`#stage-${s.id}`} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3 text-sm hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-950">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.color}`}>{s.label}</span>
                        <span className="font-medium text-slate-700 dark:text-slate-300 leading-tight">{s.title}</span>
                    </a>
                ))}
            </div>

            {/* Steps */}
            {stages.map((stage, si) => {
                const Icon = stage.icon;
                return (
                    <Card key={stage.id} id={`stage-${stage.id}`} className="scroll-mt-24">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-3">
                                <span className={`flex h-9 w-9 items-center justify-center rounded-lg text-white ${stage.color}`}><Icon className="h-5 w-5" /></span>
                                <span><span className="text-slate-400 mr-1">{stage.label}.</span>{stage.title}</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="space-y-4">
                                {stage.steps.map((step, i) => {
                                    const n = firstStep[si] + i;
                                    return (
                                        <li key={step.title} className="flex gap-4">
                                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 font-mono text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">{n}</span>
                                            <div className="pt-0.5">
                                                <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
                                                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">{step.body}</p>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ol>
                            {stage.id === 'a' && (
                                <div className="mt-5 flex flex-wrap gap-2 pl-11">
                                    <Link href="/generate"><Button size="sm" variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>Generate</Button></Link>
                                    <Link href="/preview"><Button size="sm" variant="outline" leftIcon={<Eye className="h-4 w-4" />}>Preview</Button></Link>
                                    <Button size="sm" variant="primary" onClick={download} loading={downloading} leftIcon={<Download className="h-4 w-4" />}>Download website</Button>
                                </div>
                            )}
                            {stage.id === 'c' && (
                                <div className="mt-5 flex flex-wrap gap-2 pl-11">
                                    <a href={NETLIFY_DROP} target="_blank" rel="noopener noreferrer">
                                        <Button size="sm" variant="primary" rightIcon={<ExternalLink className="h-4 w-4" />}>Open Netlify Drop</Button>
                                    </a>
                                    <Button size="sm" variant="outline" onClick={copyDropLink} leftIcon={copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}>
                                        {copied ? 'Copied' : 'Copy link'}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                );
            })}

            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Other free hosts</CardTitle>
                    <CardDescription>The same index.html works anywhere that hosts static websites.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2 text-sm text-slate-600 dark:text-slate-400">
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">GitHub Pages</p>
                        <p>Create a public repo named <code className="font-mono text-xs">your-username.github.io</code>, upload <code className="font-mono text-xs">index.html</code>, then Settings → Pages → Deploy from branch <b>main</b>. Live at <code className="font-mono text-xs">https://your-username.github.io</code>.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-slate-900 dark:text-white">Vercel</p>
                        <p>Put <code className="font-mono text-xs">index.html</code> in a GitHub repo, then on vercel.com click <b>Add New → Project</b> and import that repo.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
