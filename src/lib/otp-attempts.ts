type AttemptBucket = { count: number; resetAt: number };

const failedAttempts = new Map<string, AttemptBucket>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isOtpLocked(email: string): boolean {
  const entry = failedAttempts.get(normalizeEmail(email));
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedAttempts.delete(normalizeEmail(email));
    return false;
  }
  return entry.count >= MAX_ATTEMPTS;
}

export function recordFailedOtpAttempt(email: string) {
  const key = normalizeEmail(email);
  const now = Date.now();
  const entry = failedAttempts.get(key);

  if (!entry || now > entry.resetAt) {
    failedAttempts.set(key, { count: 1, resetAt: now + LOCKOUT_MS });
    return;
  }

  entry.count += 1;
}

export function clearOtpAttempts(email: string) {
  failedAttempts.delete(normalizeEmail(email));
}
