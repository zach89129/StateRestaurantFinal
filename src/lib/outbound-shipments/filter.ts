export type OutboundShipmentListItem = {
  id: number;
  customerName: string;
  invoiceNumber: string;
  createdAt: string;
  createdByEmail: string;
};

export function filterOutboundShipments(
  items: OutboundShipmentListItem[],
  query: string
): OutboundShipmentListItem[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return items;
  }

  return items.filter((item) => {
    return (
      item.customerName.toLowerCase().includes(normalized) ||
      item.invoiceNumber.toLowerCase().includes(normalized) ||
      item.createdByEmail.toLowerCase().includes(normalized) ||
      item.createdAt.toLowerCase().includes(normalized)
    );
  });
}
