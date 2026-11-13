import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
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

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
    const { subdomain } = await params;
    const portfolio = await loadPortfolio({ subdomain });
    if (!portfolio) return { title: 'Portfolio' };
    return {
        title: portfolio.seoTitle || portfolio.data.name,
        description: portfolio.seoDescription || undefined,
        openGraph: portfolio.data.avatarUrl ? { images: [portfolio.data.avatarUrl] } : undefined,
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

    const Template = TEMPLATES[portfolio.template as keyof typeof TEMPLATES] || ModernTemplate;
    return <Template data={onlyVisible(portfolio.data)} theme={portfolio.theme} font={portfolio.font} />;
}
