import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getApiProfessor,
  handleProfessorApiError,
  professorJsonError,
} from "@/src/lib/api/professor";
import { prisma } from "@/src/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const gradeUpdateSchema = z.object({
  enrollmentId: z.string().trim().min(1),
  finalGrade: z.union([z.coerce.number().min(0).max(20), z.null()]),
});

export async function PATCH(request: Request, { params }: RouteParams) {
  const { error, professor } = await getApiProfessor();
  if (error) return error;

  const { id } = await params;

  try {
    const payload = gradeUpdateSchema.parse(await request.json());
    const section = await prisma.courseSection.findFirst({
      where: {
        id,
        professorId: professor.id,
      },
      select: {
        id: true,
        gradesLockedAt: true,
        term: {
          select: {
            status: true,
          },
        },
        enrollments: {
          where: { id: payload.enrollmentId },
          select: { id: true },
        },
      },
    });

    if (!section) {
      return professorJsonError("Seccion no encontrada", 404);
    }

    if (section.term.status === "CLOSED") {
      return professorJsonError(
        "No puedes modificar notas de un periodo academico cerrado",
        409,
      );
    }

    if (section.gradesLockedAt) {
      return professorJsonError("Las notas de esta seccion estan bloqueadas", 409);
    }

    if (section.enrollments.length === 0) {
      return professorJsonError("Inscripcion no encontrada en esta seccion", 404);
    }

    const gradeStatus =
      payload.finalGrade === null
        ? null
        : payload.finalGrade >= 10
          ? "PASSED"
          : "FAILED";

    const enrollment = await prisma.sectionEnrollment.update({
      where: { id: payload.enrollmentId },
      data: {
        finalGrade: payload.finalGrade,
        gradeStatus,
        approvedAt: gradeStatus === "PASSED" ? new Date() : null,
      },
      include: {
        student: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Nota actualizada correctamente",
      data: {
        id: enrollment.id,
        finalGrade:
          enrollment.finalGrade === null ? null : Number(enrollment.finalGrade),
        gradeStatus: enrollment.gradeStatus,
        approvedAt: enrollment.approvedAt?.toISOString() ?? null,
        studentName: enrollment.student.user.name,
      },
    });
  } catch (caughtError) {
    return handleProfessorApiError(caughtError, "Error al actualizar la nota");
  }
}
