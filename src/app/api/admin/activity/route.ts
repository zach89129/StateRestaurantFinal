import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/auth-options";

export async function GET() {
  try {
    // Check if user is authenticated and is superuser
    const session = await getServerSession(authOptions);

    if (!session?.user?.isSuperuser) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    // Fetch activity logs, ordered by most recent first
    const logs = await prisma.userActivityLog.findMany({
      orderBy: {
        TIMESTAMP: "desc",
      },
    });

    return new NextResponse(JSON.stringify(logs), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching activity logs:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500 }
    );
  }
}
