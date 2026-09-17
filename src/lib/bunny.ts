/**
 * Bunny.net Storage & CDN Integration Helper
 */

const STORAGE_ZONE = process.env.BUNNY_STORAGE_ZONE || "yorumuse-storage";
const ACCESS_KEY = process.env.BUNNY_API_KEY || "";
const STORAGE_ENDPOINT = process.env.BUNNY_STORAGE_ENDPOINT || "storage.bunnycdn.com";
const CDN_URL = (process.env.BUNNY_CDN_URL || "https://yorumuse.b-cdn.net").replace(/\/$/, "");

function ensureBunnyConfigured() {
  if (!ACCESS_KEY) {
    throw new Error("BUNNY_API_KEY is not configured in environment variables.");
  }
}

export interface BunnyStorageItem {
  Guid: string;
  StorageZoneName: string;
  Path: string;
  ObjectName: string;
  Length: number;
  Checksum?: string | null;
  IsDirectory: boolean;
  DateCreated: string;
  LastChanged: string;
  cdnUrl?: string;
}

/**
 * Upload file to Bunny Storage
 */
export async function uploadToBunny(
  buffer: Buffer,
  folder: string,
  filename: string,
  contentType: string = "application/octet-stream"
): Promise<string> {
  ensureBunnyConfigured();
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const uploadUrl = cleanFolder
    ? `https://${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${cleanFolder}/${encodeURIComponent(filename)}`
    : `https://${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${encodeURIComponent(filename)}`;

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
  return cleanFolder
    ? `${CDN_URL}/${cleanFolder}/${filename}`
    : `${CDN_URL}/${filename}`;
}

/**
 * List files in Bunny Storage
 */
export async function listBunnyFiles(folder: string = ""): Promise<BunnyStorageItem[]> {
  ensureBunnyConfigured();
  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const url = cleanFolder
    ? `https://${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${cleanFolder}/`
    : `https://${STORAGE_ENDPOINT}/${STORAGE_ZONE}/`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      AccessKey: ACCESS_KEY,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to list Bunny files: ${res.status} - ${errorText}`);
  }

  const items: BunnyStorageItem[] = await res.json();
  
  return items.map((item) => {
    const relFolder = cleanFolder ? `${cleanFolder}/` : "";
    return {
      ...item,
      cdnUrl: item.IsDirectory ? undefined : `${CDN_URL}/${relFolder}${item.ObjectName}`,
    };
  });
}

/**
 * Delete a file or directory from Bunny Storage
 */
export async function deleteFromBunny(filePath: string): Promise<boolean> {
  ensureBunnyConfigured();
  // Strip leading and trailing slashes
  const cleanPath = filePath.replace(/^\/+/, "");
  const encodedParts = cleanPath.split("/").map((part) => encodeURIComponent(part)).join("/");
  const deleteUrl = `https://${STORAGE_ENDPOINT}/${STORAGE_ZONE}/${encodedParts}`;

  const res = await fetch(deleteUrl, {
    method: "DELETE",
    headers: {
      AccessKey: ACCESS_KEY,
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "Unknown error");
    throw new Error(`Failed to delete from Bunny storage: ${res.status} - ${errorText}`);
  }

  return true;
}

export function getBunnyCdnUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\/+/, "");
  return `${CDN_URL}/${clean}`;
}
