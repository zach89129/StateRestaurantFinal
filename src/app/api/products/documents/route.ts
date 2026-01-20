import { NextRequest, NextResponse } from "next/server";

interface AqDocument {
  name?: string;
  url?: string;
  mediaType?: string;
  mimeType?: string;
}

interface AqProduct {
  documents?: AqDocument[];
}

interface AqResponse {
  data?: AqProduct[];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const aqid = searchParams.get("aqid");

  if (!aqid) {
    return NextResponse.json({ error: "Missing aqid" }, { status: 400 });
  }

  const apiKey = process.env.AQ_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AQ_API_KEY not configured" },
      { status: 500 }
    );
  }

  const aqUrl = `https://api.aq-fes.com/products-api/products/${encodeURIComponent(
    aqid
  )}?subscription-key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(aqUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 * 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: response.status }
      );
    }

    const data: AqResponse = await response.json();
    const documents = Array.isArray(data.data)
      ? data.data[0]?.documents ?? []
      : [];

    const sanitizedDocuments = documents
      .filter((doc): doc is AqDocument & { url: string } => Boolean(doc.url))
      .map((doc) => ({
        name: doc.name ?? "Document",
        url: doc.url,
        mediaType: doc.mediaType ?? null,
        mimeType: doc.mimeType ?? null,
      }));

    return NextResponse.json({ documents: sanitizedDocuments });
  } catch (error) {
    console.error("Error fetching AQ documents:", error);
    return NextResponse.json(
      { error: "Failed to fetch documents" },
      { status: 500 }
    );
  }
}
