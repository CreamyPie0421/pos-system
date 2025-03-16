/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['res.cloudinary.com'], // Para sa Cloudinary images
  },
  env: {
    DATABASE_URL: process.env.POSTGRES_PRISMA_URL,
  },
  experimental: {
    serverActions: true,
  }
};

module.exports = nextConfig; 