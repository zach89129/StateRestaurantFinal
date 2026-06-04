import assert from "node:assert/strict";
import test from "node:test";
import { normalizeEmail, isSalesTeamEmail } from "./email";

test("normalizeEmail trims and lowercases", () => {
  assert.equal(
    normalizeEmail("  USER@EXAMPLE-TEST.ORG  "),
    "user@example-test.org"
  );
});

test("isSalesTeamEmail is case-insensitive on email and domain", () => {
  const previous = process.env.SALES_TEAM_EMAIL_DOMAIN;
  process.env.SALES_TEAM_EMAIL_DOMAIN = "@acme-sales.test";

  try {
    assert.equal(isSalesTeamEmail("USER@ACME-SALES.TEST"), true);
    assert.equal(isSalesTeamEmail("user@other-domain.test"), false);
  } finally {
    if (previous === undefined) {
      delete process.env.SALES_TEAM_EMAIL_DOMAIN;
    } else {
      process.env.SALES_TEAM_EMAIL_DOMAIN = previous;
    }
  }
});
