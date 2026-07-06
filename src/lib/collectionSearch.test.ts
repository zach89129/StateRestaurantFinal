import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getCollectionSuggestionHighlightSegments,
  getCollectionSuggestions,
  normalizeForCollectionMatch,
} from "./collectionSearch";

const APPLE_COLLECTIONS = [
  "Apple Corer / Peeler, Parts & Accessories",
  "Apple Corer / Peeler, Tabletop",
  "Ash Tray, Glass",
  "Springform Pan",
];

describe("normalizeForCollectionMatch", () => {
  it("lowercases and replaces punctuation with spaces", () => {
    assert.equal(
      normalizeForCollectionMatch("Apple Corer / Peeler, Parts & Accessories"),
      "apple corer peeler parts accessories"
    );
  });

  it("handles apostrophes and hyphens", () => {
    assert.equal(
      normalizeForCollectionMatch("Chef's Pan - Nonstick"),
      "chef s pan nonstick"
    );
  });
});

describe("getCollectionSuggestions", () => {
  it("returns no suggestions for empty query", () => {
    assert.deepEqual(getCollectionSuggestions("", APPLE_COLLECTIONS), []);
    assert.deepEqual(getCollectionSuggestions("   ", APPLE_COLLECTIONS), []);
  });

  it("matches all query tokens regardless of punctuation", () => {
    const suggestions = getCollectionSuggestions("apple peeler", APPLE_COLLECTIONS);

    assert.deepEqual(
      suggestions.map((suggestion) => suggestion.label).sort(),
      [
        "Apple Corer / Peeler, Parts & Accessories",
        "Apple Corer / Peeler, Tabletop",
      ].sort()
    );
  });

  it("requires every token to match", () => {
    const suggestions = getCollectionSuggestions(
      "apple corer tabletop",
      APPLE_COLLECTIONS
    );

    assert.deepEqual(
      suggestions.map((suggestion) => suggestion.label),
      ["Apple Corer / Peeler, Tabletop"]
    );
  });

  it("ranks prefix matches ahead of substring-only matches", () => {
    const collections = [
      "Peeler, Tabletop",
      "Apple Corer / Peeler, Tabletop",
    ];

    const suggestions = getCollectionSuggestions("apple peeler", collections);

    assert.equal(suggestions[0]?.label, "Apple Corer / Peeler, Tabletop");
  });

  it("respects the suggestion limit", () => {
    const collections = Array.from({ length: 10 }, (_, index) => {
      return `Apple Peeler ${index + 1}`;
    });

    const suggestions = getCollectionSuggestions("apple peeler", collections, 3);

    assert.equal(suggestions.length, 3);
  });
});

describe("getCollectionSuggestionHighlightSegments", () => {
  it("bolds matched query tokens in the original collection string", () => {
    const segments = getCollectionSuggestionHighlightSegments(
      "apple peeler",
      "Apple Corer / Peeler, Parts & Accessories"
    );

    assert.deepEqual(segments, [
      { text: "Apple", bold: true },
      { text: " Corer / ", bold: false },
      { text: "Peeler", bold: true },
      { text: ", Parts & Accessories", bold: false },
    ]);
  });

  it("returns plain text when there are no query tokens", () => {
    assert.deepEqual(
      getCollectionSuggestionHighlightSegments("", "Springform Pan"),
      [{ text: "Springform Pan", bold: false }]
    );
  });
});
