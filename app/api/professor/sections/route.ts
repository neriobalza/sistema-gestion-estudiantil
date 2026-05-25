import { NextResponse } from "next/server";
import { getApiProfessor, handleProfessorApiError } from "@/src/lib/api/professor";
import { prisma } from "@/src/lib/prisma";

export async function GET() {
  const { error, professor } = await getApiProfessor();
  if (error) return error;

  try {
    const sections = await prisma.courseSection.findMany({
      where: { professorId: professor.id },
      orderBy: [{ term: { startsAt: "desc" } }, { subject: { code: "asc" } }],
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
        _count: {
          select: {
            enrollments: true,
            gradeItems: true,
          },
        },
      },
    });

    return NextResponse.json({
      data: sections.map((section) => ({
        id: section.id,
        code: section.sectionCode,
        status: section.status,
        modality: section.modality,
        capacity: section.capacity,
        studentsCount: section._count.enrollments,
        gradeItemsCount: section._count.gradeItems,
        gradesLocked: section.gradesLockedAt !== null,
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
      })),
    });
  } catch (caughtError) {
    return handleProfessorApiError(
      caughtError,
      "Error al obtener las secciones del profesor",
    );
  }
}
