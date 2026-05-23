interface DetailSectionProps {
  title: string;
  content: string;
}

export default function DetailSection({ title, content }: DetailSectionProps) {
  const isNotAvailable =
    content === "Information not available" ||
    content === "Not available from manufacturer" ||
    !content ||
    content.trim() === "";

  const cleanContent = (text: string) => {
    return text
      .replace(/\*\*/g, "")
      .replace(/^###\s+\d+\.\s*/gm, "")
      .replace(/^###\s+/gm, "")
      .trim();
  };

  return (
    <div className="mb-4 last:mb-0">
      <h4 className="text-sm font-semibold text-gray-900 mb-2 pb-1 border-b border-gray-200">
        {title}
      </h4>
      <div
        className={`text-sm leading-relaxed ${
          isNotAvailable ? "text-gray-500 italic" : "text-gray-700"
        }`}
        style={{ whiteSpace: "pre-line" }}
      >
        {isNotAvailable ? "Information not available" : cleanContent(content)}
      </div>
    </div>
  );
}
