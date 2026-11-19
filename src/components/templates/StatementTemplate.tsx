import { GraduationCap } from 'lucide-react';
import { ProfilePhoto, contactLinks, linkProps } from './shared';
import { accentVars, fitHeadline, fontClass, ProjectLinks, sections, skillGroups, type TemplateProps } from './kit';

/** Bold layout whose hero is one big sentence: "I'm Name. A Title based in City." */
export function StatementTemplate({ data, theme, font }: TemplateProps) {
    const links = contactLinks(data);
    const nav = sections(data).filter(s => s.id !== 'contact').slice(0, 3);
    const city = data.location.split(',')[0]?.trim();
    const article = /^[aeiou]/i.test(data.title) ? 'An' : 'A';
    // Number the sections that actually appear: 01, 02, ...
    const order = [
        data.bio && 'about',
        data.experience.length && 'experience',
        data.projects.length && 'projects',
        skillGroups(data).length && 'skills',
        (data.education || []).length && 'education',
    ].filter(Boolean) as string[];
    const num = (id: string) => String(order.indexOf(id) + 1).padStart(2, '0');

    return (
        <div style={accentVars(theme)} className={`min-h-full bg-[#14131c] text-slate-300 ${fontClass(font)}`}>
            <nav className="flex items-stretch justify-between">
                <a href="#top" className="bg-black px-6 md:px-10 py-6 text-xl font-black text-white">
                    {data.name.split(/\s+/)[0]}.{data.name.split(/\s+/)[1]?.[0] || ''}
                </a>
                <div className="flex items-stretch text-sm">
                    {nav.map(s => <a key={s.id} href={`#${s.id}`} className="hidden md:flex items-center px-5 hover:text-white">{s.label}</a>)}
                    <a href="#contact" className="flex items-center bg-[color:var(--accent)] px-6 font-semibold text-white">Contact</a>
                </div>
            </nav>

            <header id="top" className="grid lg:grid-cols-[2fr_3fr]">
                <div className="relative min-h-[280px] bg-black/60 flex items-center justify-center p-8 lg:p-10">
                    <ProfilePhoto data={data} shape="rounded-none" className="h-64 w-64 lg:h-80 lg:w-80 grayscale" fallbackClassName="bg-[color:var(--accent)] text-white" />
                </div>
                <div className="px-6 md:px-14 py-16 md:py-24 flex flex-col justify-center">
                    <h1 className={`${fitHeadline(data.name + data.title, 'text-4xl lg:text-6xl', 'text-3xl md:text-4xl lg:text-5xl', 40)} font-extrabold leading-[1.1] text-white`}>
                        I&apos;m {data.name}.<br />
                        {article} {data.title}
                        {city && <span className="block text-slate-500">based in {city}.</span>}
                    </h1>
                    {data.bio && <p className="mt-8 max-w-xl text-lg text-slate-400 line-clamp-3">{data.bio}</p>}
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 md:px-10 py-20 space-y-24">
                {data.bio && (
                    <section id="about" className="grid gap-6 md:grid-cols-[120px_1fr]">
                        <span className="text-5xl font-black text-[color:var(--accent)]">{num('about')}</span>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-4">About</h2>
                            <p className="text-lg leading-relaxed">{data.bio}</p>
                        </div>
                    </section>
                )}

                {data.experience.length > 0 && (
                    <section id="experience" className="grid gap-6 md:grid-cols-[120px_1fr]">
                        <span className="text-5xl font-black text-[color:var(--accent)]">{num('experience')}</span>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Experience</h2>
                            <div className="space-y-8">
                                {data.experience.map(job => (
                                    <div key={job.id} className="border-l-4 border-[color:var(--accent)] pl-6">
                                        <h3 className="text-xl font-bold text-white">{job.role}</h3>
                                        <p className="text-sm text-slate-400">{job.company} · {job.period}</p>
                                        <p className="mt-3">{job.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {data.projects.length > 0 && (
                    <section id="projects" className="grid gap-6 md:grid-cols-[120px_1fr]">
                        <span className="text-5xl font-black text-[color:var(--accent)]">{num('projects')}</span>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Work</h2>
                            <div className="divide-y divide-white/10 border-y border-white/10">
                                {data.projects.map(p => (
                                    <article key={p.id} className="group py-6 flex flex-col md:flex-row md:items-center gap-3 md:gap-8">
                                        <h3 className="text-2xl md:text-3xl font-extrabold text-white group-hover:text-[color:var(--accent)] transition-colors md:w-1/3">{p.title}</h3>
                                        <p className="flex-1 text-sm">{p.description}</p>
                                        <ProjectLinks project={p} className="text-slate-400" />
                                    </article>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                {skillGroups(data).length > 0 && (
                    <section id="skills" className="grid gap-6 md:grid-cols-[120px_1fr]">
                        <span className="text-5xl font-black text-[color:var(--accent)]">{num('skills')}</span>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Toolbox</h2>
                            <p className="text-2xl md:text-3xl font-bold leading-snug text-slate-500">
                                {skillGroups(data).flatMap(g => g.items).map((s, i) => (
                                    <span key={s}>{i > 0 && ' / '}<span className="text-white hover:text-[color:var(--accent)]">{s}</span></span>
                                ))}
                            </p>
                        </div>
                    </section>
                )}

                {(data.education || []).length > 0 && (
                    <section id="education" className="grid gap-6 md:grid-cols-[120px_1fr]">
                        <span className="text-5xl font-black text-[color:var(--accent)]">{num('education')}</span>
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-6">Education</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                {data.education!.map(e => (
                                    <div key={e.id} className="flex gap-4">
                                        <GraduationCap className="h-6 w-6 shrink-0 text-[color:var(--accent)]" />
                                        <div>
                                            <h3 className="font-bold text-white">{e.institution}</h3>
                                            <p className="text-sm">{[e.degree, e.field].filter(Boolean).join(', ')}</p>
                                            <p className="text-xs text-slate-500">{[e.period, e.grade].filter(Boolean).join(' · ')}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </main>

            <footer id="contact" className="bg-[color:var(--accent)] text-white">
                <div className="max-w-6xl mx-auto px-6 md:px-10 py-16 md:flex md:items-end md:justify-between gap-8">
                    <h2 className="text-4xl md:text-6xl font-extrabold leading-none">Let&apos;s talk.</h2>
                    <div className="mt-8 md:mt-0 flex flex-wrap gap-4">
                        {links.map(({ key, label, href, icon: Icon }) => (
                            <a key={key} {...linkProps(href)} className="inline-flex items-center gap-2 font-semibold underline-offset-4 hover:underline">
                                <Icon className="h-4 w-4" /> {label}
                            </a>
                        ))}
                    </div>
                </div>
                <p className="pb-8 text-center text-xs text-white/70">&copy; {new Date().getFullYear()} {data.name}</p>
            </footer>
        </div>
    );
}
