import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      user: session.user || null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
