/**
 * Checks your Gemini API key: lists the text models it can use and tests the
 * two models the app uses by default.
 *
 *   node scripts/list-models.js
 */
require('dotenv').config({ path: '.env.local', quiet: true });

const key = process.env.GEMINI_API_KEY;
const API = 'https://generativelanguage.googleapis.com/v1beta/models';
const APP_MODELS = [
    process.env.GEMINI_FAST_MODEL || 'gemini-flash-lite-latest',
    process.env.GEMINI_MODEL || 'gemini-flash-latest',
];

async function main() {
    if (!key || /your-|your_/.test(key)) {
        console.error('GEMINI_API_KEY is not set in .env.local');
        process.exit(1);
    }
    const headers = { 'x-goog-api-key': key, 'Content-Type': 'application/json' };

    const list = await (await fetch(`${API}?pageSize=200`, { headers })).json();
    if (list.error) {
        console.error('API key problem:', list.error.message);
        process.exit(1);
    }
    const names = list.models
        .filter(m => (m.supportedGenerationMethods || []).includes('generateContent') && /gemini/.test(m.name))
        .map(m => m.name.replace('models/', ''));
    console.log(`Text models available to this key (${names.length}):\n  ${names.join('\n  ')}\n`);

    console.log('Testing the models the app uses:');
    for (const model of APP_MODELS) {
        const started = Date.now();
        const res = await fetch(`${API}/${model}:generateContent`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply with OK' }] }] }),
            signal: AbortSignal.timeout(60000),
        }).catch(e => ({ ok: false, status: e.name }));
        const json = res.json ? await res.json() : {};
        const status = res.ok ? 'OK' : `FAILED (${res.status}) ${json.error?.message?.slice(0, 80) || ''}`;
        console.log(`  ${model.padEnd(28)} ${status}  ${Date.now() - started}ms`);
    }
}

main();
