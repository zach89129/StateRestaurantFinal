import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail, isSalesTeamEmail } from "./email";

test("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  JOHN.DOE@STATERESTAURANT.COM  "), "john.doe@staterestaurant.com");
});

test("isSalesTeamEmail is case-insensitive on email and domain", () => {
  const previous = process.env.SALES_TEAM_EMAIL_DOMAIN;
  process.env.SALES_TEAM_EMAIL_DOMAIN = "@staterestaurant.com";

  try {
    assert.equal(isSalesTeamEmail("JOHN.DOE@STATERESTAURANT.COM"), true);
    assert.equal(isSalesTeamEmail("john@example.com"), false);
  } finally {
    if (previous === undefined) {
      delete process.env.SALES_TEAM_EMAIL_DOMAIN;
    } else {
      process.env.SALES_TEAM_EMAIL_DOMAIN = previous;
    }
  }
});
