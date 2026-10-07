// Lecture gratuite d'un ticket : OCR dans le navigateur (tesseract.js), rien n'est envoyé à un service payant
// et la photo ne quitte pas l'appareil. La bibliothèque n'est chargée qu'au premier scan.
import { parseReceipt } from './receiptParser.js';
import { suggestCategory } from '../api.js';

const MAX_SIDE = 1800;

// Réduit les photos de téléphone (4000 px) et passe en niveaux de gris contrastés : plus rapide et plus lisible
async function prepareImage(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = img.data;
  for (let i = 0; i < px.length; i += 4) {
    const gray = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
    const v = Math.max(0, Math.min(255, (gray - 128) * 1.4 + 128));
    px[i] = px[i + 1] = px[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
}

/**
 * @param {File} file image du ticket
 * @param {(percent:number)=>void} onProgress
 * @returns {{description:string, amount:number, date:string|null, categoryId:string|null, categoryName:string|null}}
 */
export async function scanReceiptLocal(file, onProgress = () => {}) {
  const [{ createWorker }, canvas] = await Promise.all([import('tesseract.js'), prepareImage(file)]);

  const worker = await createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
    },
  });
  let text;
  try {
    ({ data: { text } } = await worker.recognize(canvas));
  } finally {
    await worker.terminate();
  }

  const parsed = parseReceipt(text);
  if (!parsed.amount) {
    throw new Error('Montant illisible sur ce ticket. Reprenez la photo bien à plat et bien éclairée, ou saisissez la dépense à la main.');
  }

  // Catégorie d'après l'historique de l'utilisateur (même mécanisme que la saisie manuelle)
  let categoryId = null;
  let categoryName = null;
  if (parsed.description) {
    try {
      const { suggestion } = await suggestCategory(parsed.description, 'expense');
      if (suggestion) ({ categoryId, name: categoryName } = { categoryId: suggestion.categoryId, name: suggestion.name });
    } catch {
      // facultatif
    }
  }
  return { ...parsed, categoryId, categoryName };
}
