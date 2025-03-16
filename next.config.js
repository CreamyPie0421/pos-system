/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DATABASE_URL: process.env.POSTGRES_PRISMA_URL,
  },
};

module.exports = nextConfig; 