import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { errorResponse } from "@/lib/errors";

export async function POST() {
  try {
    const session = await getSession();
    session.destroy();
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return errorResponse(err);
  }
}
