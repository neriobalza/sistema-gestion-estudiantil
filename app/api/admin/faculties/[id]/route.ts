import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { facultyUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const faculty = await prisma.faculty.findUnique({
      where: { id },
      include: {
        schools: { orderBy: { name: "asc" } },
        departments: { orderBy: { name: "asc" } },
        classrooms: { orderBy: { code: "asc" } },
      },
    });

    if (!faculty) {
      return jsonError("Facultad no encontrada", 404);
    }

    return NextResponse.json({ data: faculty });
  } catch (error) {
    return handleApiError(error, "Error al obtener la facultad");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = facultyUpdateSchema.parse(await request.json());

    const faculty = await prisma.faculty.update({
      where: { id },
      data,
    });

    return NextResponse.json({
      message: "Facultad actualizada correctamente",
      data: faculty,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la facultad");
  }
}
