/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export', // This tells Next.js to generate a static site
    images: {
      unoptimized: true, // Disable image optimization as GitHub Pages doesn't support dynamic image handling
    },
    // If your app needs a specific base path, uncomment and adjust:
    // basePath: '/your-repository-name',
  };
  
  module.exports = nextConfig;