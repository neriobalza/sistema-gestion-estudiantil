import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { classroomUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        faculty: true,
        schedules: {
          include: { section: true },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        },
      },
    });

    if (!classroom) {
      return jsonError("Salon no encontrado", 404);
    }

    return NextResponse.json({ data: classroom });
  } catch (error) {
    return handleApiError(error, "Error al obtener el salon");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = classroomUpdateSchema.parse(await request.json());

    const classroom = await prisma.classroom.update({
      where: { id },
      data,
      include: { faculty: true },
    });

    return NextResponse.json({
      message: "Salon actualizado correctamente",
      data: classroom,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el salon");
  }
}
