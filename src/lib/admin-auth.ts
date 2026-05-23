import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";

export async function requireSuperuser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isSuperuser) {
    throw new Error("Unauthorized");
  }
  return session;
}
