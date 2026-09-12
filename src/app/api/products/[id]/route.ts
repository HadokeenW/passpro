import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new ApiError("NOT_FOUND", "Produit introuvable", 404);
    }

    return NextResponse.json(product);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Produit introuvable", 404);
    }

    const {
      name,
      category,
      price,
      costPrice,
      stock,
      stockAdjustment,
      minStockAlert,
      barcode,
      image,
      icon,
      active,
    } = body;

    let newStock = existing.stock;
    if (typeof stockAdjustment === "number") {
      newStock = Math.max(0, existing.stock + stockAdjustment);
    } else if (typeof stock === "number") {
      newStock = Math.max(0, stock);
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        category: category !== undefined ? category : existing.category,
        price: typeof price === "number" ? Math.round(price) : existing.price,
        costPrice:
          costPrice !== undefined
            ? costPrice !== null
              ? Math.round(costPrice)
              : null
            : existing.costPrice,
        stock: newStock,
        minStockAlert:
          typeof minStockAlert === "number"
            ? Math.max(0, minStockAlert)
            : existing.minStockAlert,
        barcode: barcode !== undefined ? barcode?.trim() || null : existing.barcode,
        image: image !== undefined ? image : existing.image,
        icon: icon !== undefined ? icon : existing.icon,
        active: typeof active === "boolean" ? active : existing.active,
      },
    });

    await withAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "Product",
      entityId: id,
      before: existing,
      after: updated,
    });

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER"]);
    const { id } = await params;

    const existing = await prisma.product.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError("NOT_FOUND", "Produit introuvable", 404);
    }

    // Soft-deactivate so historical sales remain intact
    const deactivated = await prisma.product.update({
      where: { id },
      data: { active: false },
    });

    await withAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "Product",
      entityId: id,
      before: existing,
      after: deactivated,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
