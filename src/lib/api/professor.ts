import { auth } from "@/auth";
import { Role } from "@/src/generated/prisma/enums";
import { prisma } from "@/src/lib/prisma";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export async function getApiProfessor() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
      professor: null,
    };
  }

  if (session.user.role !== Role.PROFESSOR) {
    return {
      error: NextResponse.json({ message: "No autorizado" }, { status: 403 }),
      professor: null,
    };
  }

  const professor = await prisma.professorProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      department: {
        include: {
          faculty: true,
        },
      },
    },
  });

  if (!professor) {
    return {
      error: NextResponse.json(
        { message: "Perfil de profesor no encontrado" },
        { status: 404 },
      ),
      professor: null,
    };
  }

  return { error: null, professor };
}

export function professorJsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

export function handleProfessorApiError(
  error: unknown,
  fallbackMessage: string,
) {
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

  if (prismaError.code === "P2025") {
    return professorJsonError("Registro no encontrado", 404);
  }

  console.error(fallbackMessage, error);

  return professorJsonError(fallbackMessage, 500);
}
