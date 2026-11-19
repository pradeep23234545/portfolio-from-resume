import { GraduationCap, MapPin } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fontClass, ProjectLinks, skillGroups, type TemplateProps } from './kit';

/** Dark-grey layout built from rounded panels: skill tiles, a timeline and a contact card. */
export function DashboardTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const panel = 'rounded-2xl bg-[#2b2b2f] border border-white/5';

    return (
        <div style={accentVars(theme)} className={`min-h-full bg-[#1c1c1f] text-slate-300 ${fontClass(font)}`}>
            <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 space-y-6">
                {/* Hero panel */}
                <header id="top" className={`${panel} p-8 md:p-12 grid gap-8 md:grid-cols-[1fr_auto] items-center`}>
                    <div>
                        <p className="text-sm text-slate-400">I&apos;m</p>
                        <h1 className="text-4xl md:text-5xl font-bold text-[color:var(--accent)]">{data.name}</h1>
                        <p className="mt-2 text-lg text-white">{data.title}</p>
                        {data.location && <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-400"><MapPin className="h-4 w-4" />{data.location}</p>}
                        <div className="mt-6 flex flex-wrap gap-2">
                            {links.map(({ key, label, href, icon: Icon }, i) => (
                                <a key={key} {...linkProps(href)} aria-label={label}
                                    className={i === 0
                                        ? 'inline-flex items-center gap-2 rounded-lg bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-black'
                                        : 'flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 hover:text-[color:var(--accent)]'}>
                                    <Icon className="h-4 w-4" />{i === 0 && (key === 'email' ? 'Contact me' : label)}
                                </a>
                            ))}
                        </div>
                    </div>
                    <ProfilePhoto data={data} className="mx-auto h-44 w-44 md:h-56 md:w-56 ring-4 ring-[color:var(--accent)] ring-offset-4 ring-offset-[#2b2b2f]"
                        fallbackClassName="bg-[#1c1c1f] text-[color:var(--accent)]" />
                </header>

                {data.bio && (
                    <section id="about" className={`${panel} p-8`}>
                        <h2 className="text-center text-2xl font-bold text-white mb-4">About</h2>
                        <p className="leading-relaxed text-center max-w-3xl mx-auto">{data.bio}</p>
                    </section>
                )}

                {skillGroups(data).length > 0 && (
                    <section id="skills" className={`${panel} p-8`}>
                        <h2 className="text-center text-2xl font-bold text-white mb-6">My Skills</h2>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                            {skillGroups(data).flatMap(g => g.items).map((s, i) => (
                                <div key={s}
                                    className={`flex aspect-[4/3] items-center justify-center rounded-xl p-3 text-center text-sm font-semibold transition-colors ${i === 0 ? 'bg-[color:var(--accent)] text-black' : 'bg-[#1c1c1f] text-white hover:bg-[color:var(--accent-soft)]'}`}>
                                    {s}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section id="projects" className={`${panel} p-8`}>
                        <h2 className="text-center text-2xl font-bold text-white mb-6">Portfolio</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.projects.map(p => (
                                <article key={p.id} className="rounded-xl bg-[#1c1c1f] p-6">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-semibold text-white">{p.title}</h3>
                                        <ProjectLinks project={p} className="text-[color:var(--accent)]" />
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">{p.description}</p>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {p.tags.map(t => <span key={t} className="rounded bg-white/5 px-2 py-0.5 text-xs">{t}</span>)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience" className={`${panel} p-8`}>
                        <h2 className="text-center text-2xl font-bold text-white mb-8">Experience</h2>
                        <div className="relative mx-auto max-w-3xl">
                            <div aria-hidden className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-white/10" />
                            <div className="space-y-8">
                                {data.experience.map((job, i) => (
                                    <div key={job.id} className={`relative pl-12 md:pl-0 md:w-1/2 ${i % 2 ? 'md:ml-auto md:pl-10' : 'md:pr-10 md:text-right'}`}>
                                        <span className={`absolute top-1 h-3 w-3 rounded-full bg-[color:var(--accent)] left-[11px] ${i % 2 ? 'md:-left-[6px]' : 'md:left-auto md:-right-[6px]'}`} />
                                        <p className="text-xs text-[color:var(--accent)]">{job.period}</p>
                                        <h3 className="font-semibold text-white">{job.role}</h3>
                                        <p className="text-sm text-slate-400">{job.company}</p>
                                        <p className="mt-2 text-sm">{job.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education" className={`${panel} p-8`}>
                        <h2 className="text-center text-2xl font-bold text-white mb-6">Education</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                            {data.education!.map(e => (
                                <div key={e.id} className="flex gap-4 rounded-xl bg-[#1c1c1f] p-5">
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

                <footer id="contact" className={`${panel} p-8 text-center`}>
                    <h2 className="text-2xl font-bold text-white">Contact Me</h2>
                    <div className="mt-5 flex flex-wrap justify-center gap-3">
                        {links.map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 rounded-lg bg-[#1c1c1f] px-4 py-2 text-sm hover:text-[color:var(--accent)]">
                                <Icon className="h-4 w-4" /> {label}
                            </a>
                        ))}
                    </div>
                    <p className="mt-8 text-xs text-[color:var(--accent)]">&quot;Thanks for scrolling&quot; · &copy; {new Date().getFullYear()} {data.name}</p>
                </footer>
            </div>
        </div>
    );
}
