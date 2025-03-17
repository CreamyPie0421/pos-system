/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.POSTGRES_PRISMA_URL,
  },
  images: {
    domains: ['res.cloudinary.com', 'placehold.co'],
  },
  experimental: {
    serverActions: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  }
};

module.exports = nextConfig; 