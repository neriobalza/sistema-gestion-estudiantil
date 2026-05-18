import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { enrollmentPeriodUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const enrollmentPeriod = await prisma.enrollmentPeriod.findUnique({
      where: { id },
      include: {
        term: true,
        faculty: true,
        school: true,
        career: true,
        careerOption: true,
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
            section: {
              include: {
                subject: true,
              },
            },
          },
          orderBy: { enrolledAt: "desc" },
        },
      },
    });

    if (!enrollmentPeriod) {
      return jsonError("Periodo de inscripcion no encontrado", 404);
    }

    return NextResponse.json({ data: enrollmentPeriod });
  } catch (error) {
    return handleApiError(error, "Error al obtener el periodo de inscripcion");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = enrollmentPeriodUpdateSchema.parse(await request.json());

    const current = await prisma.enrollmentPeriod.findUnique({
      where: { id },
      select: {
        startsAt: true,
        endsAt: true,
      },
    });

    if (!current) {
      return jsonError("Periodo de inscripcion no encontrado", 404);
    }

    const startsAt = data.startsAt ?? current.startsAt;
    const endsAt = data.endsAt ?? current.endsAt;

    if (endsAt < startsAt) {
      return jsonError(
        "La fecha de fin debe ser posterior o igual a la fecha de inicio",
        400,
      );
    }

    const enrollmentPeriod = await prisma.enrollmentPeriod.update({
      where: { id },
      data,
      include: {
        term: true,
        faculty: true,
        school: true,
        career: true,
        careerOption: true,
      },
    });

    return NextResponse.json({
      message: "Periodo de inscripcion actualizado correctamente",
      data: enrollmentPeriod,
    });
  } catch (error) {
    return handleApiError(
      error,
      "Error al actualizar el periodo de inscripcion",
    );
  }
}
