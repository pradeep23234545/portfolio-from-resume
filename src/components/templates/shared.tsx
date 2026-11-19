import { Mail, Github, Linkedin, Globe, Phone, Twitter, type LucideIcon } from 'lucide-react';
import type { PortfolioData } from '@/lib/data/mockData';

export interface ContactLink {
    key: string;
    label: string;
    href: string;
    icon: LucideIcon;
}

const withProtocol = (url: string) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);

/**
 * Email links open Gmail's compose window in a new tab instead of `mailto:`,
 * which would launch the visitor's default mail app (often Outlook).
 */
export function gmailComposeUrl(emailOrMailto: string) {
    const to = emailOrMailto.replace(/^mailto:/i, '').split('?')[0];
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}`;
}

/** Contact/social links that actually have a value, in display order. */
export function contactLinks(data: PortfolioData): ContactLink[] {
    const links: (ContactLink | null)[] = [
        data.socials.email ? { key: 'email', label: 'Email', href: gmailComposeUrl(data.socials.email), icon: Mail } : null,
        data.socials.github ? { key: 'github', label: 'GitHub', href: data.socials.github, icon: Github } : null,
        data.socials.linkedin ? { key: 'linkedin', label: 'LinkedIn', href: withProtocol(data.socials.linkedin), icon: Linkedin } : null,
        data.website ? { key: 'website', label: 'Website', href: withProtocol(data.website), icon: Globe } : null,
        data.socials.twitter
            ? { key: 'twitter', label: 'X / Twitter', href: withProtocol(data.socials.twitter.replace(/^@/, 'x.com/')), icon: Twitter }
            : null,
        data.phone ? { key: 'phone', label: data.phone, href: `tel:${data.phone.replace(/[^\d+]/g, '')}`, icon: Phone } : null,
    ];
    return links.filter((l): l is ContactLink => l !== null);
}

/** External links open in a new tab; mailto/tel do not. */
export const linkProps = (href: string) =>
    /^https?:/i.test(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };

export function initials(name: string) {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';
}

/** Profile photo (round unless `shape` says otherwise) with a large initials fallback. */
export function ProfilePhoto({
    data,
    className = '',
    fallbackClassName = 'bg-indigo-600 text-white',
    shape = 'rounded-full',
}: {
    data: PortfolioData;
    className?: string;
    fallbackClassName?: string;
    shape?: string;
}) {
    if (data.avatarUrl) {
        return (
            // eslint-disable-next-line @next/next/no-img-element -- avatars come from arbitrary hosts (GitHub, Supabase storage)
            <img src={data.avatarUrl} alt={data.name} className={`${shape} object-cover ${className}`} />
        );
    }
    return (
        <div className={`${shape} flex items-center justify-center font-bold [container-type:inline-size] ${fallbackClassName} ${className}`}>
            {/* Scales with the box: about a third of its width */}
            <span className="text-[34cqw] leading-none tracking-tight">{initials(data.name)}</span>
        </div>
    );
}

/** Best link for a project: live demo first, then repository. */
export const projectHref = (p: { link?: string; repoUrl?: string }) =>
    (p.link && p.link !== '#' ? p.link : '') || p.repoUrl || '';
