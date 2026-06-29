import { getPresignedUploadUrl } from "@/actions/storage.actions";

/**
 * Uploads a File or Blob directly to Cloudflare R2 via presigned URL.
 * Returns the final public storage URL of the file.
 */
export async function uploadToR2(file: File | Blob, fileName: string, fileType: string): Promise<string> {
  // 1. Fetch presigned upload URL from the server action
  const { uploadUrl, fileUrl } = await getPresignedUploadUrl(fileName, fileType);

  // 2. Perform direct PUT upload of the binary payload
  const response = await fetch(uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": fileType,
    },
  });

  if (!response.ok) {
    throw new Error(`Cloudflare R2 upload failed: ${response.statusText}`);
  }

  return fileUrl;
}

/**
 * Converts a base64 Data URL (e.g. from canvas compression or FileReader)
 * to a binary Blob and uploads it to Cloudflare R2.
 * Returns the final public storage URL.
 */
export async function uploadBase64ImageToR2(base64Str: string, fileName = "image.jpg"): Promise<string> {
  if (!base64Str || !base64Str.startsWith("data:image/")) {
    return base64Str;
  }

  // Parse mime type and base64 parts
  const parts = base64Str.split(";base64,");
  const fileType = parts[0].split(":")[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  const blob = new Blob([uInt8Array], { type: fileType });
  return uploadToR2(blob, fileName, fileType);
}
