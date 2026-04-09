import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@vigil/shared-types'],
  experimental: {
    typedRoutes: false,
  },
};

export default nextConfig;
