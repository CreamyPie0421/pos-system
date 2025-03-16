import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Check if admin user exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@example.com' }
  });

  if (!existingAdmin) {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      }
    });
    console.log('Created admin user:', admin);
  } else {
    console.log('Admin user already exists');
  }

  // Create basic categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Food' },
      update: {},
      create: { name: 'Food' }
    }),
    prisma.category.upsert({
      where: { name: 'Beverages' },
      update: {},
      create: { name: 'Beverages' }
    }),
    prisma.category.upsert({
      where: { name: 'Snacks' },
      update: {},
      create: { name: 'Snacks' }
    })
  ]);
  console.log('Created categories:', categories);

  const users = await prisma.user.findMany();
  console.log('Users:', users);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 