/** @type {import('next').NextConfig} */
const nextConfig = {
  // 忽略TS和ESLint错误，强制构建
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;