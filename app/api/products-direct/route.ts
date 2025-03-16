import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log("POST /api/products-direct called");
    
    const data = await request.json();
    console.log("Received data:", data);
    
    const { name, description, price, stock, categoryId, image } = data;
    
    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        image,
      },
      include: {
        category: true,
      },
    });

    console.log("Product created:", product);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 