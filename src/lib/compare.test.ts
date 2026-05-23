import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canCompareSelection,
  clearCompareSelection,
  compareValuesDiffer,
  isCompareDisabled,
  isCompareSelected,
  normalizeCompareValue,
  toggleCompareSelection,
} from "./compare";

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

  it("does not add a third id when max is reached", () => {
    const state = { selectedIds: [1, 2] };
    const next = toggleCompareSelection(state, 3, 2);
    assert.deepEqual(next.selectedIds, [1, 2]);
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

  it("allows compare only when max items are selected", () => {
    assert.equal(canCompareSelection({ selectedIds: [1] }, 2), false);
    assert.equal(canCompareSelection({ selectedIds: [1, 2] }, 2), true);
  });
});
