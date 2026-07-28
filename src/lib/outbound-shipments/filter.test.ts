import assert from "node:assert/strict";
import test from "node:test";
import { filterOutboundShipments } from "./filter";
import {
  isAllowedOutboundShipmentImage,
  isDisallowedSvgImage,
} from "./imageValidation";
import { getRetentionCutoff, isOlderThanRetention } from "./retention";

test("filterOutboundShipments matches customer, invoice, email, and date", () => {
  const items = [
    {
      id: 1,
      customerName: "Acme Cafe",
      invoiceNumber: "INV-100",
      createdAt: "2026-07-01T12:00:00.000Z",
      createdByEmail: "alex@staterestaurant.com",
    },
    {
      id: 2,
      customerName: "Beta Bistro",
      invoiceNumber: "INV-200",
      createdAt: "2026-06-15T08:30:00.000Z",
      createdByEmail: "sam@staterestaurant.com",
    },
  ];

  assert.equal(filterOutboundShipments(items, "").length, 2);
  assert.deepEqual(
    filterOutboundShipments(items, "acme").map((item) => item.id),
    [1]
  );
  assert.deepEqual(
    filterOutboundShipments(items, "inv-200").map((item) => item.id),
    [2]
  );
  assert.deepEqual(
    filterOutboundShipments(items, "sam@").map((item) => item.id),
    [2]
  );
  assert.deepEqual(
    filterOutboundShipments(items, "2026-07").map((item) => item.id),
    [1]
  );
});

test("getRetentionCutoff subtracts six months in UTC", () => {
  const now = new Date("2026-07-27T15:00:00.000Z");
  const cutoff = getRetentionCutoff(now);
  assert.equal(cutoff.toISOString(), "2026-01-27T15:00:00.000Z");
});

test("isOlderThanRetention compares against six-month cutoff", () => {
  const now = new Date("2026-07-27T15:00:00.000Z");
  assert.equal(
    isOlderThanRetention(new Date("2026-01-26T15:00:00.000Z"), now),
    true
  );
  assert.equal(
    isOlderThanRetention(new Date("2026-01-28T15:00:00.000Z"), now),
    false
  );
});

test("blocks SVG by mime type and extension", () => {
  assert.equal(
    isDisallowedSvgImage({ name: "photo.svg", type: "image/svg+xml" }),
    true
  );
  assert.equal(
    isDisallowedSvgImage({ name: "photo.SVGZ", type: "image/png" }),
    true
  );
  assert.equal(
    isAllowedOutboundShipmentImage({ name: "photo.jpg", type: "image/jpeg" }),
    true
  );
  assert.equal(
    isAllowedOutboundShipmentImage({
      name: "photo.svg",
      type: "image/svg+xml",
    }),
    false
  );
  assert.equal(
    isAllowedOutboundShipmentImage({ name: "notes.txt", type: "text/plain" }),
    false
  );
});
