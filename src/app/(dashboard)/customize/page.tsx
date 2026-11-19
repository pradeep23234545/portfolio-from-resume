'use client';

import { useState, useEffect } from 'react';
import { LayoutTemplate, Palette, Type, Layout, Eye, Save, Smartphone, Monitor, Tablet, Check, ArrowRight, FileText, Loader2, Maximize2, Minimize2, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Image from 'next/image';
import { PortfolioLayout, LayoutPicker } from '@/components/templates/registry';
import { FramedPreview } from '@/components/templates/FramedPreview';
import { usePortfolioStore } from '@/lib/store/usePortfolioStore';
import ContentEditor from '@/components/dashboard/ContentEditor';
import Link from 'next/link';
import { getMyPortfolio, saveMyPortfolio } from '@/actions/portfolio-editor';
import { onlyVisibleClient } from '@/lib/portfolio/visible';
import { refreshNotifications } from '@/components/dashboard/NotificationBell';

export default function CustomizePage() {
    const {
        data,
        template,
        theme,
        font,
        deviceView,
        setTemplate,
        setTheme,
        setFont,
        setDeviceView,
        setData
    } = usePortfolioStore();

    const [isSaving, setIsSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [portfolioUrl, setPortfolioUrl] = useState<string | null>(null);
    // 'loading' until the real portfolio is in the editor; Save stays disabled until then
    const [loadState, setLoadState] = useState<'loading' | 'ready' | 'empty'>('loading');

    useEffect(() => {
        getMyPortfolio().then(portfolio => {
            if (!portfolio) {
                setLoadState('empty');
                return;
            }
            setData(portfolio.data);
            setTemplate(portfolio.template);
            setTheme(portfolio.theme);
            setFont(portfolio.font);
            setPortfolioUrl(`/portfolio/${portfolio.subdomain}`);
            setLoadState('ready');
        }).catch(() => setLoadState('empty'));
    }, [setData, setTemplate, setTheme, setFont]);

    const colors = [
        { id: 'indigo', name: 'Indigo', class: 'bg-indigo-500' },
        { id: 'emerald', name: 'Emerald', class: 'bg-emerald-500' },
        { id: 'rose', name: 'Rose', class: 'bg-rose-500' },
        { id: 'amber', name: 'Amber', class: 'bg-amber-500' },
        { id: 'slate', name: 'Slate', class: 'bg-slate-800' },
        { id: 'cyan', name: 'Cyan', class: 'bg-cyan-500' },
        { id: 'orange', name: 'Orange', class: 'bg-orange-500' },
        { id: 'violet', name: 'Violet', class: 'bg-violet-500' },
    ];

    const fonts = [
        { id: 'inter', name: 'Inter + Inter', class: 'font-sans' },
        { id: 'serif', name: 'Merriweather + Sans', class: 'font-serif' },
        { id: 'mono', name: 'Mono + Sans', class: 'font-mono' },
    ];

    const handleSave = async () => {
        setIsSaving(true);
        setSaveMessage('');
        try {
            const result = await saveMyPortfolio({ data, template, theme, font });
            if ('success' in result) {
                setSaveMessage('Saved!');
                refreshNotifications();
                setTimeout(() => setSaveMessage(''), 3000);
                // Reload so newly added items get their database ids
                const fresh = await getMyPortfolio();
                if (fresh) setData(fresh.data);
            } else {
                setSaveMessage(result.error);
            }
        } catch (error: any) {
            setSaveMessage(error.message || 'Error saving.');
        } finally {
            setIsSaving(false);
        }
    };

    // Preview exactly what visitors will see (hidden items removed)
    const renderTemplate = () => <PortfolioLayout template={template} data={onlyVisibleClient(data)} theme={theme} font={font} />;

    return (
        <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-6 animate-fade-in relative">
            {/* Controls Panel */}
            <div className={`${isSidebarOpen ? 'lg:w-96' : 'w-0 opacity-0 overflow-hidden'} transition-all duration-300 ease-in-out flex flex-col h-full z-20 flex-shrink-0`}>
                <Card className="h-full border-slate-200 shadow-xl flex flex-col">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-xl">Edit Portfolio</CardTitle>
                        <CardDescription>Edit your content and design. Changes appear in the preview instantly.</CardDescription>
                    </CardHeader>

                    <div className="flex-1 overflow-y-auto">
                        <Tabs defaultValue="content" className="w-full">
                            <div className="px-6 pt-4 sticky top-0 bg-white z-10 pb-2">
                                <TabsList className="w-full grid grid-cols-4">
                                    <TabsTrigger value="templates" className="text-xs px-1">Templates</TabsTrigger>
                                    <TabsTrigger value="content" className="text-xs px-1">Content</TabsTrigger>
                                    <TabsTrigger value="style" className="text-xs px-1">Style</TabsTrigger>
                                    <TabsTrigger value="layout" className="text-xs px-1">Layout</TabsTrigger>
                                </TabsList>
                            </div>

                            <TabsContent value="templates" className="p-6 space-y-4 pt-2">
                                <h3 className="text-sm font-medium text-slate-900 mb-3 flex items-center gap-2">
                                    <LayoutTemplate className="h-4 w-4" /> Select Template
                                </h3>
                                <LayoutPicker value={template} onChange={setTemplate} columns="grid-cols-2" />
                            </TabsContent>

                            <TabsContent value="content" className="p-6 pt-2">
                                <div className="mb-4 flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-slate-500" />
                                    <h3 className="text-sm font-medium text-slate-900">Edit Content</h3>
                                </div>
                                <ContentEditor />
                            </TabsContent>

                            <TabsContent value="style" className="p-6 space-y-8 pt-2">
                                {/* Colors */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                        <Palette className="h-4 w-4" /> Accent Color
                                    </h3>
                                    <div className="flex flex-wrap gap-3">
                                        {colors.map(c => (
                                            <button
                                                key={c.id}
                                                onClick={() => setTheme(c.id)}
                                                className={`w-10 h-10 rounded-full ${c.class} shadow-sm transition-all flex items-center justify-center ${theme === c.id ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-105'
                                                    }`}
                                            >
                                                {theme === c.id && <Check className="h-5 w-5 text-white" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Fonts */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                        <Type className="h-4 w-4" /> Typography
                                    </h3>
                                    <div className="space-y-2">
                                        {fonts.map(f => (
                                            <div
                                                key={f.id}
                                                onClick={() => setFont(f.id)}
                                                className={`p-3 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${font === f.id
                                                    ? 'border-indigo-500 bg-indigo-50/50'
                                                    : 'border-slate-200 hover:border-slate-300'
                                                    }`}
                                            >
                                                <span className={`text-sm ${f.class}`}>{f.name}</span>
                                                {font === f.id && <Check className="h-4 w-4 text-indigo-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="layout" className="p-6 pt-2">
                                <div className="text-center py-8 text-slate-500">
                                    <Layout className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                    <p>Layout options coming soon</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                        <Button
                            className="w-full"
                            size="lg"
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving || loadState !== 'ready'}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {saveMessage || 'Save Changes'}
                                </>
                            )}
                        </Button>
                    </div>
                </Card>
            </div>

            {/* Preview Panel */}
            <div className="flex-1 flex flex-col min-h-0 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner relative">
                {/* Preview Toolbar */}
                <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-10 relative">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="mr-2"
                            title={isSidebarOpen ? "Expand Preview" : "Show Controls"}
                        >
                            {isSidebarOpen ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                        </Button>
                        <Badge variant="neutral" className="bg-slate-100 text-slate-600">
                            Live Preview
                        </Badge>
                    </div>
                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                        <button
                            onClick={() => setDeviceView('desktop')}
                            className={`p-1.5 rounded-md transition-all ${deviceView === 'desktop' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                            title="Desktop"
                        >
                            <Monitor className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setDeviceView('tablet')}
                            className={`p-1.5 rounded-md transition-all ${deviceView === 'tablet' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                            title="Tablet"
                        >
                            <Tablet className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setDeviceView('mobile')}
                            className={`p-1.5 rounded-md transition-all ${deviceView === 'mobile' ? 'bg-white shadow text-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
                            title="Mobile"
                        >
                            <Smartphone className="h-4 w-4" />
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        rightIcon={<ExternalLink className="h-4 w-4" />}
                        onClick={() => portfolioUrl && window.open(portfolioUrl, '_blank')}
                        disabled={!portfolioUrl}
                    >
                        Open Live
                    </Button>
                </div>

                {/* Preview Viewport */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex items-start justify-center p-8 bg-dot-pattern relative">
                    <div
                        className={`transition-transform duration-300 ease-in-out origin-top mb-10 ${deviceView === 'desktop' ? 'w-full max-w-[1200px]' : ''}`}
                        style={{
                            transform: `scale(${deviceView === 'tablet' ? 0.65 : deviceView === 'mobile' ? 0.85 : 1})`,
                            marginTop: deviceView !== 'desktop' ? '20px' : '60px'
                        }}
                    >
                        <div
                            className={`bg-white shadow-2xl transition-all duration-500 ease-in-out border border-slate-200 overflow-hidden ${deviceView === 'desktop' ? 'w-full h-full max-w-[1200px] rounded-lg' :
                                deviceView === 'tablet' ? 'w-[768px] h-[1024px] rounded-2xl border-8 border-slate-800' :
                                    'w-[375px] h-[812px] rounded-3xl border-8 border-slate-800'
                                }`}
                        >
                            {/* Render the selected layout in a real frame so phone/tablet sizes use their responsive styles */}
                            {loadState === 'ready' ? (
                                <FramedPreview className={`w-full ${deviceView === 'desktop' ? 'h-[calc(100vh-14rem)]' : 'h-full'}`}>
                                    {renderTemplate()}
                                </FramedPreview>
                            ) : (
                            <div className="w-full h-full overflow-y-auto custom-scrollbar">
                                {(
                                    <div className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 p-8 text-center text-slate-500">
                                        {loadState === 'loading' ? (
                                            <><Loader2 className="h-6 w-6 animate-spin" /> Loading your portfolio…</>
                                        ) : (
                                            <>
                                                <p className="font-medium text-slate-900">No portfolio yet</p>
                                                <p className="text-sm">Connect GitHub or upload your resume, then generate your portfolio.</p>
                                                <Link href="/connect"><Button variant="primary" size="sm">Go to Connect</Button></Link>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
