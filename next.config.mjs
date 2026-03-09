/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ra.co' },
      { protocol: 'https', hostname: '**.residentadvisor.net' },
      { protocol: 'https', hostname: '**.beethere.ro' },
      { protocol: 'https', hostname: '**.feverup.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
