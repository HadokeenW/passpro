import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { errorResponse, ApiError } from "@/lib/errors";
import fs from "fs";
import path from "path";

function getDbPath(): string {
  // Check prisma/passpro.db first, then ./passpro.db
  const primary = path.join(process.cwd(), "prisma", "passpro.db");
  if (fs.existsSync(primary)) return primary;
  return path.join(process.cwd(), "passpro.db");
}

export async function GET(req: NextRequest) {
  try {
    await requireRole(["ADMIN", "MANAGER"]);

    // 1. Force WAL checkpoint to sync all changes into passpro.db
    try {
      await prisma.$queryRawUnsafe("PRAGMA wal_checkpoint(TRUNCATE);");
    } catch (checkpointErr) {
      console.warn("Checkpoint warning:", checkpointErr);
    }

    const dbPath = getDbPath();
    if (!fs.existsSync(dbPath)) {
      throw new ApiError("NOT_FOUND", "Fichier de base de données introuvable", 404);
    }

    const fileBuffer = await fs.promises.readFile(dbPath);
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, "0");
    const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
    const filename = `passpro-backup-${timestamp}.db`;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/x-sqlite3",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(["ADMIN"]);

    const formData = await req.formData();
    const file = formData.get("backup") as File | null;

    if (!file) {
      throw new ApiError("VALIDATION_ERROR", "Aucun fichier de sauvegarde fourni", 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Validate SQLite magic header (first 16 bytes: "SQLite format 3\0")
    const header = buffer.subarray(0, 16).toString("utf-8");
    if (!header.startsWith("SQLite format 3")) {
      throw new ApiError(
        "VALIDATION_ERROR",
        "Le fichier fourni n'est pas une base de données SQLite valide",
        400
      );
    }

    const dbPath = getDbPath();

    // Close transactions & write new db
    await fs.promises.writeFile(dbPath, buffer);

    // Remove old wal/shm if present to avoid inconsistency
    const walPath = `${dbPath}-wal`;
    const shmPath = `${dbPath}-shm`;
    if (fs.existsSync(walPath)) await fs.promises.unlink(walPath).catch(() => {});
    if (fs.existsSync(shmPath)) await fs.promises.unlink(shmPath).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "Base de données restaurée avec succès. Veuillez recharger la page.",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
