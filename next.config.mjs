/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ra.co' },
      { protocol: 'https', hostname: '**.residentadvisor.net' },
      { protocol: 'https', hostname: '**.beethere.ro' },
      { protocol: 'https', hostname: 'cdn.beethere.ro' },
      { protocol: 'https', hostname: '**.feverup.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'livetickets-cdn.azureedge.net' },
      { protocol: 'https', hostname: '**.iabilet.ro' },
      { protocol: 'https', hostname: '**.livetickets.ro' },
      { protocol: 'https', hostname: '**.ambilet.ro' },
      { protocol: 'https', hostname: '**.zilesinopti.ro' },
      { protocol: 'https', hostname: '**.click-now.ro' },
      { protocol: 'https', hostname: '**.facebook.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.twimg.com' },
    ],
  },
};

export default nextConfig;
