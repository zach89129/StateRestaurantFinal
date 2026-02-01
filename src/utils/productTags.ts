import fs from "fs";
import path from "path";

type TagMapping = Map<string, string>;

let tagMappingCache: TagMapping | null = null;

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function loadTagMapping(): TagMapping {
  if (tagMappingCache) {
    return tagMappingCache;
  }

  const csvPath = path.join(process.cwd(), "src/data/aqcat-tags.csv");
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");

  const mapping = new Map<string, string>();

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = parseCsvLine(line);

    if (parts.length < 2) continue;

    const aqcat = parts[0];
    const tags = parts
      .slice(1)
      .filter((tag) => tag.length > 0)
      .map((tag) => tag.toLowerCase());

    if (aqcat && tags.length > 0) {
      const uniqueTags = [...new Set(tags)];
      mapping.set(aqcat.toLowerCase(), uniqueTags.join(", "));
    }
  }

  tagMappingCache = mapping;
  return mapping;
}

export function getTagsForAqcat(aqcat: string | null | undefined): string {
  if (!aqcat) {
    return "";
  }

  const mapping = loadTagMapping();
  const normalizedAqcat = aqcat.toLowerCase().trim();

  return mapping.get(normalizedAqcat) || "";
}
