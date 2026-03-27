/**
 * Upload a file to Cloudinary via the API route.
 */
export async function uploadImage(
  file: File,
  folder: string
): Promise<{ url: string; publicId: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/cloudinary/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Upload failed");
  }

  return response.json();
}

/**
 * Delete an image from Cloudinary via the API route.
 */
export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  await fetch("/api/cloudinary/delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId }),
  });
}
