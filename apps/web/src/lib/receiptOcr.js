// Lecture gratuite d'un ticket : OCR dans le navigateur (tesseract.js), rien n'est envoyé à un service payant
// et la photo ne quitte pas l'appareil. La bibliothèque n'est chargée qu'au premier scan.
import { parseReceipt, parseInvoice } from './receiptParser.js';
import { suggestCategory } from '../api.js';

const MAX_SIDE = 1800;
const isPdf = (file) => file.type === 'application/pdf' || /\.pdf$/i.test(file.name || '');

// Ouvre la 1re page du PDF. Le moteur pdf.js n'est chargé qu'à la demande.
async function openFirstPage(file) {
  const [pdfjs, { default: workerUrl }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  return pdf.getPage(1);
}

// PDF « texte » (facture, ticket téléchargé) : on relit les lignes d'après leur position verticale
async function pdfText(page) {
  const { items } = await page.getTextContent();
  const rows = new Map();
  for (const it of items) {
    if (!it.str?.trim()) continue;
    const y = Math.round(it.transform[5] / 3);
    rows.set(y, [...(rows.get(y) || []), it]);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, row]) => row.sort((a, b) => a.transform[4] - b.transform[4]).map((i) => i.str).join(' '))
    .join('\n');
}

// PDF « image » (ticket scanné) : on dessine la page pour la lire par OCR
async function pdfToCanvas(page) {
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: Math.min(3, MAX_SIDE / Math.max(base.width, base.height)) });
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
  return canvas;
}

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

async function ocr(canvas, onProgress) {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('fra+eng', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
    },
  });
  try {
    const { data } = await worker.recognize(canvas);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

/**
 * @param {File} file image ou PDF du ticket
 * @param {(percent:number)=>void} onProgress
 * @returns {{description:string, amount:number, date:string|null, categoryId:string|null, categoryName:string|null}}
 */
async function extractText(file, onProgress) {
  if (isPdf(file)) {
    const page = await openFirstPage(file);
    const text = await pdfText(page);
    // Peu ou pas de texte : c'est un scan enregistré en PDF, on passe par l'OCR
    return text.replace(/\s/g, '').length > 40 ? text : ocr(await pdfToCanvas(page), onProgress);
  }
  return ocr(await prepareImage(file), onProgress);
}

/** Lecture d'une facture (PDF ou photo) : fournisseur, montant, échéance. Aucune donnée n'est envoyée. */
export async function scanInvoiceLocal(file, onProgress = () => {}) {
  return parseInvoice(await extractText(file, onProgress));
}

export async function scanReceiptLocal(file, onProgress = () => {}) {
  const text = await extractText(file, onProgress);

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
