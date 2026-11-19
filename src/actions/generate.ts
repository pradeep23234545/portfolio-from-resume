'use server';

import { cookies } from 'next/headers';
import { verifyJWT } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/service';
import { generatePortfolioForUser, type GenerateResult } from '@/lib/generators/generate-for-user';
import { resetPortfolioContent, isDataSource, ALL_SOURCES, SOURCE_LABELS, type DataSource } from '@/lib/portfolio/sources';
import { applyResumeData } from '@/actions/resume';
import { syncGithubRepositories } from '@/actions/github';
import { isLayoutId, LAYOUTS } from '@/lib/portfolio/layouts';
import { notify } from '@/lib/notifications';

/**
 * Builds a fresh portfolio from the chosen sources only: previous content is
 * cleared, then the selected imports are applied again. Sources that are not
 * connected are ignored, so a user with just a resume (or just GitHub) can
 * generate from that alone.
 */
export async function generateMyPortfolio(requested?: string[], layout?: string): Promise<GenerateResult> {
    const token = (await cookies()).get('auth-token')?.value;
    const payload = token ? await verifyJWT(token) : null;
    if (!payload?.sub) return { success: false, error: 'Please sign in again.' };
    const userId = payload.sub as string;

    const supabase = createServiceClient() as any;
    const [{ data: user }, { data: sourceRows }, { data: portfolio }] = await Promise.all([
        supabase.from('users').select('github_username').eq('id', userId).maybeSingle(),
        supabase.from('data_sources').select('source_type').eq('user_id', userId),
        supabase.from('portfolios').select('id').eq('user_id', userId).maybeSingle(),
    ]);
    const connected = new Set<DataSource>((sourceRows || []).map((r: any) => r.source_type).filter(isDataSource));
    if (user?.github_username) connected.add('github');

    // No explicit choice = every connected source
    const wanted = requested ? requested.filter(isDataSource) : [...connected];
    const selected = wanted.filter(s => connected.has(s));
    if (!selected.length) {
        return {
            success: false,
            error: connected.size
                ? 'Select at least one data source to build from.'
                : 'There is no data to build from yet. Connect GitHub or upload your resume or LinkedIn PDF on the Connect page first.',
        };
    }

    const warnings: string[] = [];
    try {
        // Every generation starts from an empty portfolio
        if (portfolio) await resetPortfolioContent(supabase, userId, portfolio.id);
    } catch (error) {
        return { success: false, error: error instanceof Error ? error.message : 'Could not prepare your sources.' };
    }

    // Re-import only the selected sources (GitHub first so PDF projects merge into their repos)
    for (const source of ALL_SOURCES.filter(s => selected.includes(s))) {
        const res = source === 'github' ? await syncGithubRepositories() : await applyResumeData(source);
        if ('error' in res && res.error) warnings.push(`${SOURCE_LABELS[source]}: ${res.error}`);
    }

    const result = await generatePortfolioForUser(userId, selected);
    if (result.success) {
        result.warnings.unshift(...warnings);
        if (isLayoutId(layout)) {
            const { error } = await supabase.from('portfolios').update({ template_id: layout }).eq('user_id', userId);
            if (error) result.warnings.push(`Could not save the layout: ${error.message}`);
        }
        const layoutName = LAYOUTS.find(l => l.id === layout)?.name;
        await notify(supabase, userId, {
            kind: 'generate',
            title: 'Portfolio generated',
            body: `Built from ${selected.map(s => SOURCE_LABELS[s]).join(' + ')}: ${result.stats.projects} projects, `
                + `${result.stats.experiences} experiences, ${result.stats.skills} skills${layoutName ? ` · ${layoutName} layout` : ''}.`,
            href: '/preview',
        });
    }
    return result;
}
