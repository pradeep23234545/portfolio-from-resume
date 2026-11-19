
import { ExternalLink, MapPin } from 'lucide-react';
import { PortfolioData } from '@/lib/data/mockData';
import { ProfilePhoto, contactLinks, linkProps, projectHref } from './shared';

interface TemplateProps {
    data: PortfolioData;
    theme: string;
    font: string;
}

export const MinimalTemplate = ({ data, theme, font }: TemplateProps) => {

    // Minimal always uses black/white for layout, accent color for links/buttons
    const getThemeColor = () => {
        switch (theme) {
            case 'emerald': return 'text-emerald-600';
            case 'rose': return 'text-rose-600';
            case 'amber': return 'text-amber-600';
            case 'slate': return 'text-slate-800';
            default: return 'text-indigo-600'; // indigo
        }
    };

    const fontClass = font === 'serif' ? 'font-serif' : font === 'mono' ? 'font-mono' : 'font-sans';
    const themeColor = getThemeColor();

    return (
        <div className={`min-h-full bg-white text-black ${fontClass} p-8 md:p-16`}>

            <div className="max-w-3xl mx-auto space-y-24">

                {/* Header */}
                <header className="space-y-6">
                    <ProfilePhoto data={data} className="w-20 h-20 grayscale-[30%]" fallbackClassName="bg-black text-white" />
                    <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight break-words">
                        {data.name}.
                    </h1>
                    <p className={`text-xl md:text-2xl ${themeColor}`}>
                        {data.title}
                    </p>
                    <p className="text-xl text-gray-500 max-w-xl leading-relaxed">
                        {data.bio}
                    </p>

                    {data.location && (
                        <p className="flex items-center gap-1.5 text-gray-400"><MapPin className="h-4 w-4" />{data.location}</p>
                    )}
                    <div className="flex gap-4 pt-4">
                        {contactLinks(data).map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} title={label} aria-label={label} className="text-gray-400 hover:text-black transition-colors">
                                <Icon className="h-6 w-6" />
                            </a>
                        ))}
                    </div>
                </header>

                <hr className="border-gray-100" />

                {/* Projects */}
                <section>
                    <div className="flex items-baseline justify-between mb-12">
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">Selected Work</h2>
                    </div>

                    <div className="space-y-16">
                        {data.projects.map(project => (
                            <div key={project.id} className="group">
                                <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                                    <h3 className="text-2xl font-medium group-hover:text-gray-600 transition-colors">{project.title}</h3>
                                    {projectHref(project) && (
                                        <a {...linkProps(projectHref(project))} className={`text-sm ${themeColor} md:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                                            View Project <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                                <p className="text-gray-500 mb-4 max-w-xl">{project.description}</p>
                                <div className="flex gap-2">
                                    {project.tags.map(tag => (
                                        <span key={tag} className="text-xs text-gray-400 border border-gray-100 px-2 py-1 rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* Experience & Skills Split */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                    {/* Experience */}
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Experience</h2>
                        <div className="space-y-8">
                            {data.experience.map(job => (
                                <div key={job.id}>
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h4 className="font-medium">{job.company}</h4>
                                        <span className="text-sm text-gray-400">{job.period}</span>
                                    </div>
                                    <p className="text-sm text-gray-500">{job.role}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Skills */}
                    <section>
                        <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Skills</h2>
                        <div className="flex flex-wrap gap-x-8 gap-y-6">
                            {([['Frontend', data.skills.frontend], ['Backend', data.skills.backend], ['Tools', data.skills.tools]] as const)
                                .filter(([, list]) => list.length > 0)
                                .map(([label, list]) => (
                                    <div key={label}>
                                        <h4 className="text-xs font-semibold mb-2">{label}</h4>
                                        <ul className="text-sm text-gray-500 space-y-1">
                                            {list.map(s => <li key={s}>{s}</li>)}
                                        </ul>
                                    </div>
                                ))}
                        </div>
                    </section>
                </div>

                {data.education && data.education.length > 0 && (
                    <>
                        <hr className="border-gray-100" />
                        <section>
                            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-8">Education</h2>
                            <div className="space-y-6">
                                {data.education.map(edu => (
                                    <div key={edu.id} className="flex flex-col md:flex-row md:justify-between md:items-baseline gap-1">
                                        <div>
                                            <h4 className="font-medium">{edu.institution}</h4>
                                            <p className="text-sm text-gray-500">{[edu.degree, edu.field].filter(Boolean).join(', ')}</p>
                                        </div>
                                        <span className="text-sm text-gray-400">{[edu.period, edu.grade].filter(Boolean).join(' · ')}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </>
                )}

                <footer className="pt-24 text-center">
                    <p className="text-xs text-gray-300">© {new Date().getFullYear()} {data.name}</p>
                </footer>

            </div>
        </div>
    );
}
