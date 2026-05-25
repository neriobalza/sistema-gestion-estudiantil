import { NextResponse } from "next/server";
import {
  getApiProfessor,
  handleProfessorApiError,
  professorJsonError,
} from "@/src/lib/api/professor";
import { prisma } from "@/src/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const { error, professor } = await getApiProfessor();
  if (error) return error;

  const { id } = await params;

  try {
    const section = await prisma.courseSection.findFirst({
      where: {
        id,
        professorId: professor.id,
      },
      include: {
        term: true,
        subject: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        schedules: {
          include: {
            classroom: true,
          },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        },
        gradeItems: {
          orderBy: { name: "asc" },
        },
        enrollments: {
          orderBy: [{ student: { user: { name: "asc" } } }],
          include: {
            grades: {
              include: {
                gradeItem: true,
              },
              orderBy: { gradeItem: { name: "asc" } },
            },
            student: {
              include: {
                user: true,
                currentCareerOption: {
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
          },
        },
      },
    });

    if (!section) {
      return professorJsonError("Seccion no encontrada", 404);
    }

    return NextResponse.json({
      data: {
        id: section.id,
        code: section.sectionCode,
        status: section.status,
        modality: section.modality,
        capacity: section.capacity,
        gradesLocked: section.gradesLockedAt !== null,
        gradesSubmittedAt: section.gradesSubmittedAt?.toISOString() ?? null,
        term: {
          code: section.term.code,
          status: section.term.status,
          startsAt: section.term.startsAt.toISOString(),
          endsAt: section.term.endsAt.toISOString(),
        },
        subject: {
          code: section.subject.code,
          name: section.subject.name,
          credits: section.subject.credits,
          department: section.subject.department.name,
          faculty: section.subject.department.faculty.name,
        },
        schedules: section.schedules.map((schedule) => ({
          id: schedule.id,
          dayOfWeek: schedule.dayOfWeek,
          startMinute: schedule.startMinute,
          endMinute: schedule.endMinute,
          classroomCode: schedule.classroom?.code ?? null,
          classroomLocation: [schedule.classroom?.building, schedule.classroom?.room]
            .filter(Boolean)
            .join(" "),
        })),
        gradeItems: section.gradeItems.map((gradeItem) => ({
          id: gradeItem.id,
          name: gradeItem.name,
          weight: Number(gradeItem.weight),
          maxScore: Number(gradeItem.maxScore),
          dueDate: gradeItem.dueDate?.toISOString() ?? null,
        })),
        enrollments: section.enrollments.map((enrollment) => ({
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt.toISOString(),
          finalGrade:
            enrollment.finalGrade === null ? null : Number(enrollment.finalGrade),
          gradeStatus: enrollment.gradeStatus,
          student: {
            id: enrollment.student.id,
            name: enrollment.student.user.name,
            email: enrollment.student.user.email,
            institutionalId: enrollment.student.user.institutionalId,
            studentCode: enrollment.student.studentCode,
            nationalId: enrollment.student.nationalId,
            phone: enrollment.student.phone,
            address: enrollment.student.address,
            career: enrollment.student.currentCareerOption.career.name,
            option: enrollment.student.currentCareerOption.name,
            school: enrollment.student.currentCareerOption.career.school.name,
          },
          grades: enrollment.grades.map((grade) => ({
            id: grade.id,
            gradeItemId: grade.gradeItemId,
            itemName: grade.gradeItem.name,
            score: Number(grade.score),
            maxScore: Number(grade.gradeItem.maxScore),
            weight: Number(grade.gradeItem.weight),
            gradedAt: grade.gradedAt.toISOString(),
          })),
        })),
      },
    });
  } catch (caughtError) {
    return handleProfessorApiError(caughtError, "Error al obtener la seccion");
  }
}
