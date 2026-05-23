import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { catalogProductToComparable } from "./catalogCompare";

describe("catalogProductToComparable", () => {
  it("maps catalog product fields to comparable product", () => {
    const result = catalogProductToComparable({
      trx_product_id: 42,
      sku: "ABC-123",
      title: "Test Product",
      description: "Short",
      longDescription: "Long description",
      manufacturer: "ACME",
      category: "China",
      uom: "EA",
      qtyAvailable: 10,
      aqcat: "Plate",
      images: [{ url: "https://example.com/image.jpg" }],
    });

    assert.equal(result.id, 42);
    assert.equal(result.imageUrl, "https://example.com/image.jpg");
    assert.equal(result.longDescription, "Long description");
    assert.equal(result.price, null);
    assert.equal(result.orderGuideQuality, undefined);
  });
});
