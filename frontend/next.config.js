/** @type {import('next').NextConfig} */
const nextConfig = {
  // If you're using the pages router (not app router)
  reactStrictMode: true,

  // Specify that you're using the pages directory
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

module.exports = nextConfig;
