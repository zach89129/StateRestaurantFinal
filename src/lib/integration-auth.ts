import { NextRequest, NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/api-auth";

export async function verifyIntegrationApiKey(
  request: NextRequest,
): Promise<boolean> {
  const apiKey = request.headers.get("x-api-key");
  const storedHash = process.env.API_KEY_HASH;
  if (!apiKey || !storedHash) return false;

  const cleanApiKey = apiKey.trim().replace(/^["'](.*)["']$/, "$1");
  try {
    return await verifyApiKey(cleanApiKey, storedHash);
  } catch {
    return false;
  }
}

export function integrationAuthUnauthorized() {
  return NextResponse.json(
    { success: false, error: "Invalid or missing API key" },
    { status: 401 },
  );
}

export async function requireIntegrationApiKey(request: NextRequest) {
  const valid = await verifyIntegrationApiKey(request);
  if (!valid) {
    return integrationAuthUnauthorized();
  }
  return null;
}
