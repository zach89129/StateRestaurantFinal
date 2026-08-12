import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  buildVenueNamesByEmail,
  enrichActivityLogs,
  filterActivityLogsByVenue,
  formatActivityVenueLabel,
  parseVenueFilter,
} from "./activityLogs";

describe("parseVenueFilter", () => {
  it("accepts has and none", () => {
    assert.equal(parseVenueFilter("has"), "has");
    assert.equal(parseVenueFilter("none"), "none");
  });

  it("defaults invalid values to all", () => {
    assert.equal(parseVenueFilter(null), "all");
    assert.equal(parseVenueFilter(""), "all");
    assert.equal(parseVenueFilter("maybe"), "all");
  });
});

describe("buildVenueNamesByEmail", () => {
  it("normalizes emails and dedupes venue names", () => {
    const map = buildVenueNamesByEmail([
      {
        email: "  A@Example.com ",
        venueNames: [" Main Hall ", "Kitchen", "Main Hall"],
      },
      {
        email: "empty@example.com",
        venueNames: ["  ", ""],
      },
    ]);

    assert.deepEqual(map.get("a@example.com"), ["Main Hall", "Kitchen"]);
    assert.equal(map.has("empty@example.com"), false);
  });
});

describe("enrichActivityLogs", () => {
  it("attaches venue names and hasVenue flags", () => {
    const venueNamesByEmail = buildVenueNamesByEmail([
      {
        email: "venue@example.com",
        venueNames: ["State Kitchen"],
      },
    ]);
    const enriched = enrichActivityLogs(
      [
        {
          id: 1,
          email: "Venue@Example.com",
          TIMESTAMP: "2026-01-01T00:00:00.000Z",
        },
        {
          id: 2,
          email: "none@example.com",
          TIMESTAMP: "2026-01-02T00:00:00.000Z",
        },
      ],
      venueNamesByEmail
    );

    assert.deepEqual(enriched, [
      {
        id: 1,
        email: "Venue@Example.com",
        TIMESTAMP: "2026-01-01T00:00:00.000Z",
        hasVenue: true,
        venueNames: ["State Kitchen"],
      },
      {
        id: 2,
        email: "none@example.com",
        TIMESTAMP: "2026-01-02T00:00:00.000Z",
        hasVenue: false,
        venueNames: [],
      },
    ]);
  });
});

describe("filterActivityLogsByVenue", () => {
  const logs = [
    {
      id: 1,
      email: "a@example.com",
      TIMESTAMP: null,
      hasVenue: true,
      venueNames: ["Venue A"],
    },
    {
      id: 2,
      email: "b@example.com",
      TIMESTAMP: null,
      hasVenue: false,
      venueNames: [],
    },
  ];

  it("returns all for all filter", () => {
    assert.equal(filterActivityLogsByVenue(logs, "all").length, 2);
  });

  it("returns only venue-attached logs for has", () => {
    assert.deepEqual(filterActivityLogsByVenue(logs, "has"), [logs[0]]);
  });

  it("returns only unattached logs for none", () => {
    assert.deepEqual(filterActivityLogsByVenue(logs, "none"), [logs[1]]);
  });
});

describe("formatActivityVenueLabel", () => {
  it("formats attached and unattached venues", () => {
    assert.equal(formatActivityVenueLabel([]), "No venue");
    assert.equal(
      formatActivityVenueLabel(["State Kitchen", "Bar"]),
      "State Kitchen, Bar"
    );
  });
});
