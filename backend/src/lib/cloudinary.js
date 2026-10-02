import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

// Le SDK lit aussi nativement CLOUDINARY_URL s'il est défini
if (cloudName && apiKey && apiSecret) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export function isCloudinaryConfigured() {
  return Boolean(process.env.CLOUDINARY_URL || (cloudName && apiKey && apiSecret));
}

/**
 * Upload une image multer (buffer mémoire ou fichier disque) vers Cloudinary.
 * @param {object} file - objet req.file de multer
 * @param {string} folder - sous-dossier Cloudinary (ex: 'avatars')
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
export function uploadImageToCloudinary(file, folder) {
  const options = {
    folder: `mybudget/${folder}`,
    resource_type: 'image',
    transformation: [
      { width: 512, height: 512, crop: 'limit' },
      { fetch_format: 'auto', quality: 'auto' },
    ],
  };

  if (file.buffer) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      });
      stream.end(file.buffer);
    });
  }

  return cloudinary.uploader.upload(file.path, options);
}

export function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.startsWith('https://res.cloudinary.com/');
}

/**
 * Extrait le public_id d'une URL Cloudinary.
 * Ex: https://res.cloudinary.com/<cloud>/image/upload/v123/mybudget/avatars/abc.jpg
 *     -> 'mybudget/avatars/abc'
 */
export function publicIdFromCloudinaryUrl(url) {
  const match = url.match(/\/image\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
}

/** Supprime une image Cloudinary à partir de son URL (best-effort). */
export async function deleteCloudinaryImage(url) {
  const publicId = publicIdFromCloudinaryUrl(url);
  if (!publicId) return;
  await cloudinary.uploader.destroy(publicId);
}
