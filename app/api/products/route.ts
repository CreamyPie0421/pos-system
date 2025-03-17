import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

interface CloudinaryResponse {
  secure_url: string;
}

// GET /api/products
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, description, price, stock, categoryId, imageBase64 } = data;
    
    let imageUrl = 'https://placehold.co/400x400?text=No+Image';
    
    if (imageBase64) {
      try {
        const uploadResult = await new Promise<CloudinaryResponse>((resolve, reject) => {
          cloudinary.uploader.upload(imageBase64, {
            folder: 'pos-system'
          }, (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryResponse);
          });
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading image:', error);
        // Continue with default image if upload fails
      }
    }
    
    const product = await prisma.product.create({
      data: {
        name,
        description: description || '',
        price: Number(price),
        stock: Number(stock),
        categoryId,
        image: imageUrl,
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 