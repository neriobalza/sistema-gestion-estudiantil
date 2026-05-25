import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { electiveGroupCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get("curriculumId") ?? undefined;

  try {
    const electiveGroups = await prisma.electiveGroup.findMany({
      where: {
        curriculumId,
      },
      orderBy: [{ semesterNumber: "asc" }, { name: "asc" }],
      include: {
        curriculum: {
          include: {
            careerOption: {
              include: {
                career: true,
              },
            },
          },
        },
        _count: {
          select: {
            subjects: true,
          },
        },
      },
    });

    return NextResponse.json({ data: electiveGroups });
  } catch (error) {
    return handleApiError(error, "Error al obtener los grupos electivos");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = electiveGroupCreateSchema.parse(await request.json());

    const electiveGroup = await prisma.electiveGroup.create({
      data,
      include: {
        curriculum: true,
      },
    });

    return NextResponse.json(
      { message: "Grupo electivo creado correctamente", data: electiveGroup },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el grupo electivo");
  }
}
