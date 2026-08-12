import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deleteVenueWithRelations,
  deleteVenuesWithRelations,
  type VenueDeleteClient,
  type VenueDeleteDb,
} from "./deleteVenue";

type Call = {
  model:
    | "customer"
    | "customerOrderGuideFeature"
    | "cartItem"
    | "venueProduct"
    | "venue"
    | "order";
  method: string;
  args: unknown;
};

function createMockDb(deletedCount = 1): {
  db: VenueDeleteClient;
  calls: Call[];
} {
  const calls: Call[] = [];

  const tx: VenueDeleteDb = {
    customer: {
      updateMany: async (args) => {
        calls.push({ model: "customer", method: "updateMany", args });
        return { count: 1 };
      },
    },
    customerOrderGuideFeature: {
      updateMany: async (args) => {
        calls.push({
          model: "customerOrderGuideFeature",
          method: "updateMany",
          args,
        });
        return { count: 1 };
      },
    },
    cartItem: {
      deleteMany: async (args) => {
        calls.push({ model: "cartItem", method: "deleteMany", args });
        return { count: 1 };
      },
    },
    venueProduct: {
      deleteMany: async (args) => {
        calls.push({ model: "venueProduct", method: "deleteMany", args });
        return { count: 1 };
      },
    },
    venue: {
      deleteMany: async (args) => {
        calls.push({ model: "venue", method: "deleteMany", args });
        return { count: deletedCount };
      },
    },
  };

  const db: VenueDeleteClient = {
    $transaction: async (fn) => fn(tx),
  };

  return { db, calls };
}

describe("deleteVenuesWithRelations", () => {
  it("returns deleted 0 without touching the db for empty ids", async () => {
    const { db, calls } = createMockDb();
    const result = await deleteVenuesWithRelations(db, []);
    assert.equal(result.deleted, 0);
    assert.equal(calls.length, 0);
  });

  it("nulls soft refs, deletes cart items and venueProduct, then deletes venue", async () => {
    const { db, calls } = createMockDb(1);
    const result = await deleteVenuesWithRelations(db, [42]);

    assert.equal(result.deleted, 1);
    assert.deepEqual(
      calls.map((c) => `${c.model}.${c.method}`),
      [
        "customer.updateMany",
        "customerOrderGuideFeature.updateMany",
        "cartItem.deleteMany",
        "venueProduct.deleteMany",
        "venue.deleteMany",
      ]
    );

    assert.deepEqual(calls[0].args, {
      where: { orderGuidePricingVenueId: { in: [42] } },
      data: { orderGuidePricingVenueId: null },
    });
    assert.deepEqual(calls[1].args, {
      where: { defaultVenueId: { in: [42] } },
      data: { defaultVenueId: null },
    });
    assert.deepEqual(calls[2].args, {
      where: { venueId: { in: [42] } },
    });
    assert.deepEqual(calls[3].args, {
      where: { trxVenueId: { in: [42] } },
    });
    assert.deepEqual(calls[4].args, {
      where: { trxVenueId: { in: [42] } },
    });
    assert.equal(
      calls.some((c) => c.model === "order"),
      false
    );
  });

  it("dedupes and filters invalid ids", async () => {
    const { db, calls } = createMockDb(2);
    const result = await deleteVenuesWithRelations(db, [
      1,
      1,
      2,
      0,
      Number.NaN,
      -5,
    ]);

    assert.equal(result.deleted, 2);
    const venueCall = calls.find(
      (c) => c.model === "venue" && c.method === "deleteMany"
    );
    assert.ok(venueCall);
    assert.deepEqual(venueCall.args, {
      where: { trxVenueId: { in: [1, 2] } },
    });
  });

  it("does not call any order model during cleanup", async () => {
    const { db, calls } = createMockDb();
    await deleteVenueWithRelations(db, 99);
    assert.equal(
      calls.some((c) => c.model === "order" || c.method.includes("order")),
      false
    );
  });
});
