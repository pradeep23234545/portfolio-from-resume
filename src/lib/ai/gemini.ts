import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/** Throws a readable error when the Gemini key is missing or still the .env.example placeholder. */
export function assertGeminiConfigured() {
    const key = process.env.GEMINI_API_KEY;
    if (!key || /your-|your_/i.test(key)) {
        throw new Error('GEMINI_API_KEY is not set. Get a free key at https://aistudio.google.com/app/apikey, add it to .env.local and restart the dev server.');
    }
}

const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// Google retires model versions regularly. The "-latest" aliases always point at a
// current model; the rest are fallbacks tried when a model is retired, busy or too slow.
const FALLBACK_MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];

const isModelGone = (error: any) =>
    error?.status === 404 || /404|not found|no longer available/i.test(error?.message || '');
const isBusy = (error: any) =>
    error?.status === 429 || error?.status === 503 || /\b(429|503)\b/.test(error?.message || '');

const isTimeout = (error: any) =>
    error?.name === 'AbortError' || error?.name === 'TimeoutError' || /abort|timed? ?out/i.test(error?.message || '');

const REQUEST_TIMEOUT_MS = 60_000;

/** The model that answered last time, so later calls skip retired ones. */
const workingModel: Record<string, string> = {};

const createRetryingModel = (preferred: string, config: any) => {
    const candidates = [...new Set([preferred, ...FALLBACK_MODELS])];

    return {
        generateContent: async (prompt: any) => {
            const order = workingModel[preferred]
                ? [workingModel[preferred], ...candidates.filter(m => m !== workingModel[preferred])]
                : candidates;
            let lastError: any;

            // Two passes over the models: a busy, slow or retired model is skipped
            // immediately; if every model was busy, wait briefly and go round once more.
            for (let pass = 1; pass <= 2; pass++) {
                for (const modelName of order) {
                    // Without a timeout a stalled request can hang the page forever
                    const model = genAI.getGenerativeModel({ model: modelName, ...config }, { timeout: REQUEST_TIMEOUT_MS });
                    try {
                        const result = await model.generateContent(prompt);
                        workingModel[preferred] = modelName;
                        return result;
                    } catch (error: any) {
                        lastError = error;
                        if (isModelGone(error) || isBusy(error) || isTimeout(error)) {
                            console.warn(`Gemini model ${modelName} unavailable (${error.status || error.name || 'error'}), trying the next one...`);
                            continue;
                        }
                        throw error;
                    }
                }
                if (pass === 1) await new Promise(resolve => setTimeout(resolve, 5000));
            }
            if (isBusy(lastError) || isTimeout(lastError)) {
                throw new Error('Google Gemini is overloaded right now. Please try again in a minute.');
            }
            throw lastError;
        },
    } as any;
};

export const geminiPro = createRetryingModel(process.env.GEMINI_MODEL || 'gemini-flash-latest', {
    safetySettings,
    generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
    },
});

export const geminiFlash = createRetryingModel(process.env.GEMINI_FAST_MODEL || 'gemini-flash-lite-latest', {
    safetySettings,
    generationConfig: {
        temperature: 0.4, // lower = more reliable JSON extraction
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 16384,
    },
});

// Fact-checking with grounding
export async function generateWithGrounding(prompt: string, groundingData: any) {
    const fullPrompt = `
${prompt}

GROUNDING DATA (Use this to verify facts):
${JSON.stringify(groundingData, null, 2)}

Instructions:
1. Generate content based on the prompt
2. Verify all facts against the grounding data
3. Include a confidence score (0-1) for each generated section
4. Flag any information that cannot be verified
5. Return response in JSON format
`;

    const result = await geminiPro.generateContent(fullPrompt);
    return result.response.text();
}

// Project narrative generation
export async function generateProjectNarrative(projectData: any) {
    const prompt = `
You are an expert technical writer helping developers showcase their work.

Analyze this GitHub project and create a compelling narrative:

Project: ${projectData.name}
Description: ${projectData.description || 'No description provided'}
Languages: ${Object.keys(projectData.languages || {}).join(', ')}
Stars: ${projectData.stargazers_count || 0}
Forks: ${projectData.forks_count || 0}
README Excerpt: ${projectData.readme?.substring(0, 1000) || 'No README'}
Key Files: ${projectData.keyFiles?.map((f: any) => f.path).join(', ') || 'None'}
Topics: ${projectData.topics?.join(', ') || 'None'}

Generate:
1. short_description: A compelling 1-2 sentence hook (30-50 words)
2. long_description: Detailed narrative covering:
   - The problem it solves
   - Key technical decisions and why
   - Interesting implementation details
   - Impact or learnings
   (200-300 words, first-person)
3. technical_highlights: Array of 3-5 bullet points
4. skills_demonstrated: Array of technical skills shown
5. confidence_score: Your confidence in this analysis (0-1)
6. missing_context: Array of questions/gaps in information

Use a professional yet conversational tone. Focus on storytelling.
Write in first person ("I built", "I implemented").

Return ONLY valid JSON in this exact format:
{
  "short_description": "...",
  "long_description": "...",
  "technical_highlights": ["...", "..."],
  "skills_demonstrated": ["...", "..."],
  "confidence_score": 0.85,
  "missing_context": ["..."]
}
`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();

        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');

        const parsed = JSON.parse(jsonMatch[0]);
        return parsed;
    } catch (error) {
        console.error('Error generating project narrative:', error);
        throw error;
    }
}

// Career narrative generation
export async function generateCareerNarrative(data: {
    experiences: any[];
    projects: any[];
    skills: any[];
    education: any[];
}) {
    const prompt = `
You are a professional career coach and storyteller.

Create a compelling "About Me" section based on this professional data:

EXPERIENCE:
${JSON.stringify(data.experiences, null, 2)}

TOP PROJECTS:
${JSON.stringify(data.projects.slice(0, 5), null, 2)}

SKILLS:
${data.skills.map((s: any) => s.skill_name).join(', ')}

EDUCATION:
${JSON.stringify(data.education, null, 2)}

Create a narrative (150-200 words) that:
- Opens with a strong hook about their unique value
- Shows professional evolution and growth
- Highlights 2-3 key achievements or strengths
- Demonstrates passion and expertise
- Ends with current focus or aspirations
- Uses first person, active voice
- Feels authentic and human (not robotic)

Also generate:
1. hero_tagline: A punchy one-liner for the hero section (8-12 words)
2. meta_description: SEO-optimized description (150-160 chars)
3. confidence_score: Your confidence (0-1)

Return ONLY valid JSON:
{
  "about_me": "...",
  "hero_tagline": "...",
  "meta_description": "...",
  "confidence_score": 0.9
}
`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found in response');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating career narrative:', error);
        throw error;
    }
}

// Code quality analysis
export async function analyzeCodeQuality(repoFiles: any[], languages: string[]) {
    const codeSnippets = repoFiles
        .filter((f: any) => f.content)
        .slice(0, 5)
        .map((f: any) => `// ${f.path}\n${f.content.substring(0, 500)}`)
        .join('\n\n---\n\n');

    const prompt = `
You are a senior software engineer conducting a code review.

Analyze these code samples:

Languages: ${languages.join(', ')}

Code Samples:
${codeSnippets}

Evaluate:
1. Code quality and cleanliness
2. Best practices adherence
3. Architecture patterns
4. Testing approach (if visible)
5. Documentation quality

Return JSON:
{
  "quality_score": 7.5,
  "strengths": ["...", "..."],
  "patterns_used": ["...", "..."],
  "recommendations": ["...", "..."],
  "confidence_score": 0.8
}

Score from 1-10. Be fair but constructive.
`;

    try {
        const result = await geminiFlash.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error analyzing code quality:', error);
        return {
            quality_score: 6.0,
            strengths: [],
            patterns_used: [],
            recommendations: [],
            confidence_score: 0.3
        };
    }
}

// ATS Optimization
export async function optimizeForATS(content: string, targetRole: string = 'Software Engineer') {
    const prompt = `
You are an ATS (Applicant Tracking System) expert and recruiter.

Analyze this portfolio content for ATS optimization targeting "${targetRole}" roles:

${content}

Evaluate:
1. Keyword optimization (industry-standard terms)
2. Content structure and formatting
3. Action verbs and quantifiable achievements
4. Skill coverage for the role
5. Overall recruiter appeal

Return JSON:
{
  "overall_score": 75,
  "keyword_score": 80,
  "formatting_score": 70,
  "content_score": 75,
  "missing_keywords": ["Docker", "CI/CD", "..."],
  "suggestions": [
    {
      "priority": "high",
      "category": "keywords",
      "suggestion": "Add more DevOps-related keywords",
      "examples": ["Docker", "Kubernetes"]
    }
  ],
  "strong_points": ["...", "..."],
  "confidence_score": 0.9
}

Scores are 0-100. Be specific and actionable.
`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error optimizing for ATS:', error);
        throw error;
    }
}

// AI Coaching
export async function generateCoachingSuggestions(portfolioData: any) {
    const prompt = `
You are a career coach specializing in developer portfolios.

Review this portfolio and provide actionable improvement suggestions:

${JSON.stringify(portfolioData, null, 2)}

Focus on:
1. Content gaps (missing projects, skills, experience details)
2. Storytelling improvements
3. Visual presentation suggestions
4. SEO and discoverability
5. Recruiter appeal

Return JSON:
{
  "priority_actions": [
    {
      "priority": "high",
      "category": "content",
      "title": "Add project demos",
      "description": "...",
      "effort": "medium",
      "impact": "high"
    }
  ],
  "content_score": 7.5,
  "completeness": 0.75,
  "overall_feedback": "..."
}
`;

    try {
        const result = await geminiPro.generateContent(prompt);
        const text = result.response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error('No JSON found');
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        console.error('Error generating coaching:', error);
        throw error;
    }
}

// Batch generation with confidence tracking
export async function generateMultiple(tasks: Array<{ type: string; data: any }>) {
    const results = await Promise.allSettled(
        tasks.map(async (task) => {
            switch (task.type) {
                case 'project':
                    return await generateProjectNarrative(task.data);
                case 'career':
                    return await generateCareerNarrative(task.data);
                case 'code-quality':
                    return await analyzeCodeQuality(task.data.files, task.data.languages);
                case 'ats':
                    return await optimizeForATS(task.data.content, task.data.role);
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
        })
    );

    return results.map((result, index) => ({
        type: tasks[index].type,
        status: result.status,
        data: result.status === 'fulfilled' ? result.value : null,
        error: result.status === 'rejected' ? result.reason : null
    }));
}
