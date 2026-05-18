import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { schoolUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const school = await prisma.school.findUnique({
      where: { id },
      include: {
        faculty: true,
        careers: { orderBy: { name: "asc" } },
        enrollmentPeriods: { orderBy: { startsAt: "desc" } },
      },
    });

    if (!school) {
      return jsonError("Escuela no encontrada", 404);
    }

    return NextResponse.json({ data: school });
  } catch (error) {
    return handleApiError(error, "Error al obtener la escuela");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = schoolUpdateSchema.parse(await request.json());

    const school = await prisma.school.update({
      where: { id },
      data,
      include: { faculty: true },
    });

    return NextResponse.json({
      message: "Escuela actualizada correctamente",
      data: school,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la escuela");
  }
}
