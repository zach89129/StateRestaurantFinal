import { OUTBOUND_SHIPMENT_RETENTION_MONTHS } from "./constants";

export function getRetentionCutoff(now: Date = new Date()): Date {
  const cutoff = new Date(now.getTime());
  cutoff.setUTCMonth(cutoff.getUTCMonth() - OUTBOUND_SHIPMENT_RETENTION_MONTHS);
  return cutoff;
}

export function isOlderThanRetention(
  createdAt: Date,
  now: Date = new Date()
): boolean {
  return createdAt.getTime() < getRetentionCutoff(now).getTime();
}
