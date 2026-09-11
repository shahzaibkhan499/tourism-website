import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

// Login history for the current user (from AuditLog "LOGIN" entries)
export async function GET() {
  try {
    const user = await requireUser();

    const logs = await prisma.auditLog.findMany({
      where: { entity: "User", entityId: user.id, action: "LOGIN" },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, createdAt: true, ipAddress: true, details: true },
    });

    const sessions = logs.map((l) => {
      const d = (l.details ?? {}) as Record<string, unknown>;
      return {
        id: l.id,
        createdAt: l.createdAt,
        ip: l.ipAddress,
        device: typeof d.device === "string" ? d.device : "desktop",
        browser: typeof d.browser === "string" ? d.browser : "—",
        os: typeof d.os === "string" ? d.os : "—",
      };
    });

    return apiSuccess({ sessions });
  } catch (error) {
    return handleApiError(error);
  }
}
