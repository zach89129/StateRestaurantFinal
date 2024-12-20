import CollectionContent from "./CollectionContent";
import { Suspense } from "react";

interface PageProps {
  params: Promise<{
    collection: string;
  }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      }
    >
      <CollectionContent collection={resolvedParams.collection} />
    </Suspense>
  );
}
