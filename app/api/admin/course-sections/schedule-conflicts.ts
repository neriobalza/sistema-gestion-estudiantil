import { prisma } from "@/src/lib/prisma";
import { jsonError } from "@/src/lib/api/admin";
import type { DayOfWeek } from "@/src/generated/prisma/enums";

type ScheduleInput = {
  classroomId?: string | null;
  dayOfWeek: DayOfWeek;
  startMinute: number;
  endMinute: number;
};

type SectionScheduleInput = {
  sectionLabel?: string;
  schedules?: ScheduleInput[];
};

export async function validateSectionScheduleAvailability({
  termId,
  schedules,
  excludeSectionId,
}: {
  termId: string;
  schedules?: ScheduleInput[];
  excludeSectionId?: string;
}) {
  const internalConflict = findInternalScheduleConflict([
    {
      schedules,
    },
  ]);

  if (internalConflict) {
    return jsonError(buildConflictMessage(internalConflict), 409);
  }

  for (const schedule of schedules ?? []) {
    if (!schedule.classroomId) continue;

    const conflictingSchedule = await prisma.sectionSchedule.findFirst({
      where: {
        classroomId: schedule.classroomId,
        dayOfWeek: schedule.dayOfWeek,
        startMinute: {
          lt: schedule.endMinute,
        },
        endMinute: {
          gt: schedule.startMinute,
        },
        section: {
          termId,
          id: excludeSectionId
            ? {
                not: excludeSectionId,
              }
            : undefined,
        },
      },
      select: {
        classroom: {
          select: {
            code: true,
          },
        },
        section: {
          select: {
            sectionCode: true,
            subject: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    });

    if (conflictingSchedule) {
      return jsonError(
        buildConflictMessage({
          classroomCode:
            conflictingSchedule.classroom?.code ?? "el salon seleccionado",
          dayOfWeek: schedule.dayOfWeek,
          startMinute: schedule.startMinute,
          endMinute: schedule.endMinute,
          existingSectionLabel: `${conflictingSchedule.section.subject.code}-${conflictingSchedule.section.sectionCode}`,
        }),
        409,
      );
    }
  }

  return null;
}

export function validateBatchScheduleAvailability(
  sections: SectionScheduleInput[],
) {
  const internalConflict = findInternalScheduleConflict(sections);

  if (!internalConflict) return null;

  return jsonError(buildConflictMessage(internalConflict), 409);
}

function findInternalScheduleConflict(sections: SectionScheduleInput[]) {
  const schedules = sections.flatMap((section, sectionIndex) =>
    (section.schedules ?? [])
      .filter((schedule) => Boolean(schedule.classroomId))
      .map((schedule) => ({
        ...schedule,
        sectionLabel: section.sectionLabel ?? `seccion ${sectionIndex + 1}`,
      })),
  );

  for (let index = 0; index < schedules.length; index += 1) {
    const currentSchedule = schedules[index];

    for (
      let compareIndex = index + 1;
      compareIndex < schedules.length;
      compareIndex += 1
    ) {
      const comparedSchedule = schedules[compareIndex];

      if (
        currentSchedule.classroomId === comparedSchedule.classroomId &&
        currentSchedule.dayOfWeek === comparedSchedule.dayOfWeek &&
        schedulesOverlap(currentSchedule, comparedSchedule)
      ) {
        return {
          classroomCode: "el salon seleccionado",
          dayOfWeek: currentSchedule.dayOfWeek,
          startMinute: Math.max(
            currentSchedule.startMinute,
            comparedSchedule.startMinute,
          ),
          endMinute: Math.min(
            currentSchedule.endMinute,
            comparedSchedule.endMinute,
          ),
          existingSectionLabel: comparedSchedule.sectionLabel,
        };
      }
    }
  }

  return null;
}

function schedulesOverlap(first: ScheduleInput, second: ScheduleInput) {
  return first.startMinute < second.endMinute && first.endMinute > second.startMinute;
}

function buildConflictMessage({
  classroomCode,
  dayOfWeek,
  startMinute,
  endMinute,
  existingSectionLabel,
}: {
  classroomCode: string;
  dayOfWeek: string;
  startMinute: number;
  endMinute: number;
  existingSectionLabel?: string;
}) {
  const sectionText = existingSectionLabel
    ? ` con la seccion ${existingSectionLabel}`
    : "";

  return `El salon ${classroomCode} ya esta ocupado${sectionText} el ${getDayLabel(
    dayOfWeek,
  )} de ${formatMinute(startMinute)} a ${formatMinute(
    endMinute,
  )}. Cambia el salon o el horario.`;
}

function formatMinute(value: number) {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function getDayLabel(dayOfWeek: string) {
  const labels: Record<string, string> = {
    MONDAY: "lunes",
    TUESDAY: "martes",
    WEDNESDAY: "miercoles",
    THURSDAY: "jueves",
    FRIDAY: "viernes",
    SATURDAY: "sabado",
    SUNDAY: "domingo",
  };

  return labels[dayOfWeek] ?? dayOfWeek;
}
