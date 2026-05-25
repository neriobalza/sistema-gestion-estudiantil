import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { schoolCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const facultyId = searchParams.get("facultyId") ?? undefined;

  try {
    const schools = await prisma.school.findMany({
      where: { facultyId },
      orderBy: { name: "asc" },
      include: {
        faculty: true,
        _count: {
          select: {
            careers: true,
            enrollmentPeriods: true,
          },
        },
      },
    });

    return NextResponse.json({ data: schools });
  } catch (error) {
    return handleApiError(error, "Error al obtener las escuelas");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = schoolCreateSchema.parse(await request.json());

    const school = await prisma.school.create({
      data,
      include: { faculty: true },
    });

    return NextResponse.json(
      { message: "Escuela creada correctamente", data: school },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear la escuela");
  }
}
