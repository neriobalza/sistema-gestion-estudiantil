import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { academicTermWithOfferingsCreateSchema } from "../../validation";

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = academicTermWithOfferingsCreateSchema.parse(
      await request.json(),
    );

    const faculty = await prisma.faculty.findUnique({
      where: { id: data.facultyId },
      select: { id: true, name: true },
    });

    if (!faculty) {
      return jsonError("Facultad no encontrada", 404);
    }

    const validationError = await validateOfferingRelations(data);
    if (validationError) return validationError;

    const term = await prisma.$transaction(async (tx) => {
      const createdTerm = await tx.academicTerm.create({
        data: {
          code: data.code,
          year: data.year,
          period: data.period,
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          status: data.status,
          enrollmentPeriods: {
            create: {
              facultyId: data.facultyId,
              name: data.enrollmentName ?? `Inscripcion ${data.code}`,
              startsAt: data.enrollmentStartsAt,
              endsAt: data.enrollmentEndsAt,
            },
          },
        },
        include: {
          enrollmentPeriods: {
            include: {
              faculty: true,
            },
          },
        },
      });

      const sections = await Promise.all(
        data.offerings.map((offering) =>
          tx.courseSection.create({
            data: {
              termId: createdTerm.id,
              subjectId: offering.subjectId,
              professorId: offering.professorId,
              sectionCode: offering.sectionCode,
              capacity: offering.capacity,
              modality: offering.modality,
              schedules: {
                create: offering.schedules.map((schedule) => ({
                  classroomId: schedule.classroomId,
                  dayOfWeek: schedule.dayOfWeek,
                  startMinute: schedule.startMinute,
                  endMinute: schedule.endMinute,
                })),
              },
            },
            include: {
              subject: {
                include: {
                  department: true,
                },
              },
              professor: {
                include: {
                  user: true,
                },
              },
              schedules: {
                include: {
                  classroom: true,
                },
              },
            },
          }),
        ),
      );

      return {
        ...createdTerm,
        sections,
      };
    });

    return NextResponse.json(
      {
        message: "Periodo academico y oferta creados correctamente",
        data: term,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(
      error,
      "Error al crear el periodo academico con oferta",
    );
  }
}

async function validateOfferingRelations(
  data: ReturnType<typeof academicTermWithOfferingsCreateSchema.parse>,
) {
  const subjectIds = [...new Set(data.offerings.map((offering) => offering.subjectId))];
  const professorIds = [
    ...new Set(
      data.offerings
        .map((offering) => offering.professorId)
        .filter((professorId): professorId is string => Boolean(professorId)),
    ),
  ];
  const classroomIds = [
    ...new Set(
      data.offerings
        .flatMap((offering) =>
          offering.schedules.map((schedule) => schedule.classroomId),
        )
        .filter((classroomId): classroomId is string => Boolean(classroomId)),
    ),
  ];
  const sectionKeys = new Set<string>();

  for (const offering of data.offerings) {
    const sectionKey = `${offering.subjectId}:${offering.sectionCode}`;

    if (sectionKeys.has(sectionKey)) {
      return jsonError(
        "No puedes repetir la misma materia y seccion dentro del periodo",
        400,
      );
    }

    sectionKeys.add(sectionKey);
  }

  const [subjects, professors, classrooms] = await Promise.all([
    prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      select: {
        id: true,
        department: {
          select: {
            facultyId: true,
          },
        },
      },
    }),
    prisma.professorProfile.findMany({
      where: { id: { in: professorIds } },
      select: {
        id: true,
        department: {
          select: {
            facultyId: true,
          },
        },
      },
    }),
    prisma.classroom.findMany({
      where: { id: { in: classroomIds } },
      select: {
        id: true,
        facultyId: true,
      },
    }),
  ]);

  const subjectsById = new Map(subjects.map((subject) => [subject.id, subject]));
  const professorsById = new Map(
    professors.map((professor) => [professor.id, professor]),
  );
  const classroomsById = new Map(
    classrooms.map((classroom) => [classroom.id, classroom]),
  );

  for (const subjectId of subjectIds) {
    const subject = subjectsById.get(subjectId);

    if (!subject) {
      return jsonError("Una de las materias seleccionadas no existe", 400);
    }

    if (subject.department.facultyId !== data.facultyId) {
      return jsonError(
        "Todas las materias ofertadas deben pertenecer a la facultad seleccionada",
        400,
      );
    }
  }

  for (const professorId of professorIds) {
    const professor = professorsById.get(professorId);

    if (!professor) {
      return jsonError("Uno de los profesores seleccionados no existe", 400);
    }

    if (professor.department?.facultyId !== data.facultyId) {
      return jsonError(
        "Todos los profesores asignados deben pertenecer a la facultad seleccionada",
        400,
      );
    }
  }

  for (const classroomId of classroomIds) {
    const classroom = classroomsById.get(classroomId);

    if (!classroom) {
      return jsonError("Uno de los salones seleccionados no existe", 400);
    }

    if (classroom.facultyId !== data.facultyId) {
      return jsonError(
        "Todos los salones asignados deben pertenecer a la facultad seleccionada",
        400,
      );
    }
  }

  return null;
}
