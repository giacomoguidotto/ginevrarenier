import { v2 as cloudinary } from "cloudinary";
import { NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const { publicId } = (await request.json()) as { publicId: string };

  if (!publicId) {
    return NextResponse.json(
      { error: "No publicId provided" },
      { status: 400 }
    );
  }

  await cloudinary.uploader.destroy(publicId);

  return NextResponse.json({ success: true });
}
