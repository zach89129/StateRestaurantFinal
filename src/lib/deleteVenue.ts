export type VenueDeleteDb = {
  customer: {
    updateMany: (args: {
      where: { orderGuidePricingVenueId: { in: number[] } };
      data: { orderGuidePricingVenueId: null };
    }) => Promise<{ count: number }>;
  };
  customerOrderGuideFeature: {
    updateMany: (args: {
      where: { defaultVenueId: { in: number[] } };
      data: { defaultVenueId: null };
    }) => Promise<{ count: number }>;
  };
  cartItem: {
    deleteMany: (args: {
      where: { venueId: { in: number[] } };
    }) => Promise<{ count: number }>;
  };
  venueProduct: {
    deleteMany: (args: {
      where: { trxVenueId: { in: number[] } };
    }) => Promise<{ count: number }>;
  };
  venue: {
    deleteMany: (args: {
      where: { trxVenueId: { in: number[] } };
    }) => Promise<{ count: number }>;
  };
};

export type VenueDeleteClient = {
  $transaction: <T>(fn: (tx: VenueDeleteDb) => Promise<T>) => Promise<T>;
};

function normalizeVenueIds(trxVenueIds: number[]): number[] {
  return [
    ...new Set(
      trxVenueIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && id > 0)
    ),
  ];
}

export async function deleteVenuesWithRelations(
  db: VenueDeleteClient,
  trxVenueIds: number[]
): Promise<{ deleted: number }> {
  const ids = normalizeVenueIds(trxVenueIds);
  if (ids.length === 0) {
    return { deleted: 0 };
  }

  return db.$transaction(async (tx) => {
    await tx.customer.updateMany({
      where: { orderGuidePricingVenueId: { in: ids } },
      data: { orderGuidePricingVenueId: null },
    });

    await tx.customerOrderGuideFeature.updateMany({
      where: { defaultVenueId: { in: ids } },
      data: { defaultVenueId: null },
    });

    await tx.cartItem.deleteMany({
      where: { venueId: { in: ids } },
    });

    await tx.venueProduct.deleteMany({
      where: { trxVenueId: { in: ids } },
    });

    const result = await tx.venue.deleteMany({
      where: { trxVenueId: { in: ids } },
    });

    return { deleted: result.count };
  });
}

export async function deleteVenueWithRelations(
  db: VenueDeleteClient,
  trxVenueId: number
): Promise<{ deleted: number }> {
  return deleteVenuesWithRelations(db, [trxVenueId]);
}
