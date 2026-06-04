import { normalizeEmail } from "./email";

function parseSuperuserEmails(raw: string): Set<string> {
  const emails = raw
    .split(/[\n,]+/)
    .map((v) => v.trim())
    .filter(Boolean)
    .map(normalizeEmail);

  return new Set(emails);
}

let cached: { raw: string; set: Set<string> } | null = null;

function getSuperuserEmailSet(): Set<string> {
  const raw = process.env.SUPERUSER_EMAILS ?? "";

  if (cached && cached.raw === raw) {
    return cached.set;
  }

  const set = parseSuperuserEmails(raw);
  cached = { raw, set };
  return set;
}

export function isSuperuserEmail(email: string): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return getSuperuserEmailSet().has(normalized);
}
