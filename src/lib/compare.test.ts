import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCompareSelection,
  clearCompareSelection,
  compareFieldValuesDiffer,
  compareValuesDiffer,
  formatCompareDescription,
  isCompareDisabled,
  isCompareSelected,
  normalizeCompareValue,
  shouldShowCompareRow,
  toggleCompareSelection,
} from "./compare";

describe("formatCompareDescription", () => {
  it("prefers long description over short description", () => {
    assert.equal(
      formatCompareDescription({
        id: 1,
        sku: "SKU",
        title: "Title",
        description: "Short",
        longDescription: "Long detailed description",
        manufacturer: null,
      }),
      "Long detailed description"
    );
  });

  it("falls back to short description when long is empty", () => {
    assert.equal(
      formatCompareDescription({
        id: 1,
        sku: "SKU",
        title: "Title",
        description: "Short",
        longDescription: null,
        manufacturer: null,
      }),
      "Short"
    );
  });
});

describe("normalizeCompareValue", () => {
  it("normalizes strings with trim and lowercase", () => {
    assert.equal(normalizeCompareValue("  Suggested  "), "suggested");
  });

  it("returns empty string for null and undefined", () => {
    assert.equal(normalizeCompareValue(null), "");
    assert.equal(normalizeCompareValue(undefined), "");
  });

  it("converts numbers to strings", () => {
    assert.equal(normalizeCompareValue(12), "12");
  });
});

describe("compareValuesDiffer", () => {
  it("treats equivalent values as same after normalization", () => {
    assert.equal(compareValuesDiffer("Suggested", "suggested"), false);
    assert.equal(compareValuesDiffer(null, ""), false);
    assert.equal(compareValuesDiffer("Alpha", "Beta"), true);
  });
});

describe("toggleCompareSelection", () => {
  it("adds an id when under max", () => {
    const next = toggleCompareSelection({ selectedIds: [1] }, 2, 2);
    assert.deepEqual(next.selectedIds, [1, 2]);
  });

  it("removes an id when already selected", () => {
    const next = toggleCompareSelection({ selectedIds: [1, 2] }, 1, 2);
    assert.deepEqual(next.selectedIds, [2]);
  });

  it("does not add a fourth id when max is 3", () => {
    const state = { selectedIds: [1, 2, 3] };
    const next = toggleCompareSelection(state, 4, 3);
    assert.deepEqual(next.selectedIds, [1, 2, 3]);
  });
});

describe("compare selection helpers", () => {
  it("clears all selected ids", () => {
    assert.deepEqual(clearCompareSelection(), { selectedIds: [] });
  });

  it("tracks selected and disabled state", () => {
    const state = { selectedIds: [1, 2] };
    assert.equal(isCompareSelected(state, 1), true);
    assert.equal(isCompareDisabled(state, 3, 2), true);
    assert.equal(isCompareDisabled(state, 1, 2), false);
  });

  it("allows compare only when between min and max items are selected", () => {
    assert.equal(canCompareSelection({ selectedIds: [1] }, 2, 3), false);
    assert.equal(canCompareSelection({ selectedIds: [1, 2] }, 2, 3), true);
    assert.equal(canCompareSelection({ selectedIds: [1, 2, 3] }, 2, 3), true);
  });
});

describe("compareFieldValuesDiffer", () => {
  it("returns false when all values match", () => {
    assert.equal(compareFieldValuesDiffer(["A", "a", "A"]), false);
  });

  it("returns true when any value differs", () => {
    assert.equal(compareFieldValuesDiffer(["A", "B", "A"]), true);
  });
});

describe("shouldShowCompareRow", () => {
  const product = {
    id: 1,
    sku: "SKU",
    title: "Title",
    description: "Desc",
    manufacturer: null,
  };

  it("shows row when any product has a value", () => {
    assert.equal(
      shouldShowCompareRow(
        [product, { ...product, id: 2, description: null }],
        "description"
      ),
      true
    );
  });
});
