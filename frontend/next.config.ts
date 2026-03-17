/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you're using the pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  
  // If your pages are in src/pages, specify that
  distDir: '.next',
  
  // Explicitly disable app directory
  experimental: {
    appDir: false,
  },
};

module.exports = nextConfig;