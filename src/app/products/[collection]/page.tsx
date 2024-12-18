import CollectionContent from "./CollectionContent";

interface PageProps {
  params: Promise<{
    collection: string;
  }>;
}

export default async function CollectionPage({ params }: PageProps) {
  const resolvedParams = await params;
  return <CollectionContent collection={resolvedParams.collection} />;
}
