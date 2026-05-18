import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { curriculumSubjectCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get("curriculumId") ?? undefined;
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const electiveGroupId = searchParams.get("electiveGroupId") ?? undefined;
  const requirementType = searchParams.get("requirementType") ?? undefined;

  try {
    const curriculumSubjects = await prisma.curriculumSubject.findMany({
      where: {
        curriculumId,
        subjectId,
        electiveGroupId,
        requirementType: requirementType as "REQUIRED" | "ELECTIVE" | undefined,
      },
      orderBy: [{ semesterNumber: "asc" }, { subject: { code: "asc" } }],
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
        subject: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        electiveGroup: true,
      },
    });

    return NextResponse.json({ data: curriculumSubjects });
  } catch (error) {
    return handleApiError(error, "Error al obtener las materias del pensum");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = curriculumSubjectCreateSchema.parse(await request.json());

    const curriculumSubject = await prisma.curriculumSubject.create({
      data,
      include: {
        curriculum: true,
        subject: true,
        electiveGroup: true,
      },
    });

    return NextResponse.json(
      {
        message: "Materia agregada al pensum correctamente",
        data: curriculumSubject,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al agregar la materia al pensum");
  }
}
