import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { careerUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const career = await prisma.career.findUnique({
      where: { id },
      include: {
        school: {
          include: {
            faculty: true,
          },
        },
        options: {
          orderBy: { name: "asc" },
        },
        enrollmentPeriods: {
          orderBy: { startsAt: "asc" },
        },
      },
    });

    if (!career) {
      return jsonError("Carrera no encontrada", 404);
    }

    return NextResponse.json({ data: career });
  } catch (error) {
    return handleApiError(error, "Error al obtener la carrera");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = careerUpdateSchema.parse(await request.json());

    const career = await prisma.career.update({
      where: { id },
      data,
      include: {
        school: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Carrera actualizada correctamente",
      data: career,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la carrera");
  }
}
