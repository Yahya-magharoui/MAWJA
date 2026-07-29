/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: { typedRoutes: true },
  reactStrictMode: true,
  distDir: process.env.NODE_ENV === 'development' ? '.next-dev' : '.next',
}
export default nextConfig
