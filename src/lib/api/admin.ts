import { auth } from "@/auth";
import { Role } from "@/src/generated/prisma/enums";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function requireApiAdmin() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  if (session.user.role !== Role.ADMIN) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  return null;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export function handleApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Datos invalidos",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const prismaError = error as { code?: string };

  if (prismaError.code === "P2002") {
    return jsonError("Ya existe un registro con esos datos unicos", 409);
  }

  if (prismaError.code === "P2025") {
    return jsonError("Registro no encontrado", 404);
  }

  if (prismaError.code === "P2003") {
    return jsonError("El registro relacionado no existe", 400);
  }

  console.error(fallbackMessage, error);

  return jsonError(fallbackMessage, 500);
}
