'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { verifyJWT } from '@/lib/auth';
import { cookies } from 'next/headers';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    if (!token) return null;
    const payload = await verifyJWT(token);
    return payload?.sub as string | undefined;
}

const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

/**
 * Turns the loose dates the AI returns ("2023", "2023-06", "Jun 2023", "Present")
 * into a Postgres DATE string (YYYY-MM-DD), or null when it can't be read.
 */
function toDate(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    if (!v || /present|current|now|ongoing/.test(v)) return null;

    let m = v.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${(m[3] || '1').padStart(2, '0')}`;

    m = v.match(/^(\d{1,2})[/.-](\d{4})$/);
    if (m) return `${m[2]}-${m[1].padStart(2, '0')}-01`;

    m = v.match(/([a-z]{3})[a-z]*\.?,?\s+(\d{4})/);
    if (m && MONTHS[m[1]]) return `${m[2]}-${MONTHS[m[1]]}-01`;

    m = v.match(/\b(19|20)\d{2}\b/);
    if (m) return `${m[0]}-01-01`;

    return null;
}

function slugify(text: string) {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60) || 'project';
}

const same = (a?: string | null, b?: string | null) =>
    (a || '').trim().toLowerCase() === (b || '').trim().toLowerCase();

/**
 * Copies parsed resume/LinkedIn data into the user's portfolio tables.
 * Entries that already exist (same company+role, institution+degree, project title
 * or skill name) are skipped, so uploading both sources or re-uploading is safe.
 */
export async function applyResumeData(sourceType: 'resume' | 'linkedin' = 'resume') {
    const userId = await getUserId();
    if (!userId) return { error: 'Not authenticated' };

    const supabase = createServiceClient() as any;

    // 1. Fetch the stored upload
    const { data: dataSource } = await supabase
        .from('data_sources')
        .select('source_data')
        .eq('user_id', userId)
        .eq('source_type', sourceType)
        .maybeSingle();

    if (!dataSource?.source_data) {
        return { error: `No ${sourceType} data found to apply` };
    }
    const data = dataSource.source_data;

    // 2. Get or create the portfolio
    let { data: portfolio } = await supabase.from('portfolios').select('id').eq('user_id', userId).maybeSingle();
    if (!portfolio) {
        const { data: user } = await supabase.from('users').select('email').eq('id', userId).single();
        const base = slugify(user?.email?.split('@')[0] || `user-${userId.slice(0, 8)}`);
        for (const subdomain of [base, `${base}-${Math.floor(Math.random() * 10000)}`]) {
            const { data: created, error } = await supabase
                .from('portfolios')
                .insert({ user_id: userId, subdomain, template_id: 'modern' })
                .select('id')
                .maybeSingle();
            if (!error) { portfolio = created; break; }
            if (error.code !== '23505') return { error: `Failed to create portfolio: ${error.message}` };
        }
    }
    if (!portfolio) return { error: 'Failed to create portfolio' };
    const portfolioId = portfolio.id;

    // Existing rows, used to skip duplicates
    const [{ data: exExp }, { data: exEdu }, { data: exSkills }, { data: exProj }] = await Promise.all([
        supabase.from('experiences').select('company, role').eq('portfolio_id', portfolioId),
        supabase.from('education').select('institution, degree').eq('portfolio_id', portfolioId),
        supabase.from('skills').select('skill_name').eq('portfolio_id', portfolioId),
        supabase.from('projects').select('title').eq('portfolio_id', portfolioId),
    ]);
    const existing = {
        experiences: (exExp || []) as { company: string; role: string }[],
        education: (exEdu || []) as { institution: string; degree: string }[],
        skills: (exSkills || []) as { skill_name: string }[],
        projects: (exProj || []) as { title: string }[],
    };

    const results = { experiences: 0, education: 0, skills: 0, projects: 0 };
    const errors: string[] = [];
    const list = (v: unknown) => (Array.isArray(v) ? v : []);

    // 3. Experiences
    for (const exp of list(data.experiences)) {
        if (!exp?.company || !exp?.role) continue;
        if (existing.experiences.some(e => same(e.company, exp.company) && same(e.role, exp.role))) continue;
        const isCurrent = !!exp.is_current || /present|current/i.test(String(exp.end_date || ''));
        const { error } = await supabase.from('experiences').insert({
            portfolio_id: portfolioId,
            company: exp.company,
            role: exp.role,
            location: exp.location || null,
            description: exp.description || null,
            // start_date is required; fall back to today when the PDF has none
            start_date: toDate(exp.start_date) || new Date().toISOString().slice(0, 10),
            end_date: isCurrent ? null : toDate(exp.end_date),
            is_current: isCurrent,
            is_visible: true,
        });
        if (error) errors.push(`Experience "${exp.role} at ${exp.company}": ${error.message}`);
        else { results.experiences++; existing.experiences.push(exp); }
    }

    // 4. Education
    for (const edu of list(data.education)) {
        if (!edu?.institution) continue;
        const degree = edu.degree || edu.field_of_study || 'Studies';
        if (existing.education.some(e => same(e.institution, edu.institution) && same(e.degree, degree))) continue;
        const { error } = await supabase.from('education').insert({
            portfolio_id: portfolioId,
            institution: edu.institution,
            degree,
            field_of_study: edu.field_of_study || null,
            grade: edu.grade || null,
            start_date: toDate(edu.start_date),
            end_date: toDate(edu.end_date),
            is_visible: true,
        });
        if (error) errors.push(`Education "${edu.institution}": ${error.message}`);
        else { results.education++; existing.education.push({ institution: edu.institution, degree }); }
    }

    // 5. Skills
    for (const raw of list(data.skills)) {
        const skill = typeof raw === 'string' ? raw.trim() : '';
        if (!skill || existing.skills.some(s => same(s.skill_name, skill))) continue;
        const { error } = await supabase.from('skills').insert({
            portfolio_id: portfolioId,
            skill_name: skill,
            category: 'Tools', // shows up in the default templates
            display_order: 99,
        });
        if (error) errors.push(`Skill "${skill}": ${error.message}`);
        else { results.skills++; existing.skills.push({ skill_name: skill }); }
    }

    // 6. Projects
    for (const proj of list(data.projects)) {
        if (!proj?.title || existing.projects.some(p => same(p.title, proj.title))) continue;
        const { error } = await supabase.from('projects').insert({
            portfolio_id: portfolioId,
            title: proj.title,
            slug: `${slugify(proj.title)}-${Math.random().toString(36).slice(2, 7)}`,
            short_description: proj.description || null,
            technologies: list(proj.technologies),
            source: sourceType,
            is_visible: true,
        });
        if (error) errors.push(`Project "${proj.title}": ${error.message}`);
        else { results.projects++; existing.projects.push({ title: proj.title }); }
    }

    // 7. Profile: fill the LinkedIn URL from the PDF if the user has none yet
    const linkedin = typeof data.contact?.linkedin === 'string' ? data.contact.linkedin.trim() : '';
    if (/linkedin\.com\/in\//i.test(linkedin)) {
        const url = /^https?:\/\//i.test(linkedin) ? linkedin : `https://${linkedin.replace(/^\/+/, '')}`;
        await supabase.from('users').update({ linkedin_url: url }).eq('id', userId).is('linkedin_url', null);
    }

    if (errors.length) console.error(`applyResumeData(${sourceType}) errors:`, errors);

    return {
        success: true,
        results,
        // Surface the first few problems instead of failing silently
        warnings: errors.slice(0, 3),
    };
}
