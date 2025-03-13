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

  // Create sample categories
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

  // Create sample products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { id: 'rice-meal' },
      update: {},
      create: {
        id: 'rice-meal',
        name: 'Rice Meal',
        description: 'Rice with choice of meat',
        price: 50,
        stock: 100,
        categoryId: categories[0].id
      }
    }),
    prisma.product.upsert({
      where: { id: 'soft-drink' },
      update: {},
      create: {
        id: 'soft-drink',
        name: 'Soft Drink',
        description: 'Carbonated beverage',
        price: 15,
        stock: 100,
        categoryId: categories[1].id
      }
    }),
    prisma.product.upsert({
      where: { id: 'chips' },
      update: {},
      create: {
        id: 'chips',
        name: 'Chips',
        description: 'Potato chips',
        price: 20,
        stock: 100,
        categoryId: categories[2].id
      }
    })
  ]);
  console.log('Created products:', products);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 