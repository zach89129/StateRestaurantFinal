import assert from "node:assert/strict";
import test from "node:test";
import {
  isEquipmentCategory,
  isEquipmentPricingRestricted,
} from "./equipmentPricing";

test("isEquipmentCategory matches equipment case-insensitively", () => {
  assert.equal(isEquipmentCategory("Equipment"), true);
  assert.equal(isEquipmentCategory(" equipment "), true);
  assert.equal(isEquipmentCategory("Smallwares"), false);
});

test("isEquipmentCategory matches Light equipment contract only", () => {
  assert.equal(isEquipmentCategory("Light equipment contract"), true);
  assert.equal(isEquipmentCategory("Light Equipment Contract"), true);
  assert.equal(isEquipmentCategory("Light equipment"), false);
});

test("isEquipmentPricingRestricted allows dead inventory equipment", () => {
  assert.equal(isEquipmentPricingRestricted("equipment", true), false);
  assert.equal(isEquipmentPricingRestricted("equipment", false), true);
  assert.equal(isEquipmentPricingRestricted("equipment"), true);
  assert.equal(isEquipmentPricingRestricted("smallwares", true), false);
});
