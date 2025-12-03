/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // output: 'standalone',
  // distDir: '.next',
  
  transpilePackages: ['firebase', '@firebase'],
  // Exclude server-only packages from client bundle
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin', '@google-cloud/firestore'],
  },
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
    // Only start the dev WebSocket server in local development builds
    const isDev = process.env.NODE_ENV === 'development';
    const isVercel = !!process.env.VERCEL;
    if (isServer && isDev && !isVercel && !global.webhookServerStarted) {
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
          
          // Only listen if not already listening
          if (!server.listening) {
            server.listen(port, () => {
              console.log(`WebSocket server listening on port ${port}`);
            });
          }
        };
        
        // Get the Next.js dev server port and use a different one for WebSocket
        const nextPort = parseInt(process.env.PORT || '9004', 10);
        const wsPort = nextPort + 100; // Use port 100 higher to avoid conflicts
        startServer(wsPort);
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
