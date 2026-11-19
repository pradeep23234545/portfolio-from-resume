import { readFile } from 'fs/promises';
import { createRequire } from 'module';
import path from 'path';
import { createElement } from 'react';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { PortfolioLayout } from '@/components/templates/registry';
import type { LoadedPortfolio } from '@/lib/portfolio/load';
import type { PortfolioData } from '@/lib/data/mockData';
// eslint-disable-next-line @typescript-eslint/no-require-imports -- the Tailwind config is CommonJS
const tailwindConfig = require('../../../tailwind.config.js');

/**
 * Next.js forbids importing react-dom/server in server code, so it is loaded with
 * Node's own require at request time. The layouts are plain components (no hooks),
 * so rendering them with this copy of React is safe.
 */
function renderToStaticMarkup(element: React.ReactElement): string {
    const nodeRequire = createRequire(path.join(process.cwd(), 'package.json'));
    const server = nodeRequire('react-dom/server') as { renderToStaticMarkup: (el: React.ReactElement) => string };
    return server.renderToStaticMarkup(element);
}

const escapeHtml = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Downloads a remote photo and returns it as a data: URI so the site has no outside dependency */
async function inlineImage(url: string): Promise<string> {
    if (!url || url.startsWith('data:')) return url;
    try {
        const res = await fetch(url);
        if (!res.ok) return '';
        const type = res.headers.get('content-type') || 'image/jpeg';
        if (!type.startsWith('image/')) return '';
        const bytes = Buffer.from(await res.arrayBuffer());
        if (bytes.length > 3 * 1024 * 1024) return url; // too big to inline; keep the link
        return `data:${type};base64,${bytes.toString('base64')}`;
    } catch {
        return '';
    }
}

/** Only the CSS this page uses: Tailwind is run over the rendered HTML itself */
async function buildCss(html: string) {
    const globals = await readFile(path.join(process.cwd(), 'src/app/globals.css'), 'utf8');
    const result = await postcss([
        tailwindcss({ ...tailwindConfig, content: [{ raw: html, extension: 'html' }] }),
        autoprefixer,
    ]).process(globals, { from: undefined });
    return result.css;
}

/**
 * Turns a portfolio into one self-contained index.html: markup, CSS and photo
 * inlined; no scripts, no tracking and no link back to this application.
 */
export async function exportPortfolioHtml(portfolio: LoadedPortfolio, data: PortfolioData): Promise<string> {
    const exportData: PortfolioData = { ...data, avatarUrl: data.avatarUrl ? await inlineImage(data.avatarUrl) : '' };

    const body = renderToStaticMarkup(
        createElement(PortfolioLayout, { template: portfolio.template, data: exportData, theme: portfolio.theme, font: portfolio.font })
    );
    const css = await buildCss(body);

    const title = escapeHtml(portfolio.seoTitle || `${data.name} — Portfolio`);
    const description = escapeHtml(portfolio.seoDescription || data.bio.slice(0, 160));

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${description}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
:root{--font-inter:'Inter';--font-jetbrains-mono:'JetBrains Mono'}
${css}
</style>
</head>
<body class="font-sans antialiased">
${body}
</body>
</html>
`;
}
