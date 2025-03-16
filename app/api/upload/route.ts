import { NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: Request) {
  try {
    console.log("POST /api/upload called");
    
    // Check Cloudinary config
    console.log("Cloudinary config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Not set",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Not set"
    });
    
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      console.error("No file uploaded");
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log("File received:", file.name, file.type, file.size);

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    console.log("Uploading to Cloudinary...");
    
    // Upload to Cloudinary
    try {
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload(dataURI, {
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

      console.log("Upload complete, returning URL:", result.secure_url);
      
      // Return the URL
      return NextResponse.json({ url: result.secure_url });
    } catch (cloudinaryError) {
      console.error("Cloudinary upload error:", cloudinaryError);
      return NextResponse.json(
        { error: `Cloudinary upload failed: ${cloudinaryError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in upload API:", error);
    return NextResponse.json(
      { error: `Failed to upload file: ${error.message}` },
      { status: 500 }
    );
  }
} 