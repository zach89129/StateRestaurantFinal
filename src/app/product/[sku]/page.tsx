import { notFound } from "next/navigation";
import ProductDetail from "@/components/products/ProductDetail";
import { Product } from "@/types/product";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{
    sku: string;
  }>;
}

export default async function ProductPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { sku } = resolvedParams;

  // Fetch product data
  const product = await prisma.product.findFirst({
    where: {
      sku: sku,
    },
    include: {
      images: true,
    },
  });

  if (!product) {
    notFound();
  }

  const formattedProduct: Product = {
    id: Number(product.id),
    sku: product.sku,
    title: product.title,
    description: product.description || "",
    manufacturer: product.manufacturer || "",
    category: product.category || "",
    uom: product.uom || "",
    qtyAvailable: product.qtyAvailable ? Number(product.qtyAvailable) : 0,
    aqcat: product.aqcat || "",
    pattern: product.pattern || "",
    quickship: product.quickship || false,
    images: product.images.map((img) => ({ url: img.url })),
  };

  return <ProductDetail product={formattedProduct} />;
}
