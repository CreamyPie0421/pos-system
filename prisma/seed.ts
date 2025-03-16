import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  try {
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
      }),
      prisma.category.upsert({
        where: { name: 'Grocery' },
        update: {},
        create: { name: 'Grocery' }
      }),
      prisma.category.upsert({
        where: { name: 'Electronics' },
        update: {},
        create: { name: 'Electronics' }
      }),
      prisma.category.upsert({
        where: { name: 'Household' },
        update: {},
        create: { name: 'Household' }
      }),
      prisma.category.upsert({
        where: { name: 'Personal Care' },
        update: {},
        create: { name: 'Personal Care' }
      }),
      prisma.category.upsert({
        where: { name: 'Stationery' },
        update: {},
        create: { name: 'Stationery' }
      })
    ]);
    console.log('Created categories:', categories);

    const users = await prisma.user.findMany();
    console.log('Users:', users);
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });