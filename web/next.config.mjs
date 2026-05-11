/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxy /api/* to the FastAPI backend during development so the frontend
  // can keep using same-origin URLs.
  async rewrites() {
    const target = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000';
    return [
      { source: '/api/:path*', destination: `${target}/api/:path*` },
    ];
  },
};

export default nextConfig;
