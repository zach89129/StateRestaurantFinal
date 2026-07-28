import { del, get, put } from "@vercel/blob";

function getOutboundBlobToken(): string {
  const token = process.env.OUTBOUND_ORDER_READ_WRITE_TOKEN?.trim();

  if (!token) {
    throw new Error("OUTBOUND_ORDER_READ_WRITE_TOKEN is not configured");
  }

  return token;
}

function blobOptions() {
  return { token: getOutboundBlobToken() };
}

export async function putOutboundShipmentBlob(
  pathname: string,
  body: File | Buffer | Blob,
  contentType?: string,
) {
  return put(pathname, body, {
    access: "private",
    addRandomSuffix: false,
    contentType,
    ...blobOptions(),
  });
}

export async function getOutboundShipmentBlob(
  pathname: string,
  options?: { ifNoneMatch?: string },
) {
  return get(pathname, {
    access: "private",
    ifNoneMatch: options?.ifNoneMatch,
    ...blobOptions(),
  });
}

export async function deleteOutboundShipmentBlobs(pathnames: string[]) {
  if (pathnames.length === 0) return;
  await del(pathnames, blobOptions());
}

export function buildOutboundShipmentBlobPathname(
  shipmentId: number,
  originalFileName: string,
): string {
  const ext = safeImageExtension(originalFileName);
  return `outbound-shipments/${shipmentId}/${crypto.randomUUID()}.${ext}`;
}

function safeImageExtension(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "jpg";
  if (!/^[a-z0-9]{1,8}$/.test(ext)) {
    return "jpg";
  }
  return ext;
}
