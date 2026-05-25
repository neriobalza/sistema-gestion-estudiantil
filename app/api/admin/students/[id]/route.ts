import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { studentUpdateSchema } from "../../validation";
import type { Prisma } from "@/src/generated/prisma/client";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: true,
        admissionTerm: true,
        currentCareerOption: {
          include: {
            career: true,
          },
        },
        curriculum: true,
        enrollments: {
          include: {
            section: {
              include: {
                term: true,
                subject: true,
                professor: {
                  include: {
                    user: true,
                  },
                },
                schedules: {
                  include: {
                    classroom: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return jsonError("Estudiante no encontrado", 404);
    }

    return NextResponse.json({ data: student });
  } catch (error) {
    return handleApiError(error, "Error al obtener el estudiante");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = studentUpdateSchema.parse(await request.json());
    const userData: Record<string, unknown> = {};
    const studentData: Prisma.StudentProfileUpdateInput = {};

    if (data.name !== undefined) userData.name = data.name;
    if (data.email !== undefined) userData.email = data.email;
    if (data.institutionalId !== undefined) {
      userData.institutionalId = data.institutionalId;
    }
    if (data.userStatus !== undefined) userData.status = data.userStatus;
    if (data.password !== undefined) {
      userData.passwordHash = await bcrypt.hash(data.password, 12);
      userData.mustChangePassword = true;
    }

    if (data.studentCode !== undefined) {
      studentData.studentCode = data.studentCode;
    }
    if (data.nationalId !== undefined) studentData.nationalId = data.nationalId;
    if (data.birthDate !== undefined) studentData.birthDate = data.birthDate;
    if (data.phone !== undefined) studentData.phone = data.phone;
    if (data.address !== undefined) studentData.address = data.address;
    if (data.status !== undefined) studentData.status = data.status;

    if (Object.keys(userData).length > 0) {
      studentData.user = {
        update: userData,
      };
    }

    const student = await prisma.studentProfile.update({
      where: { id },
      data: studentData,
      include: {
        user: true,
      },
    });

    return NextResponse.json({
      message: "Estudiante actualizado correctamente",
      data: student,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el estudiante");
  }
}
