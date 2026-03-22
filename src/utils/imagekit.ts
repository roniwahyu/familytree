import { dbOperations } from '../db/database';

export interface ImageKitConfig {
  publicKey: string;
  privateKey: string;
  urlEndpoint: string;
}

export interface ImageKitUploadResult {
  url: string;
  thumbnailUrl: string;
  fileId: string;
  name: string;
}

const SETTINGS_KEYS = {
  publicKey: 'imagekit_publicKey',
  privateKey: 'imagekit_privateKey',
  urlEndpoint: 'imagekit_urlEndpoint',
};

// Read from env variables (Vite injects VITE_ prefixed vars at build time)
const ENV_CONFIG = {
  publicKey: import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '',
  privateKey: import.meta.env.VITE_IMAGEKIT_PRIVATE_KEY || '',
  urlEndpoint: import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '',
};

export async function getImageKitConfig(): Promise<ImageKitConfig | null> {
  // DB settings override env if present
  const [dbPublicKey, dbPrivateKey, dbUrlEndpoint] = await Promise.all([
    dbOperations.getSetting(SETTINGS_KEYS.publicKey),
    dbOperations.getSetting(SETTINGS_KEYS.privateKey),
    dbOperations.getSetting(SETTINGS_KEYS.urlEndpoint),
  ]);

  const publicKey = dbPublicKey || ENV_CONFIG.publicKey;
  const privateKey = dbPrivateKey || ENV_CONFIG.privateKey;
  const urlEndpoint = dbUrlEndpoint || ENV_CONFIG.urlEndpoint;

  if (!publicKey || !privateKey || !urlEndpoint) return null;

  return { publicKey, privateKey, urlEndpoint };
}

export async function saveImageKitConfig(config: ImageKitConfig): Promise<void> {
  await Promise.all([
    dbOperations.saveSetting(SETTINGS_KEYS.publicKey, config.publicKey),
    dbOperations.saveSetting(SETTINGS_KEYS.privateKey, config.privateKey),
    dbOperations.saveSetting(SETTINGS_KEYS.urlEndpoint, config.urlEndpoint),
  ]);
}

export async function clearImageKitConfig(): Promise<void> {
  await Promise.all([
    dbOperations.saveSetting(SETTINGS_KEYS.publicKey, ''),
    dbOperations.saveSetting(SETTINGS_KEYS.privateKey, ''),
    dbOperations.saveSetting(SETTINGS_KEYS.urlEndpoint, ''),
  ]);
}

export async function uploadToImageKit(
  file: File,
  config: ImageKitConfig,
  folder: string = '/familytree'
): Promise<ImageKitUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileName', file.name);
  formData.append('folder', folder);
  formData.append('useUniqueFileName', 'true');

  const authHeader = 'Basic ' + btoa(config.privateKey + ':');

  const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.message || `Upload gagal (${response.status})`);
  }

  const data = await response.json();

  return {
    url: data.url,
    thumbnailUrl: data.thumbnailUrl,
    fileId: data.fileId,
    name: data.name,
  };
}

/** Build an optimized ImageKit URL with transformations */
export function imagekitUrl(
  originalUrl: string,
  transforms?: { width?: number; height?: number; quality?: number }
): string {
  if (!originalUrl || !transforms) return originalUrl;
  // Only transform ImageKit URLs
  if (!originalUrl.includes('ik.imagekit.io')) return originalUrl;

  const parts: string[] = [];
  if (transforms.width) parts.push(`w-${transforms.width}`);
  if (transforms.height) parts.push(`h-${transforms.height}`);
  if (transforms.quality) parts.push(`q-${transforms.quality}`);
  if (parts.length === 0) return originalUrl;

  const tr = parts.join(',');
  // Insert /tr:.../ after the URL endpoint
  const urlObj = new URL(originalUrl);
  const pathParts = urlObj.pathname.split('/').filter(Boolean);
  urlObj.pathname = '/' + [pathParts[0], `tr:${tr}`, ...pathParts.slice(1)].join('/');
  return urlObj.toString();
}
