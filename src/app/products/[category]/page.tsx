import CategoryContent from "./CategoryContent";

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const categoryParams = await params;
  const category = decodeURIComponent(categoryParams.category)
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50">
      <CategoryContent category={category} />
    </div>
  );
}
