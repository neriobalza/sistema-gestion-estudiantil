import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { academicTermCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") ?? undefined;
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : undefined;

  try {
    const terms = await prisma.academicTerm.findMany({
      where: {
        status: status as "PLANNED" | "ACTIVE" | "CLOSED" | undefined,
        year,
      },
      orderBy: [{ year: "desc" }, { period: "asc" }],
      include: {
        _count: {
          select: {
            enrollmentPeriods: true,
            sections: true,
            admittedStudents: true,
            curriculaEffective: true,
          },
        },
      },
    });

    return NextResponse.json({ data: terms });
  } catch (error) {
    return handleApiError(error, "Error al obtener los periodos academicos");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = academicTermCreateSchema.parse(await request.json());
    const { facultyId, enrollmentName, ...termData } = data;

    const term = await prisma.academicTerm.create({
      data: {
        ...termData,
        enrollmentPeriods: facultyId
          ? {
              create: {
                facultyId,
                name: enrollmentName ?? `Inscripcion ${termData.code}`,
                startsAt: termData.startsAt,
                endsAt: termData.endsAt,
              },
            }
          : undefined,
      },
      include: {
        enrollmentPeriods: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Periodo academico creado correctamente", data: term },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el periodo academico");
  }
}
