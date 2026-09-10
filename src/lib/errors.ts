import { NextResponse } from "next/server";

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR"
  | "VALIDATION_ERROR"
  | "PLAN_IN_USE"
  | "CARD_ALREADY_EXISTS"
  | "SUBSCRIPTION_NOT_RENEWABLE";

export class ApiError extends Error {
  statusCode: number;
  code: ErrorCode;

  constructor(code: ErrorCode, message: string, statusCode: number = 400) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

export function errorResponse(error: unknown) {
  console.error("API Error:", error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : "Une erreur inattendue est survenue";
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
    { status: 500 }
  );
}
