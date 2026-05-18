import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { subjectCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const isActiveParam = searchParams.get("isActive");
  const isActive =
    isActiveParam === null ? undefined : isActiveParam === "true";

  try {
    const subjects = await prisma.subject.findMany({
      where: {
        departmentId,
        isActive,
      },
      orderBy: { code: "asc" },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
        _count: {
          select: {
            curriculumSubjects: true,
            sections: true,
            prerequisites: true,
          },
        },
      },
    });

    return NextResponse.json({ data: subjects });
  } catch (error) {
    return handleApiError(error, "Error al obtener las materias");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = subjectCreateSchema.parse(await request.json());

    const subject = await prisma.subject.create({
      data,
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Materia creada correctamente", data: subject },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear la materia");
  }
}
