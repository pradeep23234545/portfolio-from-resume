import type { PortfolioData } from '@/lib/data/mockData';

/** What visitors see: hidden items removed and private contact details respected. Safe to use in the browser. */
export function onlyVisibleClient(data: PortfolioData): PortfolioData {
    return {
        ...data,
        phone: data.showPhone ? data.phone : '',
        socials: { ...data.socials, email: data.showEmail === false ? '' : data.socials.email },
        projects: data.projects.filter(p => p.visible !== false),
        experience: data.experience.filter(e => e.visible !== false),
    };
}
