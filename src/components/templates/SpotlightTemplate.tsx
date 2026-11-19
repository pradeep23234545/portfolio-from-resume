import { ArrowDown, ArrowRight, GraduationCap, MapPin } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fitHeadline, fontClass, firstName, ProjectLinks, sections, skillGroups, stats, type TemplateProps } from './kit';

/** Dark charcoal layout: big hero headline, centred photo and a side column of short blurbs. */
export function SpotlightTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const first = firstName(data.name);
    const nums = stats(data);
    const latest = data.experience[0];

    return (
        <div style={accentVars(theme)} className={`min-h-full bg-[#1f2124] text-slate-200 ${fontClass(font)}`}>
            <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
                <a href="#top" className="flex items-center gap-2 font-bold text-white">
                    <span className="text-[color:var(--accent)]">&lt;/&gt;</span> {data.name}
                </a>
                <div className="hidden md:flex gap-6 text-sm text-slate-400">
                    {sections(data).map(s => <a key={s.id} href={`#${s.id}`} className="hover:text-white">{s.label}</a>)}
                </div>
            </nav>

            {/* Hero */}
            <header id="top" className="max-w-6xl mx-auto px-6 pt-6 pb-16 grid gap-10 md:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.9fr] items-center">
                <div className="space-y-6">
                    <div className="h-1 w-14 bg-white" />
                    <h1 className={`${fitHeadline(data.title, 'text-4xl lg:text-6xl', 'text-3xl md:text-4xl lg:text-5xl', 22)} font-bold leading-tight text-white`}>
                        I&apos;m {first},<br />a {data.title}
                    </h1>
                    {data.location && (
                        <p className="flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4" /> {data.location}</p>
                    )}
                    <a href="#about" aria-label="Scroll to about"
                        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--accent)] text-white shadow-lg hover:scale-105 transition-transform">
                        <ArrowDown className="h-6 w-6" />
                    </a>
                </div>
                <div className="flex justify-center">
                    <ProfilePhoto data={data} shape="rounded-[2rem]" className="h-56 w-56 sm:h-64 sm:w-64 lg:h-80 lg:w-80 grayscale-[20%] shadow-2xl"
                        fallbackClassName="bg-[color:var(--accent)] text-white" />
                </div>
                <aside className="space-y-8 text-sm md:col-span-2 md:grid md:grid-cols-3 md:gap-8 md:space-y-0 lg:col-span-1 lg:block lg:space-y-8">
                    {data.bio && (
                        <div>
                            <h2 className="text-xs font-bold tracking-widest text-white mb-2">ABOUT ME</h2>
                            <p className="text-slate-400 line-clamp-4">{data.bio}</p>
                            <a href="#about" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white border-b border-white/40">LEARN MORE <ArrowRight className="h-3 w-3" /></a>
                        </div>
                    )}
                    {latest && (
                        <div className="border-t border-white/10 pt-6 md:border-t-0 md:pt-0 lg:border-t lg:pt-6">
                            <h2 className="text-xs font-bold tracking-widest text-white mb-2">MY WORK</h2>
                            <p className="text-slate-400">{latest.role} at {latest.company}{data.projects.length ? ` · ${data.projects.length} projects` : ''}</p>
                            <a href="#projects" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white border-b border-white/40">BROWSE PORTFOLIO <ArrowRight className="h-3 w-3" /></a>
                        </div>
                    )}
                    {links.length > 0 && (
                        <div className="border-t border-white/10 pt-6 md:border-t-0 md:pt-0 lg:border-t lg:pt-6">
                            <h2 className="text-xs font-bold tracking-widest text-white mb-3">FOLLOW ME</h2>
                            <div className="flex gap-4">
                                {links.map(({ key, label, href, icon: Icon }) => (
                                    <a key={key} {...linkProps(href)} aria-label={label} className="text-slate-300 hover:text-[color:var(--accent)]"><Icon className="h-4 w-4" /></a>
                                ))}
                            </div>
                        </div>
                    )}
                </aside>
            </header>

            <main className="bg-[#2a2d31]">
                {/* About + stats */}
                <section id="about" className="max-w-6xl mx-auto px-6 py-20 grid gap-12 md:grid-cols-2">
                    <div>
                        <p className="text-xs font-bold tracking-widest text-[color:var(--accent)] mb-3">/ ABOUT ME</p>
                        <h2 className="text-3xl font-bold text-white mb-5">{data.title}</h2>
                        <p className="text-slate-400 leading-relaxed">{data.bio}</p>
                    </div>
                    {nums.length > 0 && (
                        <div className="grid grid-cols-3 gap-6 self-center">
                            {nums.map(s => (
                                <div key={s.label}>
                                    <div className="text-5xl font-bold text-white">{s.value}</div>
                                    <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {skillGroups(data).length > 0 && (
                    <section id="skills" className="max-w-6xl mx-auto px-6 pb-20">
                        <p className="text-xs font-bold tracking-widest text-[color:var(--accent)] mb-6">/ SKILLS</p>
                        <div className="grid gap-6 md:grid-cols-3">
                            {skillGroups(data).map(g => (
                                <div key={g.label} className="rounded-2xl bg-[#1f2124] p-6">
                                    <h3 className="font-semibold text-white mb-4">{g.label}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {g.items.map(s => <span key={s} className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{s}</span>)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section id="projects" className="max-w-6xl mx-auto px-6 pb-20">
                        <p className="text-xs font-bold tracking-widest text-[color:var(--accent)] mb-6">/ PORTFOLIO</p>
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.projects.map((p, i) => (
                                <article key={p.id} className="group rounded-2xl bg-[#1f2124] p-7 border border-transparent hover:border-[color:var(--accent)] transition-colors">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div>
                                            <span className="text-xs text-slate-500">{String(i + 1).padStart(2, '0')}</span>
                                            <h3 className="text-xl font-semibold text-white">{p.title}</h3>
                                        </div>
                                        <ProjectLinks project={p} className="text-slate-400" />
                                    </div>
                                    <p className="text-slate-400 text-sm mb-4">{p.description}</p>
                                    <div className="flex flex-wrap gap-2">
                                        {p.tags.map(t => <span key={t} className="text-xs text-[color:var(--accent)]">#{t}</span>)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience" className="max-w-6xl mx-auto px-6 pb-20">
                        <p className="text-xs font-bold tracking-widest text-[color:var(--accent)] mb-6">/ EXPERIENCE</p>
                        <div className="divide-y divide-white/10">
                            {data.experience.map(job => (
                                <div key={job.id} className="py-6 grid gap-2 md:grid-cols-[200px_1fr]">
                                    <span className="text-sm text-slate-500">{job.period}</span>
                                    <div>
                                        <h3 className="text-lg font-semibold text-white">{job.role} <span className="text-[color:var(--accent)]">@ {job.company}</span></h3>
                                        <p className="text-slate-400 text-sm mt-2">{job.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education" className="max-w-6xl mx-auto px-6 pb-20">
                        <p className="text-xs font-bold tracking-widest text-[color:var(--accent)] mb-6">/ EDUCATION</p>
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.education!.map(e => (
                                <div key={e.id} className="flex gap-4 rounded-2xl bg-[#1f2124] p-6">
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
            </main>

            <footer id="contact" className="max-w-6xl mx-auto px-6 py-20 text-center">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Let&apos;s work together</h2>
                <div className="flex flex-wrap justify-center gap-3">
                    {links.map(({ key, label, href, icon: Icon }) => (
                        <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm hover:bg-[color:var(--accent)] hover:border-transparent hover:text-white transition-colors">
                            <Icon className="h-4 w-4" /> {label}
                        </a>
                    ))}
                </div>
                <p className="mt-12 text-xs text-slate-500">&copy; {new Date().getFullYear()} {data.name}</p>
            </footer>
        </div>
    );
}
