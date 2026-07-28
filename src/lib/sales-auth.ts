import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function requireSalesTeam() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSalesTeam) {
    throw new Error("Unauthorized");
  }
  return session;
}
