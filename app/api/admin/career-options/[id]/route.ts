import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { careerOptionUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const careerOption = await prisma.careerOption.findUnique({
      where: { id },
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
        curricula: {
          orderBy: [{ version: "desc" }],
        },
        students: {
          include: {
            user: true,
          },
          orderBy: { studentCode: "asc" },
        },
        enrollmentPeriods: {
          orderBy: { startsAt: "asc" },
        },
      },
    });

    if (!careerOption) {
      return jsonError("Opcion de carrera no encontrada", 404);
    }

    return NextResponse.json({ data: careerOption });
  } catch (error) {
    return handleApiError(error, "Error al obtener la opcion de carrera");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = careerOptionUpdateSchema.parse(await request.json());

    const careerOption = await prisma.careerOption.update({
      where: { id },
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

    return NextResponse.json({
      message: "Opcion de carrera actualizada correctamente",
      data: careerOption,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la opcion de carrera");
  }
}
