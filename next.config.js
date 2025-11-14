/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Externalize PDF parsing packages to avoid webpack bundling issues
  serverExternalPackages: ['pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  webpack: (config) => {
    // Disable canvas bundling (required for pdf-parse)
    config.resolve.alias.canvas = false;
    return config;
  },
}

module.exports = nextConfig
