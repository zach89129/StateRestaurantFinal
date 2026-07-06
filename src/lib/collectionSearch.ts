export interface CollectionSuggestion {
  label: string;
  normalized: string;
}

export interface HighlightSegment {
  text: string;
  bold: boolean;
}

const PUNCTUATION_PATTERN = /[/,'"&\-()]+/g;

export function normalizeForCollectionMatch(value: string): string {
  return value
    .toLowerCase()
    .replace(PUNCTUATION_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getQueryTokens(query: string): string[] {
  const normalizedQuery = normalizeForCollectionMatch(query);
  if (!normalizedQuery) {
    return [];
  }

  return normalizedQuery.split(" ").filter(Boolean);
}

function countWordBoundaryMatches(tokens: string[], normalizedCollection: string): number {
  const words = normalizedCollection.split(" ").filter(Boolean);

  return tokens.reduce((count, token) => {
    if (words.some((word) => word === token || word.startsWith(token))) {
      return count + 1;
    }

    return count;
  }, 0);
}

function compareSuggestions(
  a: CollectionSuggestion,
  b: CollectionSuggestion,
  normalizedQuery: string,
  tokens: string[]
): number {
  const aStartsWithQuery = a.normalized.startsWith(normalizedQuery) ? 1 : 0;
  const bStartsWithQuery = b.normalized.startsWith(normalizedQuery) ? 1 : 0;

  if (aStartsWithQuery !== bStartsWithQuery) {
    return bStartsWithQuery - aStartsWithQuery;
  }

  const aWordBoundaryMatches = countWordBoundaryMatches(tokens, a.normalized);
  const bWordBoundaryMatches = countWordBoundaryMatches(tokens, b.normalized);

  if (aWordBoundaryMatches !== bWordBoundaryMatches) {
    return bWordBoundaryMatches - aWordBoundaryMatches;
  }

  if (a.label.length !== b.label.length) {
    return a.label.length - b.label.length;
  }

  return a.label.localeCompare(b.label);
}

export function getCollectionSuggestions(
  query: string,
  collections: string[],
  limit = 8
): CollectionSuggestion[] {
  const normalizedQuery = normalizeForCollectionMatch(query);
  const tokens = getQueryTokens(query);

  if (tokens.length === 0) {
    return [];
  }

  const matches = collections
    .filter((collection) => {
      const normalizedCollection = normalizeForCollectionMatch(collection);
      return tokens.every((token) => normalizedCollection.includes(token));
    })
    .map((collection) => ({
      label: collection,
      normalized: normalizeForCollectionMatch(collection),
    }))
    .sort((a, b) => compareSuggestions(a, b, normalizedQuery, tokens));

  return matches.slice(0, limit);
}

const TOKEN_START_PATTERN = /[\s/,'"&\-()]/;

function findFlexibleTokenMatch(
  collection: string,
  token: string,
  fromIndex: number
): { start: number; end: number } | null {
  for (let start = fromIndex; start < collection.length; start += 1) {
    if (TOKEN_START_PATTERN.test(collection[start])) {
      continue;
    }

    for (let end = start + 1; end <= collection.length; end += 1) {
      const normalizedSlice = normalizeForCollectionMatch(collection.slice(start, end));

      if (normalizedSlice.length > token.length) {
        break;
      }

      if (normalizedSlice === token) {
        return { start, end };
      }
    }
  }

  return null;
}

export function getCollectionSuggestionHighlightSegments(
  query: string,
  collection: string
): HighlightSegment[] {
  const tokens = getQueryTokens(query);

  if (tokens.length === 0) {
    return [{ text: collection, bold: false }];
  }

  const highlightedRanges: Array<{ start: number; end: number }> = [];

  for (const token of tokens) {
    let searchStart = 0;

    while (searchStart < collection.length) {
      const match = findFlexibleTokenMatch(collection, token, searchStart);

      if (!match) {
        break;
      }

      const overlapsExisting = highlightedRanges.some(
        (existing) =>
          match.start < existing.end && match.end > existing.start
      );

      if (!overlapsExisting) {
        highlightedRanges.push(match);
      }

      searchStart = match.end;
    }
  }

  if (highlightedRanges.length === 0) {
    return [{ text: collection, bold: false }];
  }

  highlightedRanges.sort((a, b) => a.start - b.start);

  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const range of highlightedRanges) {
    if (cursor < range.start) {
      segments.push({
        text: collection.slice(cursor, range.start),
        bold: false,
      });
    }

    segments.push({
      text: collection.slice(range.start, range.end),
      bold: true,
    });

    cursor = range.end;
  }

  if (cursor < collection.length) {
    segments.push({
      text: collection.slice(cursor),
      bold: false,
    });
  }

  return segments.filter((segment) => segment.text.length > 0);
}
