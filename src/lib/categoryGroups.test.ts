import assert from "node:assert/strict";
import test from "node:test";
import {
  encodeExpandedCategoryFilter,
  expandCategoryFilter,
  getCategoryNavSlug,
  getDisplayCategories,
  getDisplayCategoryLabel,
  isDisplayCategorySelected,
  toggleDisplayCategoryInFilter,
} from "./categoryGroups";

test("getDisplayCategories hides Light equipment contract", () => {
  const categories = [
    "Smallwares",
    "Light equipment",
    "Light equipment contract",
    "Equipment",
  ];

  assert.deepEqual(getDisplayCategories(categories), [
    "Smallwares",
    "Light equipment",
    "Equipment",
  ]);
});

test("expandCategoryFilter expands Light equipment to both categories", () => {
  assert.deepEqual(expandCategoryFilter(["Light equipment"]), [
    "Light equipment",
    "Light equipment contract",
  ]);
});

test("expandCategoryFilter expands contract slug case-insensitively", () => {
  assert.deepEqual(expandCategoryFilter(["Light Equipment Contract"]), [
    "Light equipment",
    "Light equipment contract",
  ]);
});

test("getDisplayCategoryLabel maps contract to Light equipment", () => {
  assert.equal(
    getDisplayCategoryLabel("Light equipment contract"),
    "Light equipment"
  );
});

test("getCategoryNavSlug builds light-equipment slug", () => {
  assert.equal(getCategoryNavSlug("Light equipment"), "light-equipment");
});

test("toggleDisplayCategoryInFilter selects and clears grouped categories", () => {
  const selected = toggleDisplayCategoryInFilter("Light equipment", []);
  assert.equal(selected.length, 2);
  assert.equal(isDisplayCategorySelected("Light equipment", selected), true);

  const cleared = toggleDisplayCategoryInFilter("Light equipment", selected);
  assert.deepEqual(cleared, []);
  assert.equal(isDisplayCategorySelected("Light equipment", cleared), false);
});

test("encodeExpandedCategoryFilter encodes expanded categories", () => {
  const encoded = encodeExpandedCategoryFilter(["Light equipment"]);
  const decoded = encoded.split(",").map((value) => atob(value));

  assert.deepEqual(decoded, [
    "Light equipment",
    "Light equipment contract",
  ]);
});
