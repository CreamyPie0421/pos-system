import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dyudq9geu',
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export async function POST(request: Request) {
  try {
    console.log("POST /api/products-base64 called");
    
    const data = await request.json();
    const { name, description, price, stock, categoryId, imageBase64 } = data;
    
    console.log("Received data:", { name, description, price, stock, categoryId, hasImage: !!imageBase64 });
    
    let imageUrl = null;
    
    if (imageBase64) {
      try {
        console.log("Uploading image to Cloudinary...");
        
        // Upload to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(imageBase64, {
            folder: 'pos-system'
          }, (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("Cloudinary upload success:", result.secure_url);
              resolve(result);
            }
          });
        });
        
        imageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Error during Cloudinary upload:", uploadError);
        throw new Error(`Image upload failed: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
      }
    }
    
    console.log("Creating product with image URL:", imageUrl);
    
    // Create product
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        image: imageUrl,
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