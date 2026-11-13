'use client';

import { useState, useEffect } from 'react';
import { Smartphone, Tablet, Monitor, ExternalLink, Share2, ArrowRight, Check, Globe, EyeOff, Copy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getPublishStatus, setPublished, type PublishStatus } from '@/actions/publish';

export default function PreviewPage() {
  const [device, setDevice] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<PublishStatus | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [justPublished, setJustPublished] = useState(false);
  // Bumped after publish/unpublish so the preview reloads (draft banner appears/disappears)
  const [frameKey, setFrameKey] = useState(0);

  const portfolioUrl = status ? `/portfolio/${status.subdomain}` : null;

  useEffect(() => {
    getPublishStatus()
      .then(setStatus)
      .catch(error => console.error('Failed to load portfolio status:', error))
      .finally(() => setLoading(false));
  }, []);

  const togglePublish = async () => {
    if (!status) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await setPublished(!status.isPublished);
      if ('error' in result) {
        setPublishError(result.error);
      } else {
        setStatus(result);
        setJustPublished(result.isPublished);
        setFrameKey(k => k + 1);
      }
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setPublishing(false);
    }
  };

  const handleShare = () => {
    if (!portfolioUrl) return;
    const fullUrl = window.location.origin + portfolioUrl;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100 dark:bg-slate-950 -m-8">
      {/* Toolbar */}
      <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-md transition-all ${device === 'mobile' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-2 rounded-md transition-all ${device === 'tablet' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4" />
            </button>
            <button
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-md transition-all ${device === 'desktop' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-2" />
          <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:inline-block">
            {device === 'mobile' ? 'Mobile Portrait (375px)' : device === 'tablet' ? 'Tablet Portrait (768px)' : 'Desktop (100%)'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<ExternalLink className="h-4 w-4" />}
            onClick={() => portfolioUrl && window.open(portfolioUrl, '_blank')}
            disabled={!portfolioUrl}
          >
            Full Screen
          </Button>
          <Link href="/customize">
            <Button variant="outline" size="sm">
              Customize
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            leftIcon={copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            onClick={handleShare}
            disabled={!portfolioUrl}
          >
            {copied ? 'Copied!' : 'Share'}
          </Button>
          {status?.isPublished ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Live
              </span>
              <Button size="sm" variant="outline" leftIcon={<EyeOff className="h-4 w-4" />} onClick={togglePublish} loading={publishing}>
                Unpublish
              </Button>
            </>
          ) : (
            <Button size="sm" variant="primary" leftIcon={<ArrowRight className="h-4 w-4" />} onClick={togglePublish} loading={publishing} disabled={!status}>
              Publish Live
            </Button>
          )}
        </div>
      </div>

      {publishError && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-2 text-sm text-red-700">{publishError}</div>
      )}
      {justPublished && status && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-3 flex flex-wrap items-center gap-3 text-sm text-emerald-900">
          <Globe className="h-4 w-4 shrink-0" />
          <span className="font-medium">Your portfolio is live!</span>
          <a href={portfolioUrl!} target="_blank" rel="noopener noreferrer" className="underline break-all">
            {typeof window !== 'undefined' ? window.location.origin : ''}{portfolioUrl}
          </a>
          <Button size="sm" variant="outline" className="h-7" leftIcon={copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} onClick={handleShare}>
            {copied ? 'Copied!' : 'Copy link'}
          </Button>
          <button onClick={() => setJustPublished(false)} className="ml-auto text-emerald-700 hover:text-emerald-900" aria-label="Dismiss">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Preview Area */}
      <div className={cn(
        "flex-1 overflow-y-auto custom-scrollbar flex justify-center bg-slate-100/50 dark:bg-black/20 p-8",
        device === 'desktop' ? "items-center" : "items-start"
      )}>
        <div
          className={cn(
            "transition-transform duration-300 ease-in-out origin-top",
            device === 'desktop' ? "w-full h-full transform-none" : ""
          )}
          style={{
            transform: device !== 'desktop' ? `scale(${device === 'tablet' ? 0.75 : device === 'mobile' ? 0.9 : 1})` : undefined,
            marginTop: device !== 'desktop' ? '20px' : '0',
            marginBottom: '40px'
          }}
        >
          <div
            className={cn(
              "bg-white transition-all duration-500 ease-in-out shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800",
              device === 'mobile' ? "w-[375px] h-[812px] rounded-[3rem] border-8 border-slate-900 mx-auto" :
                device === 'tablet' ? "w-[768px] h-[1024px] rounded-[2rem] border-8 border-slate-900 mx-auto" :
                  "w-full h-full rounded-lg"
            )}
          >
            {loading ? (
              <div className="w-full h-full flex items-center justify-center bg-white">
                <div className="space-y-4 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-slate-500">Loading your portfolio...</p>
                </div>
              </div>
            ) : portfolioUrl ? (
              <iframe
                key={frameKey}
                src={portfolioUrl}
                className="w-full h-full bg-white"
                title="Portfolio Preview"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-white p-8 text-center">
                <div className="max-w-md space-y-6">
                  <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto">
                    <Monitor className="h-10 w-10 text-indigo-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">No Portfolio Generated Yet</h3>
                    <p className="text-slate-500 mt-2">
                      Connect your data sources and click "Generate Portfolio" to create your personal website.
                    </p>
                  </div>
                  <Link href="/generate">
                    <Button variant="primary">Go to Generator</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
