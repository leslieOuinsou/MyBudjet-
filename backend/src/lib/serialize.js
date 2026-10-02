/**
 * Ajoute `_id` (alias de `id`) pour rester compatible avec le frontend MongoDB.
 * Mappe aussi les FK Prisma (*Id) vers les anciens noms de relation (user, category...).
 */
const FK_MAP = {
  userId: 'user',
  categoryId: 'category',
  walletId: 'wallet',
  bankAccountId: 'bankAccount',
};

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !(value instanceof Date) && !Array.isArray(value);
}

export function serialize(value) {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(serialize);
  if (value instanceof Date) return value;
  if (!isPlainObject(value)) return value;

  const result = {};

  for (const [key, val] of Object.entries(value)) {
    if (val === undefined) continue;
    result[key] = serialize(val);
  }

  if (result.id != null && result._id == null) {
    result._id = result.id;
  }

  for (const [fk, legacy] of Object.entries(FK_MAP)) {
    if (result[fk] != null && result[legacy] == null) {
      result[legacy] = result[fk];
    }
  }

  return result;
}

/** Récupère un id depuis req.user (objet sérialisé ou brut) */
export function userId(user) {
  if (!user) return null;
  return user.id || user._id || null;
}

export default serialize;
