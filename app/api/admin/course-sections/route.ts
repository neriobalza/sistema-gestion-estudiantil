import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { courseSectionCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const termId = searchParams.get("termId") ?? undefined;
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const professorId = searchParams.get("professorId") ?? undefined;

  try {
    const sections = await prisma.courseSection.findMany({
      where: {
        termId,
        subjectId,
        professorId,
      },
      orderBy: [{ term: { startsAt: "desc" } }, { sectionCode: "asc" }],
      include: {
        term: true,
        subject: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        professor: {
          include: {
            user: true,
            department: true,
          },
        },
        schedules: {
          include: {
            classroom: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        },
        _count: {
          select: {
            enrollments: true,
            gradeItems: true,
          },
        },
      },
    });

    return NextResponse.json({ data: sections });
  } catch (error) {
    return handleApiError(error, "Error al obtener las secciones");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const { schedules, ...data } = courseSectionCreateSchema.parse(
      await request.json(),
    );

    const section = await prisma.courseSection.create({
      data: {
        ...data,
        schedules: schedules?.length
          ? {
              create: schedules,
            }
          : undefined,
      },
      include: {
        term: true,
        subject: true,
        professor: {
          include: {
            user: true,
          },
        },
        schedules: {
          include: {
            classroom: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Seccion creada correctamente", data: section },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear la seccion");
  }
}
