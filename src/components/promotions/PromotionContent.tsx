"use client";

import { useState, useEffect } from "react";

interface PromotionContent {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function PromotionContent() {
  const [content, setContent] = useState<PromotionContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/api/promotions/content");
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        }
      } catch (error) {
        console.error("Error fetching promotion content:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  if (loading) {
    return (
      <div className="p-6 border-b border-gray-200">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!content) {
    // Fallback to default content
    return (
      <div className="p-6 border-b border-gray-200">
        <p className="text-gray-600 mt-2">
          Please join us for this upcoming event.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 border-b border-gray-200">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
        {content.title}
      </h1>
      <p className="text-gray-600 mt-2">{content.description}</p>
    </div>
  );
}
