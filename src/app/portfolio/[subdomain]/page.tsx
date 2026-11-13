import { notFound } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import type { Metadata } from 'next';
import { verifyJWT } from '@/lib/auth';
import { loadPortfolio, onlyVisible } from '@/lib/portfolio/load';
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { CreativeTemplate } from '@/components/templates/CreativeTemplate';
import { MinimalTemplate } from '@/components/templates/MinimalTemplate';

const TEMPLATES = {
    modern: ModernTemplate,
    creative: CreativeTemplate,
    minimal: MinimalTemplate,
    professional: ModernTemplate,
    startup: CreativeTemplate,
};

async function viewerId() {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    return (payload?.sub as string | undefined) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
    const { subdomain } = await params;
    const portfolio = await loadPortfolio({ subdomain });
    if (!portfolio) return { title: 'Portfolio' };
    return {
        title: portfolio.seoTitle || portfolio.data.name,
        description: portfolio.seoDescription || undefined,
        openGraph: portfolio.data.avatarUrl ? { images: [portfolio.data.avatarUrl] } : undefined,
        // Keep drafts out of search engines
        robots: portfolio.isPublished ? undefined : { index: false, follow: false },
    };
}

export default async function PortfolioPage({ params }: { params: Promise<{ subdomain: string }> }) {
    const { subdomain } = await params;
    const portfolio = await loadPortfolio({ subdomain });

    if (!portfolio || !portfolio.isPublic) {
        if (subdomain === 'demo-user') {
            const { portfolioData } = await import('@/lib/data/mockData');
            return <ModernTemplate data={portfolioData} theme="indigo" font="sans" />;
        }
        return notFound();
    }

    // Until published, only the owner can see the page (e.g. in Preview)
    const isOwner = (await viewerId()) === portfolio.userId;
    if (!portfolio.isPublished && !isOwner) return notFound();

    const Template = TEMPLATES[portfolio.template as keyof typeof TEMPLATES] || ModernTemplate;
    return (
        <>
            {!portfolio.isPublished && (
                <div className="sticky top-0 z-50 bg-amber-100 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-900">
                    Draft — only you can see this page.{' '}
                    <Link href="/preview" target="_top" className="font-semibold underline">Publish it</Link> to share it.
                </div>
            )}
            <Template data={onlyVisible(portfolio.data)} theme={portfolio.theme} font={portfolio.font} />
        </>
    );
}
