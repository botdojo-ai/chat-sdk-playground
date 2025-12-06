/** @type {import('next').NextConfig} */
const ALLOWED_PROXY_ORIGIN = 'http://mcp-app-proxy.botdojo.com';
const ALLOWED_PROXY_ORIGIN_HTTPS = 'https://mcp-app-proxy.botdojo.com';
const LOCAL_DEV_ORIGIN = 'http://localhost:3500';
const TEST_SITE_ORIGIN = 'http://test-site-a.local:3500';
const TEST_SITE_ORIGIN_HTTPS = 'https://test-site-a.local:3500';
const FRAME_ANCESTORS = ["*"];

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@botdojo/chat-sdk'],
  webpack: (config, { isServer }) => {
    // Exclude @botdojo/sdk from client bundle (it's server-only)
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@botdojo/sdk': false,
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        // Allow the remote MCP app example to be fetched and framed by the proxy origin in local dev.
        source: '/examples/chat-sdk/mcp-app-example/canvas/remote-url-native',
        headers: [
          // Allow any origin in dev; tighten in production if needed.
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: '*' },
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors ${FRAME_ANCESTORS.join(' ')};`,
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig
