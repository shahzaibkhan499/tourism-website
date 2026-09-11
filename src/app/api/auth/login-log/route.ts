import { NextRequest } from "next/server";
import { UAParser } from "ua-parser-js";
import { prisma } from "@/lib/db";
import { apiSuccess, handleApiError, requireUser } from "@/lib/api";
import { getClientIp } from "@/lib/utils";

// Record a successful login (device/browser/OS via ua-parser-js) in the audit log.
// Called by the client right after signIn() succeeds.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();

    const uaRaw = req.headers.get("user-agent") || "";
    const parser = new UAParser(uaRaw);
    const ua = parser.getResult();

    const device = ua.device.type || (ua.device.model ? "mobile" : "desktop");
    const browser = [ua.browser.name, ua.browser.version].filter(Boolean).join(" ");
    const os = [ua.os.name, ua.os.version].filter(Boolean).join(" ");
    const ip = getClientIp(req.headers);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date(), loginCount: { increment: 1 } },
      }),
      prisma.auditLog.create({
        data: {
          adminId: user.id,
          action: "LOGIN",
          entity: "User",
          entityId: user.id,
          details: {
            device,
            browser: browser || "Unknown",
            os: os || "Unknown",
            userAgent: uaRaw.slice(0, 300),
          },
          ipAddress: ip,
        },
      }),
    ]);

    return apiSuccess({ message: "Login logged" });
  } catch (error) {
    return handleApiError(error);
  }
}
