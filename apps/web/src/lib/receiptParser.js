// Extrait montant, date et commerçant du texte brut lu sur un ticket de caisse (OCR).
// Fonction pure, sans dépendance : testable seule.

// 12,50 · 1 234,56 · 1234.56 — jamais une date comme 12.10.2026 ni un grand nombre sans décimales
const AMOUNT_RE = /(?<![\d.,/])\d{1,3}(?:[  ]\d{3})*[.,]\d{2}(?![\d]|[.,/]\d)|(?<![\d.,/])\d+[.,]\d{2}(?![\d]|[.,/]\d)/g;

const TOTAL_LINE_RE = /(total|net\s*[àa]\s*payer|[àa]\s*payer|montant\s*(d[uû]|ttc|total)?|somme|carte\s*(bancaire|bleue)?|cb)/i;
const NOT_TOTAL_RE = /(sous[\s-]*total|total\s*ht|\bht\b|tva|[ée]conomie|remise|rendu|monnaie|esp[èe]ces|re[çc]u|points?|fid[ée]lit[ée]|article)/i;

const toNumber = (raw) => {
  const cleaned = raw.replace(/[  ]/g, '').replace(',', '.');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
};

const amountsIn = (line) => (line.match(AMOUNT_RE) || []).map(toNumber).filter((n) => n > 0 && n < 100000);

export function parseAmount(lines) {
  // 1) lignes « TOTAL / NET À PAYER / CB… » : on prend le plus grand montant parmi elles
  const candidates = [];
  lines.forEach((line, i) => {
    if (!TOTAL_LINE_RE.test(line) || NOT_TOTAL_RE.test(line)) return;
    let found = amountsIn(line);
    // le montant est parfois sur la ligne suivante
    if (found.length === 0 && lines[i + 1] && !NOT_TOTAL_RE.test(lines[i + 1])) found = amountsIn(lines[i + 1]);
    candidates.push(...found);
  });
  if (candidates.length) return Math.max(...candidates);

  // 2) à défaut, le plus grand montant du ticket (hors lignes de TVA / remise)
  const all = lines.filter((l) => !NOT_TOTAL_RE.test(l)).flatMap(amountsIn);
  return all.length ? Math.max(...all) : null;
}

export function parseDate(text, now = new Date()) {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const fr = text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})\b/);
  let y; let m; let d;
  if (iso) [, y, m, d] = iso.map(Number);
  else if (fr) {
    [, d, m, y] = fr.map(Number);
    if (y < 100) y += 2000;
  } else return null;

  const date = new Date(y, m - 1, d);
  const valid = date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
  const tooFar = date.getTime() > now.getTime() + 86400000 || y < now.getFullYear() - 3;
  if (!valid || tooFar) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

const NOT_MERCHANT_RE = /(ticket|facture|caisse|merci|bienvenue|t[ée]l|siret|siren|\bwww\b|\.com|\.fr|rue|avenue|\bav\b|\bbd\b|boulevard|\d{5}|client|date|heure|n°|\btva\b)/i;

export function parseMerchant(lines) {
  for (const line of lines.slice(0, 8)) {
    const letters = (line.match(/[A-Za-zÀ-ÿ]/g) || []).length;
    if (letters < 3 || letters / line.length < 0.6 || NOT_MERCHANT_RE.test(line)) continue;
    const name = line.replace(/[^A-Za-zÀ-ÿ0-9 '&.\-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
    // « SUPER U MARKET » -> « Super U Market »
    return name === name.toUpperCase() ? name.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase()) : name;
  }
  return '';
}

export function parseReceipt(text, now = new Date()) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return {
    amount: parseAmount(lines),
    date: parseDate(text || '', now),
    description: parseMerchant(lines),
  };
}
