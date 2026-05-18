import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { curriculumUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const curriculum = await prisma.curriculum.findUnique({
      where: { id },
      include: {
        careerOption: {
          include: {
            career: {
              include: {
                school: {
                  include: {
                    faculty: true,
                  },
                },
              },
            },
          },
        },
        effectiveFromTerm: true,
        subjects: {
          include: {
            subject: {
              include: {
                department: true,
              },
            },
            electiveGroup: true,
          },
          orderBy: [{ semesterNumber: "asc" }, { subject: { code: "asc" } }],
        },
        electiveGroups: {
          orderBy: [{ semesterNumber: "asc" }, { name: "asc" }],
        },
        students: {
          include: {
            user: true,
          },
          orderBy: { studentCode: "asc" },
        },
      },
    });

    if (!curriculum) {
      return jsonError("Pensum no encontrado", 404);
    }

    return NextResponse.json({ data: curriculum });
  } catch (error) {
    return handleApiError(error, "Error al obtener el pensum");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = curriculumUpdateSchema.parse(await request.json());

    const curriculum = await prisma.curriculum.update({
      where: { id },
      data,
      include: {
        careerOption: {
          include: {
            career: true,
          },
        },
        effectiveFromTerm: true,
      },
    });

    return NextResponse.json({
      message: "Pensum actualizado correctamente",
      data: curriculum,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el pensum");
  }
}
