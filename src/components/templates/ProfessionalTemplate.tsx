import { Briefcase, GraduationCap, MapPin, Sparkles } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fontClass, ProjectLinks, sections, skillGroups, type TemplateProps } from './kit';

/** Clean, light layout: sticky top bar, "available" badge, round photo, crisp cards. */
export function ProfessionalTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const primary = links[0];

    return (
        <div style={accentVars(theme)} className={`min-h-full bg-gradient-to-b from-slate-50 to-white text-slate-700 ${fontClass(font)}`}>
            <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
                <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                    <a href="#top" className="font-semibold text-slate-900">{data.name}</a>
                    <div className="hidden md:flex gap-6 text-sm text-slate-500">
                        {sections(data).map(s => <a key={s.id} href={`#${s.id}`} className="hover:text-slate-900">{s.label}</a>)}
                    </div>
                </div>
            </nav>

            <header id="top" className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid gap-12 md:grid-cols-[1.4fr_1fr] items-center">
                <div>
                    <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                        <Sparkles className="h-3.5 w-3.5 text-[color:var(--accent)]" /> Available for work
                    </span>
                    <h1 className="mt-6 text-5xl md:text-6xl font-normal tracking-tight text-slate-900 leading-[1.05]">
                        Hello, I&apos;m<br />{data.name}
                    </h1>
                    <p className="mt-6 text-xl text-slate-600">{data.title}</p>
                    {data.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500"><MapPin className="h-4 w-4" />{data.location}</p>}
                    <div className="mt-8 flex flex-wrap gap-3">
                        {primary && (
                            <a {...linkProps(primary.href)} className="rounded-lg bg-slate-900 px-5 py-3 text-sm font-medium text-white hover:bg-slate-800">
                                {primary.key === 'email' ? 'Get in touch' : primary.label}
                            </a>
                        )}
                        {data.projects.length > 0 && (
                            <a href="#projects" className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-medium text-slate-900 hover:bg-slate-50">View my work</a>
                        )}
                    </div>
                    <div className="mt-6 flex gap-2">
                        {links.slice(1).map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:text-[color:var(--accent)]">
                                <Icon className="h-4 w-4" />
                            </a>
                        ))}
                    </div>
                </div>
                <div className="relative mx-auto">
                    <ProfilePhoto data={data} className="h-64 w-64 lg:h-80 lg:w-80 border-8 border-white shadow-2xl"
                        fallbackClassName="bg-[color:var(--accent)] text-white" />
                    <span className="absolute bottom-4 -right-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Open to opportunities
                    </span>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 pb-24 space-y-24">
                {data.bio && (
                    <section id="about" className="grid gap-8 md:grid-cols-[1fr_2fr]">
                        <h2 className="text-3xl font-semibold text-slate-900">About</h2>
                        <p className="text-lg leading-relaxed text-slate-600">{data.bio}</p>
                    </section>
                )}

                {skillGroups(data).length > 0 && (
                    <section id="skills">
                        <h2 className="text-3xl font-semibold text-slate-900 mb-8">Skills</h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {skillGroups(data).map(g => (
                                <div key={g.label} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <h3 className="font-semibold text-slate-900 mb-4">{g.label}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {g.items.map(s => <span key={s} className="rounded-md bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{s}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience">
                        <h2 className="text-3xl font-semibold text-slate-900 mb-8">Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map(job => (
                                <div key={job.id} className="flex gap-5 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[color:var(--accent-soft)] text-[color:var(--accent)]">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                            <h3 className="font-semibold text-slate-900">{job.role} · <span className="text-[color:var(--accent)]">{job.company}</span></h3>
                                            <span className="text-sm text-slate-500">{job.period}</span>
                                        </div>
                                        <p className="mt-2 text-slate-600">{job.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section id="projects">
                        <h2 className="text-3xl font-semibold text-slate-900 mb-8">Projects</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.projects.map(p => (
                                <article key={p.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-lg font-semibold text-slate-900">{p.title}</h3>
                                        <ProjectLinks project={p} className="text-slate-500" />
                                    </div>
                                    <p className="mt-2 text-slate-600">{p.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {p.tags.map(t => <span key={t} className="rounded-md border border-slate-200 px-2 py-0.5 text-xs text-slate-600">{t}</span>)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education">
                        <h2 className="text-3xl font-semibold text-slate-900 mb-8">Education</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.education!.map(e => (
                                <div key={e.id} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                                    <GraduationCap className="h-6 w-6 shrink-0 text-[color:var(--accent)]" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{e.institution}</h3>
                                        <p className="text-slate-600">{[e.degree, e.field].filter(Boolean).join(', ')}</p>
                                        <p className="text-sm text-slate-500 mt-1">{[e.period, e.grade].filter(Boolean).join(' · ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section id="contact" className="rounded-2xl bg-slate-900 p-10 md:p-14 text-center text-white">
                    <h2 className="text-3xl font-semibold">Let&apos;s build something together</h2>
                    <p className="mt-3 text-slate-400">I&apos;m open to new roles and collaborations.</p>
                    <div className="mt-8 flex flex-wrap justify-center gap-3">
                        {links.map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">
                                <Icon className="h-4 w-4" /> {label}
                            </a>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">&copy; {new Date().getFullYear()} {data.name}</footer>
        </div>
    );
}
