import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import { withAudit } from "@/server/services/audit";

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const searchParams = req.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search")?.trim();
    const activeOnly = searchParams.get("activeOnly") !== "false";

    const where: any = {};
    if (activeOnly) {
      where.active = true;
    }
    if (category && category !== "ALL") {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { barcode: { contains: search } },
      ];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ items: products });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole(["ADMIN", "MANAGER", "RECEPTIONIST"]);
    const body = await req.json();
    const { name, category, price, costPrice, stock, minStockAlert, barcode, image, icon } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new ApiError("VALIDATION_ERROR", "Le nom du produit est requis", 400);
    }
    if (typeof price !== "number" || price < 0) {
      throw new ApiError("VALIDATION_ERROR", "Le prix doit être un nombre positif", 400);
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: category || "BOISSONS",
        price: Math.round(price),
        costPrice: costPrice !== undefined && costPrice !== null ? Math.round(costPrice) : null,
        stock: Math.max(0, parseInt(stock || "0", 10)),
        minStockAlert: minStockAlert !== undefined ? Math.max(0, parseInt(minStockAlert, 10)) : 5,
        barcode: barcode?.trim() || null,
        image: image || null,
        icon: icon || null,
        active: true,
      },
    });

    await withAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "Product",
      entityId: product.id,
      after: { name: product.name, price: product.price, stock: product.stock },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
