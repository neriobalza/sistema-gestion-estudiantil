import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { careerCreateSchema } from "../validation";
import type { Prisma } from "@/src/generated/prisma/client";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const facultyId = searchParams.get("facultyId") ?? undefined;

  const where: Prisma.CareerWhereInput = {
    schoolId,
    school: facultyId ? { facultyId } : undefined,
  };

  try {
    const careers = await prisma.career.findMany({
      where,
      orderBy: [{ school: { name: "asc" } }, { name: "asc" }],
      include: {
        school: {
          include: {
            faculty: true,
          },
        },
        _count: {
          select: {
            options: true,
            enrollmentPeriods: true,
          },
        },
      },
    });

    return NextResponse.json({ data: careers });
  } catch (error) {
    return handleApiError(error, "Error al obtener las carreras");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = careerCreateSchema.parse(await request.json());

    const career = await prisma.career.create({
      data,
      include: {
        school: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Carrera creada correctamente", data: career },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear la carrera");
  }
}
