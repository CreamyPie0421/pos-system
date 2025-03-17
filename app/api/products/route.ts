import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Verify Cloudinary config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('Missing Cloudinary environment variables');
}

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
    // Verify Cloudinary config first
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Missing Cloudinary configuration');
    }

    const data = await request.json();
    const { name, description, price, stock, categoryId, imageBase64 } = data;
    
    let imageUrl = 'https://placehold.co/400x400?text=No+Image';
    
    if (imageBase64) {
      try {
        console.log('Uploading image to Cloudinary...');
        const uploadResult = await new Promise<CloudinaryResponse>((resolve, reject) => {
          cloudinary.uploader.upload(imageBase64, {
            folder: 'pos-system'
          }, (error, result) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result && 'secure_url' in result) {
              console.log('Cloudinary upload success:', result.secure_url);
              resolve(result as CloudinaryResponse);
            } else {
              reject(new Error('Invalid Cloudinary response'));
            }
          });
        });
        imageUrl = uploadResult.secure_url;
      } catch (error) {
        console.error('Error uploading image:', error);
        // Continue with default image if upload fails
      }
    }
    
    console.log('Creating product with data:', {
      name,
      description,
      price,
      stock,
      categoryId,
      imageUrl
    });

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

    console.log('Product created successfully:', product);
    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json(
      { error: `Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 