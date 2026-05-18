import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { departmentUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        faculty: true,
        subjects: { orderBy: { name: "asc" } },
        professors: {
          include: { user: true },
          orderBy: { employeeCode: "asc" },
        },
      },
    });

    if (!department) {
      return jsonError("Departamento no encontrado", 404);
    }

    return NextResponse.json({ data: department });
  } catch (error) {
    return handleApiError(error, "Error al obtener el departamento");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = departmentUpdateSchema.parse(await request.json());

    const department = await prisma.department.update({
      where: { id },
      data,
      include: { faculty: true },
    });

    return NextResponse.json({
      message: "Departamento actualizado correctamente",
      data: department,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el departamento");
  }
}
