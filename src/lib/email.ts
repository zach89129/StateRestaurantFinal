import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function findCustomerByEmail<T extends Prisma.CustomerDefaultArgs>(
  email: string,
  args?: T
): Promise<Prisma.CustomerGetPayload<T> | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const findArgs = (args ?? {}) as T;

  const direct = await prisma.customer.findUnique({
    ...findArgs,
    where: { email: normalized },
  });
  if (direct) {
    return direct as Prisma.CustomerGetPayload<T>;
  }

  const rows = await prisma.$queryRaw<{ trx_customer_id: number }[]>`
    SELECT trx_customer_id FROM customers WHERE LOWER(email) = ${normalized} LIMIT 1
  `;

  const trxCustomerId = rows[0]?.trx_customer_id;
  if (trxCustomerId == null) {
    return null;
  }

  return prisma.customer.findUnique({
    ...findArgs,
    where: { trxCustomerId },
  }) as Promise<Prisma.CustomerGetPayload<T> | null>;
}

export function isSalesTeamEmail(email: string): boolean {
  const domain = (process.env.SALES_TEAM_EMAIL_DOMAIN ?? "").trim().toLowerCase();
  if (!domain) return false;
  return normalizeEmail(email).includes(domain);
}
