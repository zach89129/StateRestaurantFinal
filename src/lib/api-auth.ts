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
  try {
    const salt = process.env.API_KEY_SALT || "default-salt";

    // Use Web Crypto API which is supported in Edge Runtime
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey + salt);

    // Use the subtle crypto API which is available in both browser and Edge Runtime
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const result = hashArray
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    return result;
  } catch (error) {
    console.error("[API-AUTH] Error in hashApiKey:", error);
    throw error;
  }
}

// Verify an API key against a stored hash
export async function verifyApiKey(
  apiKey: string,
  storedHash: string
): Promise<boolean> {
  const hashedKey = await hashApiKey(apiKey);
  return hashedKey === storedHash;
}
