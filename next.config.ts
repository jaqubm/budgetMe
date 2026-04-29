import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  distDir: 'build',
  devIndicators: false,
};

export default nextConfig;
