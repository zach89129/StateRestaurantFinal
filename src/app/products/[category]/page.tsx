import CategoryContent from "./CategoryContent";

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const categoryParams = await params;
  const category = decodeURIComponent(categoryParams.category);

  return (
    <div className="min-h-screen bg-gray-50">
      <CategoryContent category={category} />
    </div>
  );
}
