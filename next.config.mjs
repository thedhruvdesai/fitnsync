/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Keep visited pages in the phone's memory for a while, so switching tabs is instant
  // instead of asking the server again every time.
  experimental: { staleTimes: { dynamic: 60, static: 300 } },
  compress: true,
};
export default nextConfig;
