/** @type {import('next').NextConfig} */
const supabaseHost = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/^https?:\/\//, '');

const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: 'https', hostname: supabaseHost, pathname: '/storage/v1/object/public/**' }]
      : []
  }
};

export default nextConfig;
