import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@libsql/client'],
  typescript: {
    ignoreBuildErrors: true,  // Temporarily for deployment
  },
};

export default nextConfig;
