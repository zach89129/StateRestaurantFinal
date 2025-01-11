// Generate a new API key (use this when creating new API keys)
export function generateApiKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Hash an API key for storage
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(
    apiKey + (process.env.API_KEY_SALT || "default-salt")
  );
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Verify an API key against a stored hash
export async function verifyApiKey(
  apiKey: string,
  storedHash: string
): Promise<boolean> {
  const hashedKey = await hashApiKey(apiKey);
  return hashedKey === storedHash;
}
