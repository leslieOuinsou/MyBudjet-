// Extrait montant, date et commerçant du texte brut lu sur un ticket de caisse (OCR).
// Fonction pure, sans dépendance : testable seule.

// 12,50 · 1 234,56 · 1234.56 — jamais une date comme 12.10.2026 ni un grand nombre sans décimales
const AMOUNT_RE = /(?<![\d.,/])\d{1,3}(?:[  ]\d{3})*[.,]\d{2}(?![\d]|[.,/]\d)|(?<![\d.,/])\d+[.,]\d{2}(?![\d]|[.,/]\d)/g;

const TOTAL_LINE_RE = /(total|ttc|net\s*[àa]\s*payer|[àa]\s*payer|montant\s*(d[uû]|ttc|total)?|somme|carte\s*(bancaire|bleue)?|cb)/i;
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

const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MONTHS_ASCII = ['janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre'];
const DUE_RE = /(date\s+d['’]?\s*[ée]ch[ée]ance|[ée]ch[ée]ance|[àa]\s+payer\s+avant|payable\s+(?:avant\s+)?le|[àa]\s+r[ée]gler\s+avant|date\s+limite|due\s+date|pr[ée]l[èe]vement\s+(?:le|pr[ée]vu))/i;

// Date d'échéance : 15/11/2026, 15.11.26, 15 novembre 2026 ou 2026-11-15 (peut être dans le futur)
function findDate(text) {
  const iso = text.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
  const num = text.match(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4}|\d{2})\b/);
  const word = text.match(/\b(\d{1,2})(?:er)?\s+([A-Za-zéûÉ]+)\s+(20\d{2})\b/);
  let y; let m; let d;
  if (iso) [, y, m, d] = iso.map(Number);
  else if (num) { [, d, m, y] = num.map(Number); if (y < 100) y += 2000; }
  else if (word) {
    const name = word[2].toLowerCase();
    const idx = MONTHS.indexOf(name) >= 0 ? MONTHS.indexOf(name) : MONTHS_ASCII.indexOf(name);
    if (idx < 0) return null;
    d = Number(word[1]); m = idx + 1; y = Number(word[3]);
  } else return null;
  const date = new Date(y, m - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function parseDueDate(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i += 1) {
    if (!DUE_RE.test(lines[i])) continue;
    // la date est sur la même ligne ou sur la suivante
    const found = findDate(lines[i]) || (lines[i + 1] ? findDate(lines[i + 1]) : null);
    if (found) return found;
  }
  return null;
}

/** Facture : fournisseur, montant à payer, date d'échéance (si trouvée). */
export function parseInvoice(text) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return { name: parseMerchant(lines), amount: parseAmount(lines), dueDate: parseDueDate(text) };
}

export function parseReceipt(text, now = new Date()) {
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return {
    amount: parseAmount(lines),
    date: parseDate(text || '', now),
    description: parseMerchant(lines),
  };
}
