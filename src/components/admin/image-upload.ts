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
    const body = await response.text().catch(() => "");
    console.error(
      "[image-upload] Upload failed:",
      response.status,
      response.statusText,
      body
    );
    throw new Error(
      `Upload failed (${response.status} ${response.statusText}): ${body || "no details"}`
    );
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
