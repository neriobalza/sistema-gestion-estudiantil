import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { subjectPrerequisiteSchema } from "../../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function validatePrerequisiteInCurriculum(
  curriculumId: string,
  subjectId: string,
  prerequisiteId: string,
) {
  if (subjectId === prerequisiteId) {
    return "Una materia no puede prelarse a si misma";
  }

  const curriculumSubjects = await prisma.curriculumSubject.findMany({
    where: {
      curriculumId,
      subjectId: { in: [subjectId, prerequisiteId] },
    },
    select: {
      subjectId: true,
      semesterNumber: true,
    },
  });

  const subject = curriculumSubjects.find((item) => item.subjectId === subjectId);
  const prerequisite = curriculumSubjects.find(
    (item) => item.subjectId === prerequisiteId,
  );

  if (!subject || !prerequisite) {
    return "Ambas materias deben pertenecer al pensum";
  }

  if (prerequisite.semesterNumber >= subject.semesterNumber) {
    return "La materia prelante debe estar en un semestre anterior";
  }

  const reverseRelation = await prisma.subjectPrerequisite.findUnique({
    where: {
      subjectId_prerequisiteId: {
        subjectId: prerequisiteId,
        prerequisiteId: subjectId,
      },
    },
  });

  if (reverseRelation) {
    return "La prelacion inversa ya existe";
  }

  return null;
}

export async function POST(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = subjectPrerequisiteSchema.parse(await request.json());
    const validationError = await validatePrerequisiteInCurriculum(
      id,
      data.subjectId,
      data.prerequisiteId,
    );

    if (validationError) {
      return jsonError(validationError, 400);
    }

    const prerequisite = await prisma.subjectPrerequisite.create({
      data,
      include: {
        subject: true,
        prerequisite: true,
      },
    });

    return NextResponse.json(
      {
        message: "Prelacion agregada correctamente",
        data: prerequisite,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al agregar la prelacion");
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = subjectPrerequisiteSchema.parse(await request.json());
    const curriculumSubjects = await prisma.curriculumSubject.count({
      where: {
        curriculumId: id,
        subjectId: { in: [data.subjectId, data.prerequisiteId] },
      },
    });

    if (curriculumSubjects !== 2) {
      return jsonError("La prelacion no pertenece a este pensum", 400);
    }

    await prisma.subjectPrerequisite.delete({
      where: {
        subjectId_prerequisiteId: data,
      },
    });

    return NextResponse.json({
      message: "Prelacion eliminada correctamente",
    });
  } catch (error) {
    return handleApiError(error, "Error al eliminar la prelacion");
  }
}
