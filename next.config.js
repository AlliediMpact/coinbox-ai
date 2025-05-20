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
  transpilePackages: ['firebase', 'firebase-admin', '@firebase'],
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
      try {
        const { webhookMonitoring } = require('./src/lib/webhook-monitoring');
        const server = require('http').createServer();
        webhookMonitoring.initialize(server);
        
        // Create a function to try different ports
        const startServer = (port) => {
          server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              console.log(`Port ${port} is in use, trying ${port + 1}...`);
              startServer(port + 1);
            }
          });
          
          server.listen(port, () => {
            console.log(`WebSocket server listening on port ${port}`);
          });
        };
        
        // Start with port 9005
        startServer(9005);
      } catch (error) {
        console.error('Failed to start WebSocket server:', error);
      }
    }
    
    // Provide Node.js modules for client-side code that expects them
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false, // Provide an empty module
        tls: false,
        fs: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer/'),
      };
      
      // Add buffer polyfill
      config.plugins.push(
        new (require('webpack').ProvidePlugin)({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
    }
    
    return config;
  },
};

module.exports = nextConfig;
