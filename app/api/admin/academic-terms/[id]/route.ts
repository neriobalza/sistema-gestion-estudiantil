import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { TermStatus } from "@/src/generated/prisma/enums";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { academicTermUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const term = await prisma.academicTerm.findUnique({
      where: { id },
      include: {
        enrollmentPeriods: {
          orderBy: { startsAt: "asc" },
          include: {
            faculty: true,
            school: true,
            career: true,
            careerOption: true,
          },
        },
        sections: {
          include: {
            subject: true,
            professor: {
              include: {
                user: true,
              },
            },
          },
          orderBy: [{ subject: { code: "asc" } }, { sectionCode: "asc" }],
        },
        admittedStudents: {
          include: {
            user: true,
          },
          orderBy: { studentCode: "asc" },
        },
        curriculaEffective: {
          orderBy: { name: "asc" },
        },
      },
    });

    if (!term) {
      return jsonError("Periodo academico no encontrado", 404);
    }

    return NextResponse.json({ data: term });
  } catch (error) {
    return handleApiError(error, "Error al obtener el periodo academico");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const parsed = academicTermUpdateSchema.parse(await request.json());
    const data = {
      ...(parsed.code !== undefined ? { code: parsed.code } : {}),
      ...(parsed.year !== undefined ? { year: parsed.year } : {}),
      ...(parsed.period !== undefined ? { period: parsed.period } : {}),
      ...(parsed.startsAt !== undefined ? { startsAt: parsed.startsAt } : {}),
      ...(parsed.endsAt !== undefined ? { endsAt: parsed.endsAt } : {}),
      ...(parsed.status !== undefined ? { status: parsed.status } : {}),
    };

    const term =
      parsed.status === TermStatus.CLOSED
        ? await prisma.$transaction(async (tx) => {
            const closedTerm = await tx.academicTerm.update({
              where: { id },
              data,
            });

            await tx.sectionEnrollment.updateMany({
              where: {
                finalGrade: null,
                status: {
                  not: "DROPPED",
                },
                section: {
                  termId: id,
                },
              },
              data: {
                finalGrade: 0,
                gradeStatus: "FAILED",
                approvedAt: null,
              },
            });

            await tx.courseSection.updateMany({
              where: {
                termId: id,
                gradesLockedAt: null,
              },
              data: {
                gradesLockedAt: new Date(),
              },
            });

            return closedTerm;
          })
        : await prisma.academicTerm.update({
            where: { id },
            data,
          });

    return NextResponse.json({
      message: "Periodo academico actualizado correctamente",
      data: term,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el periodo academico");
  }
}
