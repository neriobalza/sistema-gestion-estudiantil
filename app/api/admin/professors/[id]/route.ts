import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { professorUpdateSchema } from "../../validation";
import type { Prisma } from "@/src/generated/prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const professor = await prisma.professorProfile.findUnique({
      where: { id },
      include: {
        user: true,
        department: {
          include: {
            faculty: true,
          },
        },
        sections: {
          include: {
            term: true,
            subject: true,
            schedules: {
              include: {
                classroom: true,
              },
            },
          },
          orderBy: [{ term: { startsAt: "desc" } }, { sectionCode: "asc" }],
        },
      },
    });

    if (!professor) {
      return jsonError("Profesor no encontrado", 404);
    }

    return NextResponse.json({ data: professor });
  } catch (error) {
    return handleApiError(error, "Error al obtener el profesor");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = professorUpdateSchema.parse(await request.json());
    const userData: Record<string, unknown> = {};
    const professorData: Prisma.ProfessorProfileUpdateInput = {};

    if (data.name !== undefined) userData.name = data.name;
    if (data.email !== undefined) userData.email = data.email;
    if (data.institutionalId !== undefined) {
      userData.institutionalId = data.institutionalId;
    }
    if (data.status !== undefined) userData.status = data.status;
    if (data.password !== undefined) {
      userData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    if (data.employeeCode !== undefined) {
      professorData.employeeCode = data.employeeCode;
    }
    if (data.phone !== undefined) professorData.phone = data.phone;
    if (data.academicTitle !== undefined) {
      professorData.academicTitle = data.academicTitle;
    }
    if (data.office !== undefined) professorData.office = data.office;
    if (data.departmentId !== undefined) {
      professorData.department = data.departmentId
        ? {
            connect: {
              id: data.departmentId,
            },
          }
        : {
            disconnect: true,
          };
    }
    if (Object.keys(userData).length > 0) {
      professorData.user = {
        update: userData,
      };
    }

    const professor = await prisma.professorProfile.update({
      where: { id },
      data: professorData,
      include: {
        user: true,
        department: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Profesor actualizado correctamente",
      data: professor,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el profesor");
  }
}
