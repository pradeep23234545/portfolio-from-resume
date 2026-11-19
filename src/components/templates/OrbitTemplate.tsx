import { Code2, GraduationCap, Layers, Wrench } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fitHeadline, fontClass, firstName, ProjectLinks, sections, skillGroups, stats, type TemplateProps } from './kit';

const GROUP_ICONS = [Code2, Layers, Wrench];

/** Deep-navy layout with an accent ring around the photo and a stats row. */
export function OrbitTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const primary = links[0];
    const nums = stats(data);

    return (
        <div style={accentVars(theme)} className={`min-h-full bg-[#0f1729] text-slate-300 ${fontClass(font)}`}>
            <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
                <a href="#top" className="font-bold text-white">{data.name}</a>
                <div className="hidden md:flex gap-6 text-sm">
                    {sections(data).map(s => <a key={s.id} href={`#${s.id}`} className="hover:text-white">{s.label}</a>)}
                </div>
            </nav>

            <header id="top" className="max-w-6xl mx-auto px-6 py-14 md:py-20 grid gap-14 md:grid-cols-2 items-center">
                <div>
                    <p className="text-2xl text-white">Hello<span className="text-[color:var(--accent)]">.</span></p>
                    <p className="mt-2 flex items-center gap-3 text-2xl text-white">
                        <span className="h-px w-10 bg-[color:var(--accent)]" /> I&apos;m {firstName(data.name)}
                    </p>
                    <h1 className={`mt-3 ${fitHeadline(data.title, 'text-4xl lg:text-6xl', 'text-3xl md:text-4xl lg:text-5xl', 26)} font-extrabold text-white leading-tight`}>{data.title}</h1>
                    <div className="mt-8 flex flex-wrap gap-3">
                        {primary && (
                            <a {...linkProps(primary.href)} className="rounded-sm bg-[color:var(--accent)] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                                {primary.key === 'email' ? 'Got a project?' : primary.label}
                            </a>
                        )}
                        <a href="#about" className="rounded-sm border border-white/30 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10">About me</a>
                    </div>
                </div>
                <div className="relative mx-auto h-72 w-72 lg:h-96 lg:w-96">
                    <div aria-hidden className="absolute inset-0 rounded-full border-[14px] border-[color:var(--accent)] opacity-90" />
                    <div aria-hidden className="absolute -inset-6 rounded-full border border-[color:var(--accent)] opacity-30" />
                    <div aria-hidden className="absolute inset-0 rounded-full bg-[color:var(--accent)] opacity-20 blur-3xl" />
                    <ProfilePhoto data={data} className="absolute inset-6 h-auto w-auto" fallbackClassName="bg-[#1b2742] text-white" />
                </div>
            </header>

            {skillGroups(data).length > 0 && (
                <div id="skills" className="border-y border-white/5 bg-white/[0.02] py-5 overflow-hidden">
                    <p className="max-w-6xl mx-auto px-6 flex flex-wrap gap-x-8 gap-y-2 text-sm font-semibold uppercase tracking-wider text-slate-500">
                        {skillGroups(data).flatMap(g => g.items).slice(0, 14).map(s => <span key={s}>{s}</span>)}
                    </p>
                </div>
            )}

            <main className="max-w-6xl mx-auto px-6 py-20 space-y-24">
                <section id="about" className="grid gap-12 md:grid-cols-2">
                    <div className="space-y-4">
                        {skillGroups(data).map((g, i) => {
                            const Icon = GROUP_ICONS[i % GROUP_ICONS.length];
                            return (
                                <div key={g.label} className="flex items-start gap-4 rounded-lg border border-white/10 p-5">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[color:var(--accent)] text-[color:var(--accent)]"><Icon className="h-5 w-5" /></div>
                                    <div>
                                        <h3 className="font-semibold text-white">{g.label}</h3>
                                        <p className="text-sm text-slate-400">{g.items.join(', ')}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-white mb-4">About me</h2>
                        <p className="leading-relaxed">{data.bio}</p>
                        {nums.length > 0 && (
                            <div className="mt-8 grid grid-cols-3 gap-4">
                                {nums.map(s => (
                                    <div key={s.label}>
                                        <div className="text-4xl font-extrabold text-white">{s.value}<span className="text-[color:var(--accent)]">+</span></div>
                                        <div className="text-sm text-slate-400">{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {data.projects.length > 0 && (
                    <section id="projects">
                        <h2 className="text-center text-3xl font-bold text-white mb-10">Projects</h2>
                        <div className="grid gap-6 md:grid-cols-3">
                            {data.projects.map(p => (
                                <article key={p.id} className="rounded-lg bg-[#16213a] p-6 border-t-4 border-[color:var(--accent)]">
                                    <div className="flex items-start justify-between gap-3">
                                        <h3 className="font-semibold text-white">{p.title}</h3>
                                        <ProjectLinks project={p} className="text-slate-400" />
                                    </div>
                                    <p className="mt-3 text-sm text-slate-400">{p.description}</p>
                                    <div className="mt-4 flex flex-wrap gap-1.5">
                                        {p.tags.map(t => <span key={t} className="rounded-sm bg-white/5 px-2 py-0.5 text-xs">{t}</span>)}
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience">
                        <h2 className="text-center text-3xl font-bold text-white mb-10">Experience</h2>
                        <div className="relative mx-auto max-w-3xl border-l border-white/10 pl-8 space-y-10">
                            {data.experience.map(job => (
                                <div key={job.id} className="relative">
                                    <span className="absolute -left-[41px] top-1 h-4 w-4 rounded-full border-4 border-[#0f1729] bg-[color:var(--accent)]" />
                                    <p className="text-xs text-[color:var(--accent)]">{job.period}</p>
                                    <h3 className="text-lg font-semibold text-white">{job.role} · {job.company}</h3>
                                    <p className="mt-2 text-sm text-slate-400">{job.description}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education">
                        <h2 className="text-center text-3xl font-bold text-white mb-10">Education</h2>
                        <div className="grid gap-6 md:grid-cols-2">
                            {data.education!.map(e => (
                                <div key={e.id} className="flex gap-4 rounded-lg bg-[#16213a] p-6">
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

            <footer id="contact" className="border-t border-white/10 py-14 text-center">
                <h2 className="text-2xl font-bold text-white">Get in touch</h2>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {links.map(({ key, label, href, icon: Icon }) => (
                        <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 rounded-sm border border-white/15 px-4 py-2 text-sm hover:border-[color:var(--accent)] hover:text-white">
                            <Icon className="h-4 w-4" /> {label}
                        </a>
                    ))}
                </div>
                <p className="mt-10 text-xs text-slate-500">&copy; {new Date().getFullYear()} {data.name}</p>
            </footer>
        </div>
    );
}
