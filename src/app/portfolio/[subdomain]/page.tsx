import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PortfolioData } from '@/lib/data/mockData';
import { createServiceClient } from '@/lib/supabase/service';

// Templates (Lazy load or import map could be better, but direct import is fine for now)
import { ModernTemplate } from '@/components/templates/ModernTemplate';
import { CreativeTemplate } from '@/components/templates/CreativeTemplate';
import { MinimalTemplate } from '@/components/templates/MinimalTemplate';
// We need to make sure these components are exported from their files
// I will check if they exist, but assuming they do based on previous context.

// Format a DATE column ("2024-06-01") as "Jun 2024"
function formatMonth(date?: string | null) {
    if (!date) return '';
    const d = new Date(date);
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export async function generateMetadata({ params }: { params: Promise<{ subdomain: string }> }): Promise<Metadata> {
    const { subdomain } = await params;
    const supabase = createServiceClient() as any;
    const { data } = await supabase.from('portfolios').select('seo_title, seo_description').eq('subdomain', subdomain).maybeSingle();
    return {
        title: data?.seo_title || 'Portfolio',
        description: data?.seo_description || undefined,
    };
}

export default async function PortfolioPage({ params }: { params: Promise<{ subdomain: string }> }) {
    // Public page: read with the server key (visitors are not signed in) and only show visible items
    const supabase: any = createServiceClient();
    const { subdomain } = await params;

    // 1. Fetch Portfolio by Subdomain
    const { data: portfolio, error: portfolioError } = await supabase
        .from('portfolios')
        .select(`
            *,
            users (
                full_name,
                email,
                github_username,
                linkedin_url
            )
        `)
        .eq('subdomain', subdomain)
        .single();

    if (portfolioError || !portfolio || portfolio.is_public === false) {
        // Fallback for "demo-user" to static mock data if DB missing (optional, but good for "Open Live" default link)
        if (subdomain === 'demo-user') {
            const { portfolioData } = await import('@/lib/data/mockData');
            return <ModernTemplate data={portfolioData} theme="indigo" font="sans" />;
        }
        return notFound();
    }

    const portfolioId = portfolio.id;

    // 2. Fetch Content
    const [{ data: skills }, { data: projects }, { data: experiences }, { data: aboutRows }] = await Promise.all([
        supabase.from('skills').select('*').eq('portfolio_id', portfolioId).eq('is_visible', true).order('display_order', { ascending: true }),
        supabase.from('projects').select('*').eq('portfolio_id', portfolioId).eq('is_visible', true).order('display_order', { ascending: true }),
        supabase.from('experiences').select('*').eq('portfolio_id', portfolioId).eq('is_visible', true).order('start_date', { ascending: false }),
        supabase.from('portfolio_content').select('content, metadata').eq('portfolio_id', portfolioId).eq('section_type', 'about').limit(1),
    ]);
    const about = aboutRows?.[0];

    // 3. Transform to PortfolioData shape
    const portfolioData: PortfolioData = {
        name: portfolio.users?.full_name || 'Portfolio User',
        email: portfolio.users?.email || '',
        title: about?.metadata?.hero_tagline || experiences?.[0]?.role || 'Developer',
        bio: about?.content || portfolio.seo_description || 'Welcome to my portfolio.',
        location: about?.metadata?.location || '',
        socials: {
            github: portfolio.users?.github_username ? `https://github.com/${portfolio.users.github_username}` : '#',
            linkedin: portfolio.users?.linkedin_url || '#',
            email: portfolio.users?.email ? `mailto:${portfolio.users.email}` : '#'
        },
        skills: {
            frontend: skills?.filter((s: any) => s.category === 'Frontend').map((s: any) => s.skill_name) || [],
            backend: skills?.filter((s: any) => s.category === 'Backend').map((s: any) => s.skill_name) || [],
            tools: skills?.filter((s: any) => s.category === 'Tools' || s.category === 'Other').map((s: any) => s.skill_name) || []
        },
        projects: projects?.map((p: any) => ({
            id: p.id as any,
            title: p.title,
            description: p.short_description || '',
            tags: typeof p.technologies === 'string' ? JSON.parse(p.technologies) : (p.technologies || []), // It might be JSON object or string array depending on how Supabase returns it.
            link: p.demo_url || p.repo_url || '#'
        })) || [],
        experience: experiences?.map((e: any) => ({
            id: e.id as any,
            role: e.role,
            company: e.company,
            period: `${formatMonth(e.start_date)} - ${e.is_current || !e.end_date ? 'Present' : formatMonth(e.end_date)}`,
            description: e.description || ''
        })) || []
    };

    // 4. Render Template
    // 4. Render Template
    const templates = {
        'modern': ModernTemplate,
        'creative': CreativeTemplate,
        'minimal': MinimalTemplate,
        'professional': ModernTemplate, // Fallback or map to new component if exists
        'startup': CreativeTemplate // Fallback
    };

    const templateId = portfolio.template_id as keyof typeof templates;
    const TemplateComponent = templates[templateId] || ModernTemplate;

    const theme = (portfolio.color_scheme as any)?.primary || 'indigo';
    const font = (portfolio.color_scheme as any)?.font || 'sans';

    return <TemplateComponent data={portfolioData} theme={theme} font={font} />;
}
