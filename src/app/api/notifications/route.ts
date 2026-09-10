import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST", "ACCESS_GUARD"]);
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "20", 10)));

    const unreadCount = await prisma.alert.count({ where: { read: false } });

    const where: any = {};
    if (unreadOnly) {
      where.read = false;
    }

    const total = await prisma.alert.count({ where });

    const alerts = await prisma.alert.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return NextResponse.json({
      items: alerts,
      unreadCount,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { searchParams } = new URL(req.url);
    const onlyRead = searchParams.get("read") === "true";

    if (onlyRead) {
      await prisma.alert.deleteMany({ where: { read: true } });
    } else {
      await prisma.alert.deleteMany({});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
