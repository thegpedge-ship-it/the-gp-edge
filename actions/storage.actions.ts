"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";

/**
 * Generates a Cloudflare R2 presigned upload URL and the final public file URL.
 * 
 * @param fileName - The original name of the file to be uploaded
 * @param fileType - The MIME type (content type) of the file
 */
export async function getPresignedUploadUrl(fileName: string, fileType: string) {
  const uniqueId = crypto.randomUUID();
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
  const fileKey = `${uniqueId}-${sanitizedFileName}`;

  const bucketName = process.env.R2_BUCKET_NAME || "";

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(r2, command, {
    expiresIn: 60,
  });

  const publicUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  const basePublicUrl = publicUrl.endsWith("/") ? publicUrl : `${publicUrl}/`;
  const fileUrl = `${basePublicUrl}${fileKey}`;

  return {
    uploadUrl,
    fileUrl,
  };
}
