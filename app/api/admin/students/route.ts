import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@/src/generated/prisma/enums";
import { handleApiError, jsonError, requireApiAdmin } from "@/src/lib/api/admin";
import { studentAdmissionCreateSchema } from "../validation";

type ScheduleBlock = {
  dayOfWeek: string;
  startMinute: number;
  endMinute: number;
};

type CandidateSection = {
  id: string;
  subjectId: string;
  subject: {
    code: string;
    name: string;
  };
  professor: {
    user: {
      name: string | null;
    };
  } | null;
  sectionCode: string;
  capacity: number;
  modality: string;
  schedules: {
    dayOfWeek: string;
    startMinute: number;
    endMinute: number;
    classroom: {
      code: string;
      building: string | null;
      room: string | null;
    } | null;
  }[];
  _count: {
    enrollments: number;
  };
};

export async function GET() {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const students = await prisma.studentProfile.findMany({
      orderBy: { studentCode: "asc" },
      include: {
        user: true,
        currentCareerOption: {
          include: {
            career: true,
          },
        },
        curriculum: true,
      },
    });

    return NextResponse.json({ data: students });
  } catch (error) {
    return handleApiError(error, "Error al obtener los estudiantes");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = studentAdmissionCreateSchema.parse(await request.json());
    const now = new Date();

    const [term, curriculum] = await Promise.all([
      prisma.academicTerm.findUnique({
        where: { id: data.admissionTermId },
      }),
      prisma.curriculum.findUnique({
        where: { id: data.curriculumId },
        include: {
          subjects: {
            where: {
              semesterNumber: 1,
              requirementType: "REQUIRED",
            },
            include: {
              subject: true,
            },
            orderBy: [{ subject: { code: "asc" } }],
          },
          careerOption: true,
        },
      }),
    ]);

    if (!term) {
      return jsonError("El periodo academico indicado no existe", 404);
    }

    if (term.status !== "PLANNED" || term.startsAt <= now) {
      return jsonError(
        "El estudiante solo puede ser admitido en un periodo planificado que no haya comenzado",
        400,
      );
    }

    if (!curriculum || curriculum.careerOptionId !== data.careerOptionId) {
      return jsonError(
        "El pensum no pertenece a la carrera/opcion seleccionada",
        400,
      );
    }

    if (curriculum.status !== "ACTIVE") {
      return jsonError("El pensum seleccionado debe estar activo", 400);
    }

    const firstSemesterSubjects = curriculum.subjects.map(
      (curriculumSubject) => curriculumSubject.subject,
    );

    if (firstSemesterSubjects.length === 0) {
      return jsonError(
        "El pensum no tiene materias obligatorias configuradas para primer semestre",
        400,
      );
    }

    const subjectIds = firstSemesterSubjects.map((subject) => subject.id);
    const sections = await prisma.courseSection.findMany({
      where: {
        termId: term.id,
        subjectId: {
          in: subjectIds,
        },
        status: {
          in: ["PLANNED", "OPEN"],
        },
      },
      include: {
        subject: {
          select: {
            code: true,
            name: true,
          },
        },
        professor: {
          select: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        schedules: {
          include: {
            classroom: {
              select: {
                code: true,
                building: true,
                room: true,
              },
            },
          },
          orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: [{ subject: { code: "asc" } }, { sectionCode: "asc" }],
    });

    const assignedSections = chooseSections(firstSemesterSubjects, sections);

    if (!assignedSections) {
      return jsonError(
        describeAssignmentFailure(firstSemesterSubjects, sections),
        409,
      );
    }

    const enrollmentPeriod = await prisma.enrollmentPeriod.findFirst({
      where: {
        termId: term.id,
        status: {
          in: ["SCHEDULED", "OPEN"],
        },
        OR: [
          { careerOptionId: data.careerOptionId },
          { careerOptionId: null, careerId: null, schoolId: null },
        ],
      },
      orderBy: { startsAt: "asc" },
      select: { id: true },
    });

    const temporaryPassword = createTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 12);

    const student = await prisma.$transaction(async (tx) => {
      for (const section of assignedSections) {
        const current = await tx.sectionEnrollment.count({
          where: { sectionId: section.id },
        });

        if (current >= section.capacity) {
          throw new Error(`NO_CAPACITY:${section.subject.code}`);
        }
      }

      return tx.studentProfile.create({
        data: {
          studentCode: data.studentCode,
          nationalId: data.nationalId,
          birthDate: data.birthDate,
          phone: data.phone,
          address: data.address,
          admissionTerm: {
            connect: {
              id: term.id,
            },
          },
          currentCareerOption: {
            connect: {
              id: data.careerOptionId,
            },
          },
          curriculum: {
            connect: {
              id: data.curriculumId,
            },
          },
          user: {
            create: {
              name: data.name,
              email: data.email,
              institutionalId: data.institutionalId,
              passwordHash,
              role: Role.STUDENT,
            },
          },
          enrollments: {
            create: assignedSections.map((section) => ({
              section: {
                connect: {
                  id: section.id,
                },
              },
              enrollmentPeriod: enrollmentPeriod
                ? {
                    connect: {
                      id: enrollmentPeriod.id,
                    },
                  }
                : undefined,
              status: "ENROLLED",
            })),
          },
        },
        include: {
          user: true,
          currentCareerOption: {
            include: {
              career: true,
            },
          },
          curriculum: true,
          admissionTerm: true,
          enrollments: {
            include: {
              section: {
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
                },
              },
            },
            orderBy: { createdAt: "asc" },
          },
        },
      });
    });

    return NextResponse.json(
      {
        message: "Estudiante registrado e inscrito correctamente",
        data: {
          student,
          temporaryPassword,
          schedule: student.enrollments.map((enrollment) => enrollment.section),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("NO_CAPACITY:")) {
      return jsonError(
        `La seccion de ${error.message.replace("NO_CAPACITY:", "")} se quedo sin cupos durante el registro`,
        409,
      );
    }

    return handleApiError(error, "Error al registrar el estudiante");
  }
}

function chooseSections(subjects: { id: string }[], sections: CandidateSection[]) {
  const sectionsBySubject = new Map<string, CandidateSection[]>();

  for (const subject of subjects) {
    const candidates = sections
      .filter(
        (section) =>
          section.subjectId === subject.id &&
          section._count.enrollments < section.capacity,
      )
      .sort(
        (left, right) =>
          right.capacity -
          right._count.enrollments -
          (left.capacity - left._count.enrollments),
      );

    if (candidates.length === 0) return null;
    sectionsBySubject.set(subject.id, candidates);
  }

  const orderedSubjects = [...subjects].sort(
    (left, right) =>
      (sectionsBySubject.get(left.id)?.length ?? 0) -
      (sectionsBySubject.get(right.id)?.length ?? 0),
  );

  return assignSection(orderedSubjects, sectionsBySubject, [], []);
}

function describeAssignmentFailure(
  subjects: { id: string; code: string; name: string }[],
  sections: CandidateSection[],
) {
  const missingSubjects = subjects.filter(
    (subject) =>
      !sections.some((section) => section.subjectId === subject.id),
  );

  if (missingSubjects.length > 0) {
    return `No hay secciones ofertadas para: ${formatSubjectList(missingSubjects)}`;
  }

  const fullSubjects = subjects.filter(
    (subject) =>
      !sections.some(
        (section) =>
          section.subjectId === subject.id &&
          section._count.enrollments < section.capacity,
      ),
  );

  if (fullSubjects.length > 0) {
    return `No hay cupos disponibles para: ${formatSubjectList(fullSubjects)}`;
  }

  const availableSections = sections.filter(
    (section) => section._count.enrollments < section.capacity,
  );
  const conflict = findFirstSectionConflict(availableSections);

  if (conflict) {
    return `No hay horarios compatibles para asignar todas las materias de primer semestre. Conflicto: ${conflict.left.subject.code} ${conflict.left.subject.name} se solapa con ${conflict.right.subject.code} ${conflict.right.subject.name} el ${dayLabel(conflict.block.dayOfWeek)} de ${formatMinutes(conflict.block.startMinute)} a ${formatMinutes(conflict.block.endMinute)}.`;
  }

  return "No hay cupos u horarios compatibles para asignar todas las materias de primer semestre";
}

function findFirstSectionConflict(sections: CandidateSection[]) {
  for (let leftIndex = 0; leftIndex < sections.length; leftIndex += 1) {
    const left = sections[leftIndex];

    for (let rightIndex = leftIndex + 1; rightIndex < sections.length; rightIndex += 1) {
      const right = sections[rightIndex];
      if (left.subjectId === right.subjectId) continue;

      for (const leftSchedule of left.schedules) {
        for (const rightSchedule of right.schedules) {
          if (
            leftSchedule.dayOfWeek === rightSchedule.dayOfWeek &&
            leftSchedule.startMinute < rightSchedule.endMinute &&
            leftSchedule.endMinute > rightSchedule.startMinute
          ) {
            return {
              left,
              right,
              block: {
                dayOfWeek: leftSchedule.dayOfWeek,
                startMinute: Math.max(
                  leftSchedule.startMinute,
                  rightSchedule.startMinute,
                ),
                endMinute: Math.min(leftSchedule.endMinute, rightSchedule.endMinute),
              },
            };
          }
        }
      }
    }
  }

  return null;
}

function assignSection(
  subjects: { id: string }[],
  sectionsBySubject: Map<string, CandidateSection[]>,
  selected: CandidateSection[],
  occupiedBlocks: ScheduleBlock[],
): CandidateSection[] | null {
  if (selected.length === subjects.length) return selected;

  const subject = subjects[selected.length];
  const candidates = sectionsBySubject.get(subject.id) ?? [];

  for (const candidate of candidates) {
    const scheduleBlocks = candidate.schedules.map((schedule) => ({
      dayOfWeek: schedule.dayOfWeek,
      startMinute: schedule.startMinute,
      endMinute: schedule.endMinute,
    }));

    if (scheduleBlocks.some((block) => hasScheduleConflict(block, occupiedBlocks))) {
      continue;
    }

    const result = assignSection(
      subjects,
      sectionsBySubject,
      [...selected, candidate],
      [...occupiedBlocks, ...scheduleBlocks],
    );

    if (result) return result;
  }

  return null;
}

function hasScheduleConflict(block: ScheduleBlock, occupiedBlocks: ScheduleBlock[]) {
  return occupiedBlocks.some(
    (occupiedBlock) =>
      occupiedBlock.dayOfWeek === block.dayOfWeek &&
      block.startMinute < occupiedBlock.endMinute &&
      block.endMinute > occupiedBlock.startMinute,
  );
}

function createTemporaryPassword() {
  return `Ula-${randomBytes(4).toString("hex")}`;
}

function formatSubjectList(subjects: { code: string; name: string }[]) {
  return subjects
    .map((subject) => `${subject.code} ${subject.name}`)
    .join(", ");
}

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
}

function dayLabel(day: string) {
  const labels: Record<string, string> = {
    MONDAY: "lunes",
    TUESDAY: "martes",
    WEDNESDAY: "miercoles",
    THURSDAY: "jueves",
    FRIDAY: "viernes",
    SATURDAY: "sabado",
    SUNDAY: "domingo",
  };

  return labels[day] ?? day;
}
