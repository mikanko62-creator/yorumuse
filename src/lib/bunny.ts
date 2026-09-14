/**
 * Bunny.net Storage & CDN Integration Helper
 */

const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "yorumuse-storage";
const ACCESS_KEY = process.env.BUNNY_API_KEY || "6e26ac2d-b4c9-485f-ae87572b2ebb-4567-4ae7";
const STORAGE_ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT || "storage.bunnycdn.com";
const CDN_URL = (process.env.BUNNY_CDN_URL || "https://yorumuse.b-cdn.net").replace(/\/$/, "");

export async function uploadToBunny(
  buffer: Buffer,
  folder: "thumbnails" | "videos",
  filename: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  const uploadUrl = `https://${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${folder}/${filename}`;

  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      AccessKey: ACCESS_KEY,
      "Content-Type": contentType,
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Bunny storage upload failed: ${res.status} - ${errorText}`);
  }

  // Return public fast CDN URL
  return `${CDN_URL}/${folder}/${filename}`;
}
