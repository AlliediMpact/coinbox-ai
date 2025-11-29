/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  output: 'standalone',
  transpilePackages: ['firebase', 'firebase-admin', '@firebase'],
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Hardened security headers
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value:
              'accelerometer=(), camera=(), microphone=(), geolocation=(), gyroscope=(), magnetometer=(), payment=(), usb=()'
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // scripts and styles
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              // images and fonts
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              // XHR/WebSockets/API calls
              "connect-src 'self' https: wss:",
              // media
              "media-src 'self' https:",
              // disallow framing
              "frame-ancestors 'none'",
              // prevent base tag changes
              "base-uri 'self'",
            ].join('; ')
          }
        ]
      }
    ]
  },
  // Commented out rewrites to avoid proxy loop in development
  // async rewrites() {
  //   const port = process.env.PORT || 9004;
  //   return [
  //     {
  //       source: '/:path*',
  //       destination: `http://localhost:${port}/:path*`,
  //     },
  //   ];
  // },
  // Add WebSocket server initialization
  webpack: (config, { isServer }) => {
    if (isServer && !global.webhookServerStarted) {
      try {
        global.webhookServerStarted = true;
        const { webhookMonitoring } = require('./src/lib/webhook-monitoring');
        const server = require('http').createServer();
        webhookMonitoring.initialize(server);
        
        // Create a function to try different ports
        const startServer = (port) => {
          server.once('error', (err) => {
            if (err.code === 'EADDRINUSE') {
              console.log(`Port ${port} is in use, trying ${port + 1}...`);
              startServer(port + 1);
            } else {
              console.error('WebSocket server error:', err);
            }
          });
          
          server.listen(port, () => {
            console.log(`WebSocket server listening on port ${port}`);
          });
        };
        
        // Start with port 9008 to avoid conflicts with dev server on 9007
        startServer(9008);
      } catch (error) {
        console.error('Failed to start WebSocket server:', error);
      }
    }
    
    // Provide Node.js modules for client-side code that expects them
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        dns: false,
        dgram: false,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        zlib: require.resolve('browserify-zlib'),
        path: require.resolve('path-browserify'),
        os: require.resolve('os-browserify/browser'),
        buffer: require.resolve('buffer/')
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
