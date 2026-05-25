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

    const activeSections = sections.filter(
      (section) => section.term.status === "ACTIVE" && section.status === "OPEN",
    );

    return NextResponse.json({
      data: {
        professor: {
          id: professor.id,
          name: professor.user.name,
          email: professor.user.email,
          institutionalId: professor.user.institutionalId,
          employeeCode: professor.employeeCode,
          phone: professor.phone,
          academicTitle: professor.academicTitle,
          office: professor.office,
          department: professor.department
            ? {
                name: professor.department.name,
                code: professor.department.code,
                faculty: professor.department.faculty.name,
              }
            : null,
        },
        summary: {
          activeSections: activeSections.length,
          assignedSections: sections.length,
          activeStudents: activeSections.reduce(
            (total, section) => total + section._count.enrollments,
            0,
          ),
        },
        activeSections: activeSections.map((section) => ({
          id: section.id,
          code: section.sectionCode,
          status: section.status,
          modality: section.modality,
          capacity: section.capacity,
          studentsCount: section._count.enrollments,
          gradeItemsCount: section._count.gradeItems,
          term: {
            code: section.term.code,
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
      },
    });
  } catch (caughtError) {
    return handleProfessorApiError(
      caughtError,
      "Error al obtener el dashboard del profesor",
    );
  }
}
