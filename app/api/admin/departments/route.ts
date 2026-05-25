import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { departmentCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const facultyId = searchParams.get("facultyId") ?? undefined;

  try {
    const departments = await prisma.department.findMany({
      where: { facultyId },
      orderBy: { name: "asc" },
      include: {
        faculty: true,
        _count: {
          select: {
            subjects: true,
            professors: true,
          },
        },
      },
    });

    return NextResponse.json({ data: departments });
  } catch (error) {
    return handleApiError(error, "Error al obtener los departamentos");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = departmentCreateSchema.parse(await request.json());

    const department = await prisma.department.create({
      data,
      include: { faculty: true },
    });

    return NextResponse.json(
      { message: "Departamento creado correctamente", data: department },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el departamento");
  }
}
