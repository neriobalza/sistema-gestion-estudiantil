import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { facultyCreateSchema } from "../validation";

export async function GET() {
  const authError = await requireApiAdmin();
  if (authError) return authError;
  console.log("pidiendo");

  try {
    const faculties = await prisma.faculty.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            schools: true,
            departments: true,
            classrooms: true,
          },
        },
      },
    });

    return NextResponse.json({ data: faculties });
  } catch (error) {
    return handleApiError(error, "Error al obtener las facultades");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = facultyCreateSchema.parse(await request.json());

    const faculty = await prisma.faculty.create({
      data,
    });

    return NextResponse.json(
      { message: "Facultad creada correctamente", data: faculty },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear la facultad");
  }
}
