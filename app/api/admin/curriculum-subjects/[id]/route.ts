import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { curriculumSubjectUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const curriculumSubject = await prisma.curriculumSubject.findUnique({
      where: { id },
      include: {
        curriculum: {
          include: {
            careerOption: {
              include: {
                career: {
                  include: {
                    school: true,
                  },
                },
              },
            },
          },
        },
        subject: {
          include: {
            department: true,
          },
        },
        electiveGroup: true,
      },
    });

    if (!curriculumSubject) {
      return jsonError("Materia del pensum no encontrada", 404);
    }

    return NextResponse.json({ data: curriculumSubject });
  } catch (error) {
    return handleApiError(error, "Error al obtener la materia del pensum");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = curriculumSubjectUpdateSchema.parse(await request.json());

    const curriculumSubject = await prisma.curriculumSubject.update({
      where: { id },
      data,
      include: {
        curriculum: true,
        subject: true,
        electiveGroup: true,
      },
    });

    return NextResponse.json({
      message: "Materia del pensum actualizada correctamente",
      data: curriculumSubject,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la materia del pensum");
  }
}
