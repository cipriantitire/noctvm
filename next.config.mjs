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
      { protocol: 'https', hostname: '**.ra.co' },
      { protocol: 'https', hostname: '**.residentadvisor.net' },
      { protocol: 'https', hostname: 'livetickets-cdn.azureedge.net' },
    ],
  },
};

export default nextConfig;
