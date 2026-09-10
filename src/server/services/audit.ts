import { prisma } from "@/lib/db";

export interface AuditParams {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}

export async function withAudit({
  userId,
  action,
  entityType,
  entityId,
  before,
  after,
}: AuditParams) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId,
        before: before ? JSON.stringify(before) : null,
        after: after ? JSON.stringify(after) : null,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
}
