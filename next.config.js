/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: true,
  },
  async rewrites() {
    return [
      {
        source: '/:path*',
        destination: `http://localhost:9004/:path*`,
      },
    ];
  },
  // Add WebSocket server initialization
  webpack: (config, { isServer }) => {
    if (isServer) {
      const { webhookMonitoring } = require('./src/lib/webhook-monitoring');
      const server = require('http').createServer();
      webhookMonitoring.initialize(server);
      server.listen(9005, () => {
        console.log('WebSocket server listening on port 9005');
      });
    }
    return config;
  },
};

module.exports = nextConfig;
