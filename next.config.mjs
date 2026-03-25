import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ra.co' },
      { protocol: 'https', hostname: '**.residentadvisor.net' },
      { protocol: 'https', hostname: '**.eventbook.ro' },
      { protocol: 'https', hostname: 'eventbook.ro' },
      { protocol: 'https', hostname: '**.onevent.ro' },
      { protocol: 'https', hostname: '**.beethere.ro' },
      { protocol: 'https', hostname: '**.facebook.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.twimg.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'livetickets-cdn.azureedge.net' },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/c15t/:path*',
        destination: `${process.env.NEXT_PUBLIC_C15T_URL || 'https://consent.io'}/:path*`,
      },
    ];
  },
};

export default withSentryConfig(
  nextConfig,
  {
    silent: true,
    org: "noctvm",
    project: "noctvm-app",
  },
  {
    widenClientFileUpload: true,
    transpileClientSDK: true,
    tunnelRoute: "/monitoring",
    hideSourceMaps: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);

