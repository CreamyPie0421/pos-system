import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@pos.com',
      name: 'Admin User',
      password: 'admin123', // In production, this should be hashed
      role: 'ADMIN',
    },
  });

  // Create basic categories
  await Promise.all([
    prisma.category.create({
      data: { name: 'Beverages' },
    }),
    prisma.category.create({
      data: { name: 'Food' },
    }),
    prisma.category.create({
      data: { name: 'Snacks' },
    }),
  ]);

  console.log('Admin user and categories created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 