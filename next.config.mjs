/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'avatars.githubusercontent.com',
            },
            {
                protocol: 'https',
                hostname: 'github.com',
            },
        ],
    },
    reactCompiler: true,
    // The website export (/api/export) runs Tailwind at request time
    serverExternalPackages: ['tailwindcss', 'postcss', 'autoprefixer', 'tailwindcss-animate'],
    outputFileTracingIncludes: {
        '/api/export': [
            './src/app/globals.css',
            './tailwind.config.js',
            './node_modules/react/**',
            './node_modules/react-dom/**',
            './node_modules/scheduler/**',
        ],
    },
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb',
        },
    },
};

export default nextConfig;
