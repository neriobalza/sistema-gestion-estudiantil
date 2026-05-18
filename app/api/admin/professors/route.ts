import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@/src/generated/prisma/enums";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { professorCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const departmentId = searchParams.get("departmentId") ?? undefined;
  const facultyId = searchParams.get("facultyId") ?? undefined;

  try {
    const professors = await prisma.professorProfile.findMany({
      where: {
        departmentId,
        department: facultyId ? { facultyId } : undefined,
      },
      orderBy: { employeeCode: "asc" },
      include: {
        user: true,
        department: {
          include: {
            faculty: true,
          },
        },
        _count: {
          select: {
            sections: true,
            gradesUploaded: true,
          },
        },
      },
    });

    return NextResponse.json({ data: professors });
  } catch (error) {
    return handleApiError(error, "Error al obtener los profesores");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const result = professorCreateSchema.safeParse(await request.json());

    if (!result.success) {
      return NextResponse.json(
        {
          message: "Datos invalidos",
          errors: result.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const data = result.data;
    const passwordHash = await bcrypt.hash(data.password, 12);

    const professor = await prisma.professorProfile.create({
      data: {
        employeeCode: data.employeeCode,
        phone: data.phone,
        academicTitle: data.academicTitle,
        office: data.office,
        department: data.departmentId
          ? {
              connect: {
                id: data.departmentId,
              },
            }
          : undefined,
        user: {
          create: {
            name: data.name,
            email: data.email,
            institutionalId: data.institutionalId,
            passwordHash,
            role: Role.PROFESSOR,
            status: data.status,
          },
        },
      },
      include: {
        user: true,
        department: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: "Profesor creado correctamente", data: professor },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al crear el profesor");
  }
}
