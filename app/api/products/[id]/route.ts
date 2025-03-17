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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: {
        id: params.id,
      },
      include: {
        category: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const data = await request.json();
    const { name, description, price, stock, categoryId, imageBase64 } = data;
    
    let imageUrl = undefined; // Don't update image if not provided
    
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
        // Continue without updating image if upload fails
      }
    }
    
    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name,
        description: description || '',
        price: Number(price),
        stock: Number(stock),
        categoryId,
        ...(imageUrl && { image: imageUrl }), // Only update image if new one was uploaded
      },
      include: {
        category: true,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json(
      { error: `Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log(`DELETE /api/products/${params.id} called`);
    
    const product = await prisma.product.delete({
      where: {
        id: params.id,
      },
    });

    console.log("Product deleted:", product);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json(
      { error: `Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
} 