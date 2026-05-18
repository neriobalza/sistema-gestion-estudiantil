import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { enrollmentPeriodCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const termId = searchParams.get("termId") ?? undefined;
  const status = searchParams.get("status") ?? undefined;
  const facultyId = searchParams.get("facultyId") ?? undefined;
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const careerId = searchParams.get("careerId") ?? undefined;
  const careerOptionId = searchParams.get("careerOptionId") ?? undefined;

  try {
    const enrollmentPeriods = await prisma.enrollmentPeriod.findMany({
      where: {
        termId,
        status: status as
          | "SCHEDULED"
          | "OPEN"
          | "CLOSED"
          | "CANCELLED"
          | undefined,
        facultyId,
        schoolId,
        careerId,
        careerOptionId,
      },
      orderBy: [{ startsAt: "desc" }, { name: "asc" }],
      include: {
        term: true,
        faculty: true,
        school: true,
        career: true,
        careerOption: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    return NextResponse.json({ data: enrollmentPeriods });
  } catch (error) {
    return handleApiError(error, "Error al obtener los periodos de inscripcion");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = enrollmentPeriodCreateSchema.parse(await request.json());

    const enrollmentPeriod = await prisma.enrollmentPeriod.create({
      data,
      include: {
        term: true,
        faculty: true,
        school: true,
        career: true,
        careerOption: true,
      },
    });

    return NextResponse.json(
      {
        message: "Periodo de inscripcion creado correctamente",
        data: enrollmentPeriod,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el periodo de inscripcion");
  }
}
