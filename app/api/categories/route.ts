import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        products: true
      }
    });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Error fetching categories' }, { status: 500 });
  }
}

// POST /api/categories
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const category = await prisma.category.create({
      data: {
        name: body.name,
      }
    });
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Error creating category' }, { status: 500 });
  }
} 