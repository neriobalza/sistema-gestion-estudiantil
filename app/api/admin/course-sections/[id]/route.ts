import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { courseSectionUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const section = await prisma.courseSection.findUnique({
      where: { id },
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
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!section) {
      return jsonError("Seccion no encontrada", 404);
    }

    return NextResponse.json({ data: section });
  } catch (error) {
    return handleApiError(error, "Error al obtener la seccion");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const { schedules, ...data } = courseSectionUpdateSchema.parse(
      await request.json(),
    );

    const section = await prisma.courseSection.update({
      where: { id },
      data: {
        ...data,
        schedules: schedules
          ? {
              deleteMany: {},
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

    return NextResponse.json({
      message: "Seccion actualizada correctamente",
      data: section,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la seccion");
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const section = await prisma.courseSection.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    if (!section) {
      return jsonError("Seccion no encontrada", 404);
    }

    if (section._count.enrollments > 0) {
      return jsonError(
        "No puedes eliminar una seccion con estudiantes inscritos",
        409,
      );
    }

    await prisma.courseSection.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Seccion eliminada correctamente",
    });
  } catch (error) {
    return handleApiError(error, "Error al eliminar la seccion");
  }
}
