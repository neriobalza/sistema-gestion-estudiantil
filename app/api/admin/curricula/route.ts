import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { curriculumCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const careerOptionId = searchParams.get("careerOptionId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;

  try {
    const curricula = await prisma.curriculum.findMany({
      where: {
        careerOptionId,
        status: status as "DRAFT" | "ACTIVE" | "ARCHIVED" | undefined,
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: {
        careerOption: {
          include: {
            career: {
              include: {
                school: true,
              },
            },
          },
        },
        effectiveFromTerm: true,
        _count: {
          select: {
            subjects: true,
            electiveGroups: true,
            students: true,
          },
        },
      },
    });

    return NextResponse.json({ data: curricula });
  } catch (error) {
    return handleApiError(error, "Error al obtener los pensums");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = curriculumCreateSchema.parse(await request.json());

    const curriculum = await prisma.curriculum.create({
      data,
      include: {
        careerOption: {
          include: {
            career: true,
          },
        },
        effectiveFromTerm: true,
      },
    });

    return NextResponse.json(
      { message: "Pensum creado correctamente", data: curriculum },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el pensum");
  }
}
