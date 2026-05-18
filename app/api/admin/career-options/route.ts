import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { careerOptionCreateSchema } from "../validation";
import type { Prisma } from "@/src/generated/prisma/client";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const careerId = searchParams.get("careerId") ?? undefined;
  const schoolId = searchParams.get("schoolId") ?? undefined;
  const facultyId = searchParams.get("facultyId") ?? undefined;

  const where: Prisma.CareerOptionWhereInput = {
    careerId,
    career:
      schoolId || facultyId
        ? {
            schoolId,
            school: facultyId ? { facultyId } : undefined,
          }
        : undefined,
  };

  try {
    const careerOptions = await prisma.careerOption.findMany({
      where,
      orderBy: [{ career: { name: "asc" } }, { name: "asc" }],
      include: {
        career: {
          include: {
            school: {
              include: {
                faculty: true,
              },
            },
          },
        },
        _count: {
          select: {
            curricula: true,
            students: true,
            enrollmentPeriods: true,
          },
        },
      },
    });

    return NextResponse.json({ data: careerOptions });
  } catch (error) {
    return handleApiError(error, "Error al obtener las opciones de carrera");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = careerOptionCreateSchema.parse(await request.json());

    const careerOption = await prisma.careerOption.create({
      data,
      include: {
        career: {
          include: {
            school: {
              include: {
                faculty: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Opcion de carrera creada correctamente", data: careerOption },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear la opcion de carrera");
  }
}
