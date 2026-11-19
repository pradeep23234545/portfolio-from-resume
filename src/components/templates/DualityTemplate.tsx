import { GraduationCap } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fitHeadline, fontClass, ProjectLinks, sections, skillGroups, type TemplateProps } from './kit';

/** Splits a title like "Designer & Developer" into two halves for the hero */
function halves(title: string): [string, string] {
    const parts = title.split(/\s*(?:&|\/|\||\band\b|,)\s*/i).filter(Boolean);
    if (parts.length >= 2) return [parts[0], parts.slice(1).join(' & ')];
    const words = title.split(/\s+/);
    if (words.length >= 2) return [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')];
    return [title, 'Builder'];
}

/** Light layout with a two-sided hero: one word on each side of a centred photo. */
export function DualityTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const [left, right] = halves(data.title);
    const groups = skillGroups(data);

    return (
        <div style={accentVars(theme)} className={`min-h-full bg-white text-slate-700 ${fontClass(font)}`}>
            <nav className="bg-slate-900 text-white">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <a href="#top" className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white font-bold">
                        {data.name.split(/\s+/).map(w => w[0]).slice(0, 2).join('')}
                    </a>
                    <div className="hidden md:flex gap-6 text-sm">
                        {sections(data).map(s => <a key={s.id} href={`#${s.id}`} className="hover:text-[color:var(--accent)]">{s.label.toLowerCase()}</a>)}
                    </div>
                    <div className="flex gap-3">
                        {links.slice(0, 4).map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} aria-label={label} className="hover:text-[color:var(--accent)]"><Icon className="h-4 w-4" /></a>
                        ))}
                    </div>
                </div>
            </nav>

            <header id="top" className="relative overflow-hidden bg-slate-50">
                <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 grid gap-8 md:grid-cols-[1fr_auto_1fr] items-center text-center md:text-left">
                    <div>
                        <h1 className={`${fitHeadline(left, 'text-4xl lg:text-6xl', 'text-2xl md:text-3xl lg:text-4xl', 14)} font-light text-slate-900 lowercase`}>{left}</h1>
                        <p className="mt-3 text-sm text-slate-500 max-w-xs md:ml-0 mx-auto">{data.name}{data.location ? ` · ${data.location}` : ''}</p>
                    </div>
                    <div className="relative mx-auto">
                        <div aria-hidden className="absolute -inset-4 rounded-full bg-gradient-to-r from-[color:var(--accent-soft)] via-transparent to-slate-900/10" />
                        <ProfilePhoto data={data} className="relative h-56 w-56 lg:h-72 lg:w-72 border-8 border-white shadow-xl"
                            fallbackClassName="bg-slate-900 text-white" />
                    </div>
                    <div className="md:text-right">
                        <h1 className={`${fitHeadline(right, 'text-4xl lg:text-6xl', 'text-2xl md:text-3xl lg:text-4xl', 14)} font-light text-slate-900 lowercase`}>
                            <span className="text-[color:var(--accent)]">&lt;</span>{right}<span className="text-[color:var(--accent)]">&gt;</span>
                        </h1>
                        <p className="mt-3 text-sm text-slate-500 max-w-xs md:ml-auto mx-auto">{data.title}</p>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6">
                {data.bio && (
                    <section id="about" className="py-20 grid gap-10 md:grid-cols-[1fr_2fr]">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">About me</h2>
                        <p className="text-xl leading-relaxed text-slate-700">{data.bio}</p>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section id="projects" className="py-16 border-t border-slate-200">
                        <h2 className="text-center text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 mb-10">Some of my latest work</h2>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {data.projects.map(p => (
                                <article key={p.id} className="rounded-lg bg-white p-6 shadow-[0_4px_24px_rgba(15,23,42,0.08)] hover:-translate-y-1 transition-transform">
                                    <div className="h-1.5 w-10 rounded-full bg-[color:var(--accent)] mb-5" />
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-semibold text-slate-900">{p.title}</h3>
                                        <ProjectLinks project={p} className="text-slate-400" />
                                    </div>
                                    <p className="mt-3 text-sm text-slate-500">{p.description}</p>
                                    <p className="mt-4 text-xs font-mono text-slate-400">{p.tags.join(', ')}</p>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {groups.length > 0 && (
                    <section id="skills" className="py-16 border-t border-slate-200 grid gap-10 md:grid-cols-[1fr_2fr]">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Skills</h2>
                        <div className="grid gap-8 sm:grid-cols-3">
                            {groups.map(g => (
                                <div key={g.label}>
                                    <h3 className="font-semibold text-slate-900 mb-3">{g.label}</h3>
                                    <ul className="space-y-1.5 text-sm text-slate-600">{g.items.map(s => <li key={s}>{s}</li>)}</ul>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience" className="py-16 border-t border-slate-200 grid gap-10 md:grid-cols-[1fr_2fr]">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Experience</h2>
                        <div className="space-y-10">
                            {data.experience.map(job => (
                                <div key={job.id}>
                                    <p className="text-xs text-slate-400">{job.period}</p>
                                    <h3 className="text-lg font-semibold text-slate-900">{job.role}, <span className="text-[color:var(--accent)]">{job.company}</span></h3>
                                    <p className="mt-2 text-slate-600">{job.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education" className="py-16 border-t border-slate-200 grid gap-10 md:grid-cols-[1fr_2fr]">
                        <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Education</h2>
                        <div className="space-y-6">
                            {data.education!.map(e => (
                                <div key={e.id} className="flex gap-4">
                                    <GraduationCap className="h-5 w-5 shrink-0 text-[color:var(--accent)] mt-1" />
                                    <div>
                                        <h3 className="font-semibold text-slate-900">{e.institution}</h3>
                                        <p className="text-sm text-slate-600">{[e.degree, e.field].filter(Boolean).join(', ')}</p>
                                        <p className="text-xs text-slate-400">{[e.period, e.grade].filter(Boolean).join(' · ')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <footer id="contact" className="mt-10 bg-slate-900 text-white">
                <div className="max-w-6xl mx-auto px-6 py-16 text-center">
                    <h2 className="text-3xl font-light">say <span className="text-[color:var(--accent)]">hello()</span></h2>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {links.map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm hover:bg-white hover:text-slate-900">
                                <Icon className="h-4 w-4" /> {label}
                            </a>
                        ))}
                    </div>
                    <p className="mt-10 text-xs text-white/40">&copy; {new Date().getFullYear()} {data.name}</p>
                </div>
            </footer>
        </div>
    );
}
