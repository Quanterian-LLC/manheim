/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['inspectionreport.manheim.com', 'search.manheim.com'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 