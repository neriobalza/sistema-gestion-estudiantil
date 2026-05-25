import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { classroomCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const facultyId = searchParams.get("facultyId") ?? undefined;

  try {
    const classrooms = await prisma.classroom.findMany({
      where: { facultyId },
      orderBy: { code: "asc" },
      include: {
        faculty: true,
        _count: {
          select: {
            schedules: true,
          },
        },
      },
    });

    return NextResponse.json({ data: classrooms });
  } catch (error) {
    return handleApiError(error, "Error al obtener los salones");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = classroomCreateSchema.parse(await request.json());

    const classroom = await prisma.classroom.create({
      data,
      include: { faculty: true },
    });

    return NextResponse.json(
      { message: "Salon creado correctamente", data: classroom },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el salon");
  }
}
