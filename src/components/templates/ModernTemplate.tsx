
import { ExternalLink, MapPin, Github, GraduationCap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './static-card';
import { PortfolioData } from '@/lib/data/mockData';
import { ProfilePhoto, contactLinks, linkProps, projectHref } from './shared';

interface TemplateProps {
    data: PortfolioData;
    theme: string;
    font: string;
}

export const ModernTemplate = ({ data, theme, font }: TemplateProps) => {
    // Helper to get theme class
    const getThemeColor = () => {
        switch (theme) {
            case 'emerald': return 'text-emerald-600';
            case 'rose': return 'text-rose-600';
            case 'amber': return 'text-amber-600';
            case 'slate': return 'text-slate-800';
            default: return 'text-indigo-600'; // indigo
        }
    };

    const getThemeBg = () => {
        switch (theme) {
            case 'emerald': return 'bg-emerald-600';
            case 'rose': return 'bg-rose-600';
            case 'amber': return 'bg-amber-600';
            case 'slate': return 'bg-slate-800';
            default: return 'bg-indigo-600'; // indigo
        }
    }

    const fontClass = font === 'serif' ? 'font-serif' : font === 'mono' ? 'font-mono' : 'font-sans';
    const themeColor = getThemeColor();
    const themeBg = getThemeBg();

    return (
        <div className={`min-h-full bg-slate-50 text-slate-900 ${fontClass}`}>
            {/* Header / Hero */}
            <header className="bg-white border-b border-slate-200">
                <div className="max-w-5xl mx-auto px-6 py-12 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                    <div className="space-y-4 max-w-2xl">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
                            {data.name}
                        </h1>
                        <p className={`text-xl md:text-2xl font-medium ${themeColor}`}>
                            {data.title}
                        </p>
                        <p className="text-lg text-slate-600 leading-relaxed">
                            {data.bio}
                        </p>
                        {data.location && (
                            <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-2">
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" />
                                    {data.location}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-wrap gap-3 pt-4">
                            {contactLinks(data).map(({ key, label, href, icon: Icon }, i) => (
                                <a key={key} {...linkProps(href)}>
                                    {i === 0 ? (
                                        <Button className="rounded-full" leftIcon={<Icon className="h-4 w-4" />}>
                                            {key === 'email' ? 'Contact' : label}
                                        </Button>
                                    ) : (
                                        <Button variant="outline" size="icon" className="rounded-full" title={label} aria-label={label}>
                                            <Icon className="h-4 w-4" />
                                        </Button>
                                    )}
                                </a>
                            ))}
                        </div>
                    </div>
                    <ProfilePhoto
                        data={data}
                        className="order-first md:order-last w-28 h-28 md:w-48 md:h-48 border-4 border-white shadow-lg shrink-0"
                        fallbackClassName={`${themeBg} text-white`}
                    />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-16 space-y-20">

                {/* Skills Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
                        Technical Skills
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {data.skills.frontend.length > 0 && <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-lg">Frontend</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.frontend.map(skill => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>}
                        {data.skills.backend.length > 0 && <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-lg">Backend</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.backend.map(skill => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>}
                        {data.skills.tools.length > 0 && <Card>
                            <CardHeader className="pb-3"><CardTitle className="text-lg">Tools</CardTitle></CardHeader>
                            <CardContent>
                                <div className="flex flex-wrap gap-2">
                                    {data.skills.tools.map(skill => (
                                        <Badge key={skill} variant="secondary">{skill}</Badge>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>}
                    </div>
                </section>

                {/* Projects Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-8">Featured Projects</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {data.projects.map(project => (
                            <Card key={project.id} className="overflow-hidden hover:shadow-lg transition-shadow border-slate-200">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="text-xl font-bold text-slate-900">{project.title}</h3>
                                        <div className="flex gap-2 shrink-0">
                                            {project.repoUrl && (
                                                <a {...linkProps(project.repoUrl)} className={`${themeColor} hover:opacity-70`} aria-label="Source code">
                                                    <Github className="h-5 w-5" />
                                                </a>
                                            )}
                                            {projectHref(project) && projectHref(project) !== project.repoUrl && (
                                                <a {...linkProps(projectHref(project))} className={`${themeColor} hover:opacity-70`} aria-label="Live site">
                                                    <ExternalLink className="h-5 w-5" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-slate-600 mb-4 line-clamp-3">
                                        {project.description}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {project.tags.map(tag => (
                                            <Badge key={tag} variant="outline" className="font-normal">
                                                {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Experience Section */}
                {data.experience.length > 0 && <section>
                    <h2 className="text-2xl font-bold mb-8">Experience</h2>
                    <div className="space-y-8 relative border-l-2 border-slate-200 ml-3 pl-8 pb-4">
                        {data.experience.map((job) => (
                            <div key={job.id} className="relative">
                                <div className={`absolute -left-[39px] top-1 h-5 w-5 rounded-full border-4 border-white ${themeBg}`} />
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                                    <h3 className="text-lg font-bold text-slate-900">{job.role}</h3>
                                    <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                        {job.period}
                                    </span>
                                </div>
                                <div className={`${themeColor} font-medium mb-2`}>{job.company}</div>
                                <p className="text-slate-600">
                                    {job.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>}

                {/* Education Section */}
                {data.education && data.education.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-8">Education</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {data.education.map(edu => (
                                <Card key={edu.id}>
                                    <CardContent className="p-6 flex gap-4">
                                        <GraduationCap className={`h-6 w-6 shrink-0 ${themeColor}`} />
                                        <div>
                                            <h3 className="font-bold text-slate-900">{edu.institution}</h3>
                                            <p className="text-slate-600">{[edu.degree, edu.field].filter(Boolean).join(', ')}</p>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {[edu.period, edu.grade].filter(Boolean).join(' · ')}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

            </main>

            <footer className="bg-white border-t border-slate-200 py-12">
                <div className="max-w-5xl mx-auto px-6 text-center text-slate-500">
                    <p>&copy; {new Date().getFullYear()} {data.name}. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
