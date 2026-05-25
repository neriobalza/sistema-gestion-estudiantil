import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@/src/generated/prisma/enums";

const activeEnrollmentStatuses = ["PENDING", "ENROLLED"] as const;

const enrollmentCreateSchema = z.object({
  sectionId: z.string().min(1, "La seccion es obligatoria"),
});

const enrollmentCancelSchema = z.object({
  enrollmentId: z.string().min(1, "La inscripcion es obligatoria"),
});

type ScheduleBlock = {
  dayOfWeek: string;
  startMinute: number;
  endMinute: number;
};

async function requireStudentProfile() {
  const session = await auth();

  if (!session?.user) {
    return {
      error: NextResponse.json({ message: "No autenticado" }, { status: 401 }),
      student: null,
    };
  }

  if (session.user.role !== Role.STUDENT) {
    return {
      error: NextResponse.json({ message: "No autorizado" }, { status: 403 }),
      student: null,
    };
  }

  const student = await prisma.studentProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      currentCareerOption: {
        include: {
          career: {
            include: {
              school: true,
            },
          },
        },
      },
      curriculum: {
        include: {
          subjects: {
            include: {
              subject: {
                include: {
                  prerequisites: true,
                },
              },
            },
          },
        },
      },
      enrollments: {
        include: {
          section: {
            include: {
              term: true,
              subject: true,
              schedules: true,
            },
          },
        },
      },
    },
  });

  if (!student) {
    return {
      error: NextResponse.json(
        { message: "Perfil de estudiante no encontrado" },
        { status: 404 },
      ),
      student: null,
    };
  }

  if (student.status !== "ACTIVE") {
    return {
      error: NextResponse.json(
        { message: "El estudiante no esta activo para inscribir materias" },
        { status: 403 },
      ),
      student: null,
    };
  }

  return { error: null, student };
}

export async function GET() {
  try {
    const { error, student } = await requireStudentProfile();
    if (error || !student) return error;

    const enrollmentPeriod = await findActiveEnrollmentPeriod(student);

    if (!enrollmentPeriod) {
      return NextResponse.json({
        data: {
          enrollmentPeriod: null,
          offerings: [],
          activeEnrollments: buildActiveEnrollmentPayload(student.enrollments),
        },
      });
    }

    const approvedSubjectIds = getApprovedSubjectIds(student.enrollments);
    const activeSubjectIds = getActiveSubjectIdsForTerm(
      student.enrollments,
      enrollmentPeriod.termId,
    );
    const activeScheduleBlocks = student.enrollments
      .filter(
        (enrollment) =>
          activeEnrollmentStatuses.includes(
            enrollment.status as (typeof activeEnrollmentStatuses)[number],
          ) && enrollment.section.termId === enrollmentPeriod.termId,
      )
      .flatMap((enrollment) => enrollment.section.schedules);
    const eligibleSubjectIds = getEligibleSubjectIds(
      student.curriculum.subjects,
      approvedSubjectIds,
      activeSubjectIds,
    );

    const sections = await prisma.courseSection.findMany({
      where: {
        termId: enrollmentPeriod.termId,
        status: "OPEN",
        subjectId: {
          in: [...eligibleSubjectIds],
        },
      },
      include: {
        subject: true,
        professor: {
          include: {
            user: true,
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
            enrollments: {
              where: {
                status: {
                  in: [...activeEnrollmentStatuses],
                },
              },
            },
          },
        },
      },
      orderBy: [{ subject: { code: "asc" } }, { sectionCode: "asc" }],
    });

    return NextResponse.json({
      data: {
        enrollmentPeriod: {
          id: enrollmentPeriod.id,
          name: enrollmentPeriod.name,
          startsAt: enrollmentPeriod.startsAt.toISOString(),
          endsAt: enrollmentPeriod.endsAt.toISOString(),
          term: {
            id: enrollmentPeriod.term.id,
            code: enrollmentPeriod.term.code,
          },
        },
        offerings: sections.map((section) => ({
          id: section.id,
          sectionCode: section.sectionCode,
          capacity: section.capacity,
          enrolledCount: section._count.enrollments,
          availableSeats: Math.max(0, section.capacity - section._count.enrollments),
          modality: section.modality,
          hasScheduleConflict: hasScheduleConflict(
            section.schedules,
            activeScheduleBlocks,
          ),
          subject: {
            id: section.subject.id,
            code: section.subject.code,
            name: section.subject.name,
            credits:
              student.curriculum.subjects.find(
                (curriculumSubject) =>
                  curriculumSubject.subjectId === section.subjectId,
              )?.credits ?? section.subject.credits,
          },
          professorName: section.professor?.user.name ?? null,
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
        activeEnrollments: buildActiveEnrollmentPayload(student.enrollments),
      },
    });
  } catch (caughtError) {
    console.error("Error al obtener la oferta de inscripcion", caughtError);

    return NextResponse.json(
      { message: "Error al obtener la oferta de inscripcion" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const { error, student } = await requireStudentProfile();
    if (error || !student) return error;

    const data = enrollmentCreateSchema.parse(await request.json());
    const enrollmentPeriod = await findActiveEnrollmentPeriod(student);

    if (!enrollmentPeriod) {
      return NextResponse.json(
        { message: "No hay un proceso de inscripcion activo para tu carrera" },
        { status: 409 },
      );
    }

    const section = await prisma.courseSection.findUnique({
      where: { id: data.sectionId },
      include: {
        subject: {
          include: {
            prerequisites: true,
          },
        },
        schedules: true,
      },
    });

    if (!section || section.termId !== enrollmentPeriod.termId) {
      return NextResponse.json(
        { message: "La seccion seleccionada no pertenece al periodo activo" },
        { status: 404 },
      );
    }

    if (section.status !== "OPEN") {
      return NextResponse.json(
        { message: "La seccion seleccionada no esta abierta para inscripcion" },
        { status: 409 },
      );
    }

    const curriculumSubject = student.curriculum.subjects.find(
      (subject) => subject.subjectId === section.subjectId,
    );

    if (!curriculumSubject) {
      return NextResponse.json(
        { message: "La materia no pertenece a tu pensum" },
        { status: 403 },
      );
    }

    const approvedSubjectIds = getApprovedSubjectIds(student.enrollments);

    if (approvedSubjectIds.has(section.subjectId)) {
      return NextResponse.json(
        { message: "Ya aprobaste esta materia" },
        { status: 409 },
      );
    }

    const missingPrerequisites = section.subject.prerequisites.filter(
      (prerequisite) => !approvedSubjectIds.has(prerequisite.prerequisiteId),
    );

    if (missingPrerequisites.length > 0) {
      return NextResponse.json(
        { message: "Debes aprobar las prelaciones de esta materia" },
        { status: 409 },
      );
    }

    const activeEnrollmentsForTerm = student.enrollments.filter(
      (enrollment) =>
        activeEnrollmentStatuses.includes(
          enrollment.status as (typeof activeEnrollmentStatuses)[number],
        ) && enrollment.section.termId === enrollmentPeriod.termId,
    );
    const alreadyEnrolledSubject = activeEnrollmentsForTerm.some(
      (enrollment) => enrollment.section.subjectId === section.subjectId,
    );

    if (alreadyEnrolledSubject) {
      return NextResponse.json(
        { message: "Ya tienes inscrita esta materia en el periodo activo" },
        { status: 409 },
      );
    }

    const hasConflict = activeEnrollmentsForTerm.some((enrollment) =>
      hasScheduleConflict(section.schedules, enrollment.section.schedules),
    );

    if (hasConflict) {
      return NextResponse.json(
        { message: "La seccion seleccionada tiene colision con tu horario actual" },
        { status: 409 },
      );
    }

    const enrollment = await prisma.$transaction(async (tx) => {
      const existingEnrollment = await tx.sectionEnrollment.findUnique({
        where: {
          studentId_sectionId: {
            studentId: student.id,
            sectionId: section.id,
          },
        },
      });

      if (
        existingEnrollment &&
        activeEnrollmentStatuses.includes(
          existingEnrollment.status as (typeof activeEnrollmentStatuses)[number],
        )
      ) {
        throw new Error("ALREADY_ENROLLED");
      }

      if (existingEnrollment && existingEnrollment.status !== "DROPPED") {
        throw new Error("CANNOT_REENROLL");
      }

      const enrolledCount = await tx.sectionEnrollment.count({
        where: {
          sectionId: section.id,
          status: {
            in: [...activeEnrollmentStatuses],
          },
        },
      });

      if (enrolledCount >= section.capacity) {
        throw new Error("NO_CAPACITY");
      }

      if (existingEnrollment) {
        return tx.sectionEnrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            enrollmentPeriodId: enrollmentPeriod.id,
            status: "ENROLLED",
            droppedAt: null,
            enrolledAt: new Date(),
          },
        });
      }

      return tx.sectionEnrollment.create({
        data: {
          studentId: student.id,
          sectionId: section.id,
          enrollmentPeriodId: enrollmentPeriod.id,
          status: "ENROLLED",
        },
      });
    });

    return NextResponse.json(
      {
        message: "Materia inscrita correctamente",
        data: {
          id: enrollment.id,
        },
      },
      { status: 201 },
    );
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos invalidos", errors: caughtError.flatten().fieldErrors },
        { status: 400 },
      );
    }

    if (
      caughtError instanceof Error &&
      caughtError.message === "NO_CAPACITY"
    ) {
      return NextResponse.json(
        { message: "La seccion seleccionada no tiene cupos disponibles" },
        { status: 409 },
      );
    }

    if (
      caughtError instanceof Error &&
      caughtError.message === "ALREADY_ENROLLED"
    ) {
      return NextResponse.json(
        { message: "Ya estas inscrito en la seccion seleccionada" },
        { status: 409 },
      );
    }

    if (
      caughtError instanceof Error &&
      caughtError.message === "CANNOT_REENROLL"
    ) {
      return NextResponse.json(
        { message: "No puedes reinscribir una materia con historial academico" },
        { status: 409 },
      );
    }

    const prismaError = caughtError as { code?: string };

    if (prismaError.code === "P2002") {
      return NextResponse.json(
        { message: "Ya estas inscrito en la seccion seleccionada" },
        { status: 409 },
      );
    }

    console.error("Error al inscribir materia", caughtError);

    return NextResponse.json(
      { message: "Error al inscribir materia" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { error, student } = await requireStudentProfile();
    if (error || !student) return error;

    const data = enrollmentCancelSchema.parse(await request.json());
    const enrollmentPeriod = await findActiveEnrollmentPeriod(student);

    if (!enrollmentPeriod) {
      return NextResponse.json(
        { message: "No hay un proceso de inscripcion activo para cancelar" },
        { status: 409 },
      );
    }

    const enrollment = await prisma.sectionEnrollment.findUnique({
      where: { id: data.enrollmentId },
      include: {
        section: {
          include: {
            term: true,
          },
        },
      },
    });

    if (!enrollment || enrollment.studentId !== student.id) {
      return NextResponse.json(
        { message: "Inscripcion no encontrada" },
        { status: 404 },
      );
    }

    if (
      !activeEnrollmentStatuses.includes(
        enrollment.status as (typeof activeEnrollmentStatuses)[number],
      )
    ) {
      return NextResponse.json(
        { message: "Solo puedes cancelar materias pendientes o inscritas" },
        { status: 409 },
      );
    }

    if (
      enrollment.section.termId !== enrollmentPeriod.termId ||
      enrollment.section.term.status !== "ACTIVE"
    ) {
      return NextResponse.json(
        { message: "Solo puedes cancelar inscripciones del periodo activo" },
        { status: 409 },
      );
    }

    await prisma.sectionEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: "DROPPED",
        droppedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Inscripcion cancelada correctamente",
    });
  } catch (caughtError) {
    if (caughtError instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Datos invalidos", errors: caughtError.flatten().fieldErrors },
        { status: 400 },
      );
    }

    console.error("Error al cancelar inscripcion", caughtError);

    return NextResponse.json(
      { message: "Error al cancelar inscripcion" },
      { status: 500 },
    );
  }
}

async function findActiveEnrollmentPeriod(
  student: NonNullable<Awaited<ReturnType<typeof requireStudentProfile>>["student"]>,
) {
  const now = new Date();
  const career = student.currentCareerOption.career;
  const school = career.school;

  return prisma.enrollmentPeriod.findFirst({
    where: {
      status: "OPEN",
      startsAt: {
        lte: now,
      },
      endsAt: {
        gte: now,
      },
      term: {
        status: "ACTIVE",
      },
      OR: [
        { careerOptionId: student.currentCareerOptionId },
        { careerOptionId: null, careerId: career.id },
        { careerOptionId: null, careerId: null, schoolId: school.id },
        {
          careerOptionId: null,
          careerId: null,
          schoolId: null,
          facultyId: school.facultyId,
        },
        {
          careerOptionId: null,
          careerId: null,
          schoolId: null,
          facultyId: null,
        },
      ],
    },
    include: {
      term: true,
    },
    orderBy: [
      { careerOptionId: "desc" },
      { careerId: "desc" },
      { schoolId: "desc" },
      { facultyId: "desc" },
      { startsAt: "asc" },
    ],
  });
}

function getApprovedSubjectIds(
  enrollments: NonNullable<
    Awaited<ReturnType<typeof requireStudentProfile>>["student"]
  >["enrollments"],
) {
  return new Set(
    enrollments
      .filter((enrollment) => enrollment.gradeStatus === "PASSED")
      .map((enrollment) => enrollment.section.subjectId),
  );
}

function getActiveSubjectIdsForTerm(
  enrollments: NonNullable<
    Awaited<ReturnType<typeof requireStudentProfile>>["student"]
  >["enrollments"],
  termId: string,
) {
  return new Set(
    enrollments
      .filter(
        (enrollment) =>
          activeEnrollmentStatuses.includes(
            enrollment.status as (typeof activeEnrollmentStatuses)[number],
          ) && enrollment.section.termId === termId,
      )
      .map((enrollment) => enrollment.section.subjectId),
  );
}

function getEligibleSubjectIds(
  curriculumSubjects: NonNullable<
    Awaited<ReturnType<typeof requireStudentProfile>>["student"]
  >["curriculum"]["subjects"],
  approvedSubjectIds: Set<string>,
  activeSubjectIds: Set<string>,
) {
  return new Set(
    curriculumSubjects
      .filter((curriculumSubject) => {
        if (approvedSubjectIds.has(curriculumSubject.subjectId)) return false;
        if (activeSubjectIds.has(curriculumSubject.subjectId)) return false;

        return curriculumSubject.subject.prerequisites.every((prerequisite) =>
          approvedSubjectIds.has(prerequisite.prerequisiteId),
        );
      })
      .map((curriculumSubject) => curriculumSubject.subjectId),
  );
}

function buildActiveEnrollmentPayload(
  enrollments: NonNullable<
    Awaited<ReturnType<typeof requireStudentProfile>>["student"]
  >["enrollments"],
) {
  return enrollments
    .filter(
      (enrollment) =>
        activeEnrollmentStatuses.includes(
          enrollment.status as (typeof activeEnrollmentStatuses)[number],
        ) && enrollment.section.term.status === "ACTIVE",
    )
    .map((enrollment) => ({
      id: enrollment.id,
      subject: {
        code: enrollment.section.subject.code,
        name: enrollment.section.subject.name,
      },
      section: {
        code: enrollment.section.sectionCode,
      },
      schedules: enrollment.section.schedules.map((schedule) => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startMinute: schedule.startMinute,
        endMinute: schedule.endMinute,
      })),
    }));
}

function hasScheduleConflict(
  candidateSchedules: ScheduleBlock[],
  currentSchedules: ScheduleBlock[],
) {
  return candidateSchedules.some((candidate) =>
    currentSchedules.some(
      (current) =>
        candidate.dayOfWeek === current.dayOfWeek &&
        candidate.startMinute < current.endMinute &&
        candidate.endMinute > current.startMinute,
    ),
  );
}
