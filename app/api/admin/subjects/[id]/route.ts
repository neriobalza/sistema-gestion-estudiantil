import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { subjectUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const subject = await prisma.subject.findUnique({
      where: { id },
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
        curriculumSubjects: {
          include: {
            curriculum: {
              include: {
                careerOption: {
                  include: {
                    career: true,
                  },
                },
              },
            },
            electiveGroup: true,
          },
          orderBy: [{ semesterNumber: "asc" }],
        },
        sections: {
          include: {
            term: true,
            professor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: [{ term: { startsAt: "desc" } }, { sectionCode: "asc" }],
        },
        prerequisites: {
          include: {
            prerequisite: true,
          },
        },
        requiredFor: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!subject) {
      return jsonError("Materia no encontrada", 404);
    }

    return NextResponse.json({ data: subject });
  } catch (error) {
    return handleApiError(error, "Error al obtener la materia");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = subjectUpdateSchema.parse(await request.json());

    const subject = await prisma.subject.update({
      where: { id },
      data,
      include: {
        department: {
          include: {
            faculty: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Materia actualizada correctamente",
      data: subject,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar la materia");
  }
}
