import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";
import { cloudinaryFolder } from "@/lib/cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const folder = formData.get("folder") as string | null;

  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  let result: { secure_url: string; public_id: string };
  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    result = await new Promise<{
      secure_url: string;
      public_id: string;
    }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: folder ?? cloudinaryFolder(),
            resource_type: "image",
          },
          (error, uploadResult) => {
            if (error) {
              reject(error);
            } else if (uploadResult) {
              resolve(uploadResult);
            }
          }
        )
        .end(buffer);
    });
  } catch (err) {
    console.error("[cloudinary/upload] Upload failed:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Cloudinary upload failed: ${message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({
    url: result.secure_url,
    publicId: result.public_id,
  });
}
