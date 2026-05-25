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
    const current = await prisma.curriculumSubject.findUnique({
      where: { id },
      select: {
        curriculumId: true,
        requirementType: true,
        electiveGroupId: true,
      },
    });

    if (!current) {
      return jsonError("Materia del pensum no encontrada", 404);
    }

    const nextRequirementType =
      data.requirementType ?? current.requirementType;
    const nextElectiveGroupId =
      "electiveGroupId" in data ? data.electiveGroupId : current.electiveGroupId;

    if (nextRequirementType === "REQUIRED" && nextElectiveGroupId != null) {
      return jsonError(
        "Una materia obligatoria no debe pertenecer a un grupo electivo",
        400,
      );
    }

    if (nextElectiveGroupId) {
      const electiveGroup = await prisma.electiveGroup.findUnique({
        where: { id: nextElectiveGroupId },
        select: { curriculumId: true },
      });

      if (electiveGroup?.curriculumId !== current.curriculumId) {
        return jsonError("El grupo electivo no pertenece a este pensum", 400);
      }
    }

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

export async function DELETE(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const curriculumSubject = await prisma.curriculumSubject.findUnique({
      where: { id },
      select: {
        subjectId: true,
        curriculum: {
          select: {
            subjects: {
              select: {
                subjectId: true,
              },
            },
          },
        },
      },
    });

    if (!curriculumSubject) {
      return jsonError("Materia del pensum no encontrada", 404);
    }

    const curriculumSubjectIds = curriculumSubject.curriculum.subjects.map(
      (subject) => subject.subjectId,
    );
    const relatedPrerequisites = await prisma.subjectPrerequisite.count({
      where: {
        OR: [
          {
            subjectId: curriculumSubject.subjectId,
            prerequisiteId: { in: curriculumSubjectIds },
          },
          {
            subjectId: { in: curriculumSubjectIds },
            prerequisiteId: curriculumSubject.subjectId,
          },
        ],
      },
    });

    if (relatedPrerequisites > 0) {
      return jsonError(
        "Elimina primero las prelaciones asociadas a esta materia",
        409,
      );
    }

    await prisma.curriculumSubject.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Materia eliminada del pensum correctamente",
    });
  } catch (error) {
    return handleApiError(error, "Error al eliminar la materia del pensum");
  }
}
