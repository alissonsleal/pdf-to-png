/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    resolveAlias: {
      module: { browser: './stubs/empty.js' },
      fs: { browser: './stubs/empty.js' },
      path: { browser: './stubs/empty.js' },
      crypto: { browser: './stubs/empty.js' },
      stream: { browser: './stubs/empty.js' },
      'node:fs': { browser: './stubs/empty.js' },
      'node:module': { browser: './stubs/empty.js' },
      'node:path': { browser: './stubs/empty.js' },
      'node:crypto': { browser: './stubs/empty.js' },
      'node:stream': { browser: './stubs/empty.js' },
    },
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        module: false,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        'node:fs': false,
        'node:module': false,
        'node:path': false,
        'node:crypto': false,
        'node:stream': false,
      };
    }
    return config;
  },
};

export default nextConfig;
