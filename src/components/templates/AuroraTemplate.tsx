import { GraduationCap, MapPin } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fitHeadline, fontClass, firstName, ProjectLinks, sections, skillGroups, type TemplateProps } from './kit';

/** Near-black layout with a soft accent glow, floating pill navigation and glassy cards. */
export function AuroraTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const primary = links[0];
    const [lead, ...rest] = data.title.split(/\s*&\s*|\s+and\s+/i);

    return (
        <div style={accentVars(theme)} className={`relative min-h-full overflow-hidden bg-[#05070a] text-slate-300 ${fontClass(font)}`}>
            {/* glow */}
            <div aria-hidden className="pointer-events-none absolute -top-40 right-[-10%] h-[620px] w-[620px] rounded-full bg-[color:var(--accent)] opacity-25 blur-[140px]" />
            <div aria-hidden className="pointer-events-none absolute top-[40%] -left-40 h-[420px] w-[420px] rounded-full bg-[color:var(--accent)] opacity-10 blur-[120px]" />

            <nav className="relative z-10 flex justify-center pt-6 px-4">
                <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-1 text-sm backdrop-blur">
                    <a href="#top" className="rounded-lg bg-white/10 px-3 py-1.5 font-medium text-white">{firstName(data.name)}</a>
                    {sections(data).slice(0, 4).map(s => (
                        <a key={s.id} href={`#${s.id}`} className="hidden sm:block rounded-lg px-3 py-1.5 hover:text-white">{s.label}</a>
                    ))}
                </div>
            </nav>

            <header id="top" className="relative z-10 max-w-6xl mx-auto px-6 py-20 md:py-28 grid gap-12 md:grid-cols-[1.3fr_1fr] items-center">
                <div className="space-y-6">
                    <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--accent)]" /> Available for opportunities
                    </span>
                    <h1 className={`${fitHeadline(data.title, 'text-4xl lg:text-6xl', 'text-3xl md:text-4xl lg:text-5xl', 34)} font-semibold leading-tight text-white`}>
                        {lead}
                        {rest.length > 0 && <span className="block text-slate-400">&amp; {rest.join(' & ')}</span>}
                    </h1>
                    <p className="max-w-xl text-lg text-slate-400 line-clamp-4">{data.bio}</p>
                    {data.location && <p className="flex items-center gap-2 text-sm text-slate-500"><MapPin className="h-4 w-4" />{data.location}</p>}
                    <div className="flex flex-wrap gap-3">
                        {primary && (
                            <a {...linkProps(primary.href)} className="rounded-md bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-black hover:opacity-90">
                                {primary.key === 'email' ? 'Start a conversation' : primary.label}
                            </a>
                        )}
                        {data.projects.length > 0 && (
                            <a href="#projects" className="rounded-md border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">View my work</a>
                        )}
                    </div>
                </div>
                <div className="relative mx-auto">
                    <div aria-hidden className="absolute inset-0 rounded-3xl bg-[color:var(--accent)] opacity-40 blur-2xl" />
                    <ProfilePhoto data={data} shape="rounded-3xl" className="relative h-72 w-72 lg:h-96 lg:w-80 border border-white/10"
                        fallbackClassName="bg-[color:var(--accent)] text-black" />
                    <p className="relative mt-4 text-center text-sm font-medium text-white">{data.name}</p>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto px-6 pb-24 space-y-24">
                {data.bio && (
                    <section id="about" className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12 backdrop-blur">
                        <h2 className="text-sm font-semibold uppercase tracking-widest text-[color:var(--accent)] mb-4">About</h2>
                        <p className="text-lg leading-relaxed text-slate-300">{data.bio}</p>
                    </section>
                )}

                {skillGroups(data).length > 0 && (
                    <section id="skills">
                        <h2 className="text-3xl font-semibold text-white mb-8">What I work with</h2>
                        <div className="grid gap-4 md:grid-cols-3">
                            {skillGroups(data).map(g => (
                                <div key={g.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                                    <h3 className="text-white font-medium mb-4">{g.label}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {g.items.map(s => <span key={s} className="rounded-md bg-[color:var(--accent-soft)] px-2.5 py-1 text-xs text-white">{s}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section id="projects">
                        <h2 className="text-3xl font-semibold text-white mb-8">Selected work</h2>
                        <div className="grid gap-5 md:grid-cols-2">
                            {data.projects.map(p => (
                                <article key={p.id} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent p-7 hover:border-[color:var(--accent)] transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <h3 className="text-xl font-semibold text-white">{p.title}</h3>
                                        <ProjectLinks project={p} className="text-slate-400" />
                                    </div>
                                    <p className="mt-3 text-sm text-slate-400">{p.description}</p>
                                    <p className="mt-4 text-xs text-[color:var(--accent)]">{p.tags.join(' · ')}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience">
                        <h2 className="text-3xl font-semibold text-white mb-8">Experience</h2>
                        <div className="space-y-4">
                            {data.experience.map(job => (
                                <div key={job.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:flex md:items-start md:justify-between md:gap-8">
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{job.role}</h3>
                                        <p className="text-[color:var(--accent)] text-sm">{job.company}</p>
                                        <p className="mt-3 text-sm text-slate-400">{job.description}</p>
                                    </div>
                                    <span className="mt-3 md:mt-0 block shrink-0 text-xs text-slate-500">{job.period}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education">
                        <h2 className="text-3xl font-semibold text-white mb-8">Education</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.education!.map(e => (
                                <div key={e.id} className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                                    <GraduationCap className="h-6 w-6 shrink-0 text-[color:var(--accent)]" />
                                    <div>
                                        <h3 className="font-semibold text-white">{e.institution}</h3>
                                        <p className="text-sm text-slate-400">{[e.degree, e.field].filter(Boolean).join(', ')}</p>
                                        <p className="text-xs text-slate-500 mt-1">{[e.period, e.grade].filter(Boolean).join(' · ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section id="contact" className="rounded-3xl border border-white/10 bg-[color:var(--accent-soft)] p-10 text-center">
                    <h2 className="text-3xl md:text-4xl font-semibold text-white">Have a project in mind?</h2>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {links.map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 rounded-md border border-white/15 bg-black/30 px-4 py-2 text-sm text-white hover:bg-black/50">
                                <Icon className="h-4 w-4" /> {label}
                            </a>
                        ))}
                    </div>
                </section>
            </main>

            <footer className="relative z-10 border-t border-white/10 py-8 text-center text-xs text-slate-500">
                &copy; {new Date().getFullYear()} {data.name}
            </footer>
        </div>
    );
}
