import type { CSSProperties } from 'react';
import { ExternalLink, Github } from 'lucide-react';
import type { PortfolioData, PortfolioProject } from '@/lib/data/mockData';
import { linkProps, projectHref } from './shared';

/** Shared props every portfolio layout receives */
export interface TemplateProps {
    data: PortfolioData;
    theme: string;
    font: string;
}

/** Accent colours by theme id; layouts use them through the --accent CSS variables */
const ACCENTS: Record<string, { hex: string; soft: string }> = {
    indigo: { hex: '#6366f1', soft: 'rgba(99,102,241,0.15)' },
    emerald: { hex: '#10b981', soft: 'rgba(16,185,129,0.15)' },
    rose: { hex: '#f43f5e', soft: 'rgba(244,63,94,0.15)' },
    amber: { hex: '#f59e0b', soft: 'rgba(245,158,11,0.15)' },
    slate: { hex: '#64748b', soft: 'rgba(100,116,139,0.18)' },
    cyan: { hex: '#06b6d4', soft: 'rgba(6,182,212,0.15)' },
    orange: { hex: '#f97316', soft: 'rgba(249,115,22,0.15)' },
    violet: { hex: '#8b5cf6', soft: 'rgba(139,92,246,0.15)' },
};

/** Style object that defines --accent / --accent-soft for a layout's root element */
export function accentVars(theme: string): CSSProperties {
    const a = ACCENTS[theme] || ACCENTS.indigo;
    return { '--accent': a.hex, '--accent-soft': a.soft } as CSSProperties;
}

export const fontClass = (font: string) => (font === 'serif' ? 'font-serif' : font === 'mono' ? 'font-mono' : 'font-sans');

/** Picks a smaller headline size when the text is long, so heroes don't become a wall of text */
export const fitHeadline = (text: string, large: string, small: string, limit = 28) => (text.length > limit ? small : large);

export const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

export const allSkills = (data: PortfolioData) => [...data.skills.frontend, ...data.skills.backend, ...data.skills.tools];

/** Skill groups that have entries, with friendly labels */
export function skillGroups(data: PortfolioData) {
    return [
        { label: 'Frontend', items: data.skills.frontend },
        { label: 'Backend', items: data.skills.backend },
        { label: 'Tools & More', items: data.skills.tools },
    ].filter(g => g.items.length > 0);
}

/** Small numbers worth showing in a stats row (only the ones that are non-zero) */
export function stats(data: PortfolioData) {
    return [
        { value: data.projects.length, label: data.projects.length === 1 ? 'Project' : 'Projects' },
        { value: data.experience.length, label: data.experience.length === 1 ? 'Role' : 'Roles' },
        { value: allSkills(data).length, label: 'Skills' },
    ].filter(s => s.value > 0);
}

/** Which page sections exist, for the navigation bars */
export function sections(data: PortfolioData) {
    return [
        { id: 'about', label: 'About', show: !!data.bio },
        { id: 'skills', label: 'Skills', show: allSkills(data).length > 0 },
        { id: 'projects', label: 'Projects', show: data.projects.length > 0 },
        { id: 'experience', label: 'Experience', show: data.experience.length > 0 },
        { id: 'education', label: 'Education', show: (data.education || []).length > 0 },
        { id: 'contact', label: 'Contact', show: true },
    ].filter(s => s.show);
}

/** GitHub / live-site icon links for a project */
export function ProjectLinks({ project, className = '' }: { project: PortfolioProject; className?: string }) {
    const live = projectHref(project);
    return (
        <div className={`flex gap-2 shrink-0 ${className}`}>
            {project.repoUrl && (
                <a {...linkProps(project.repoUrl)} aria-label={`${project.title} source code`} className="hover:opacity-70">
                    <Github className="h-5 w-5" />
                </a>
            )}
            {live && live !== project.repoUrl && (
                <a {...linkProps(live)} aria-label={`${project.title} live site`} className="hover:opacity-70">
                    <ExternalLink className="h-5 w-5" />
                </a>
            )}
        </div>
    );
}
