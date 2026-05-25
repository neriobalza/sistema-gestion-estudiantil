import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { prisma } from "@/src/lib/prisma";
import { AcademicTermDetailClient } from "./AcademicTermDetailClient";

type AcademicTermDetailPageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function AcademicTermDetailPage({
  params,
}: AcademicTermDetailPageProps) {
  await requireAdmin();

  const { id } = await params;

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
        orderBy: [{ subject: { code: "asc" } }, { sectionCode: "asc" }],
        include: {
          subject: {
            include: {
              department: true,
            },
          },
          professor: {
            include: {
              user: true,
              department: true,
            },
          },
          schedules: {
            orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
            include: {
              classroom: true,
            },
          },
          _count: {
            select: {
              enrollments: true,
              gradeItems: true,
            },
          },
        },
      },
      _count: {
        select: {
          enrollmentPeriods: true,
          sections: true,
          admittedStudents: true,
          curriculaEffective: true,
        },
      },
    },
  });

  if (!term) {
    notFound();
  }

  const facultyId =
    term.enrollmentPeriods.find((period) => period.facultyId)?.facultyId ??
    term.sections[0]?.subject.department.facultyId ??
    "";

  const [subjects, professors, classrooms] = await Promise.all([
    prisma.subject.findMany({
      where: {
        isActive: true,
        department: facultyId ? { facultyId } : undefined,
      },
      orderBy: [{ department: { name: "asc" } }, { code: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        department: {
          select: {
            name: true,
            facultyId: true,
          },
        },
      },
    }),
    prisma.professorProfile.findMany({
      where: {
        department: facultyId ? { facultyId } : undefined,
      },
      orderBy: { employeeCode: "asc" },
      select: {
        id: true,
        employeeCode: true,
        user: {
          select: {
            name: true,
          },
        },
        department: {
          select: {
            facultyId: true,
            name: true,
          },
        },
      },
    }),
    prisma.classroom.findMany({
      where: facultyId ? { facultyId } : undefined,
      orderBy: { code: "asc" },
      select: {
        id: true,
        facultyId: true,
        code: true,
        building: true,
        room: true,
        capacity: true,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/academic-terms"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-[#031b46]"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a períodos
      </Link>

      <AcademicTermDetailClient
        term={{
          id: term.id,
          code: term.code,
          year: term.year,
          period: term.period,
          startsAt: toInputDate(term.startsAt),
          endsAt: toInputDate(term.endsAt),
          status: term.status,
          enrollmentPeriods: term.enrollmentPeriods.map((period) => ({
            id: period.id,
            name: period.name,
            startsAt: toInputDate(period.startsAt),
            endsAt: toInputDate(period.endsAt),
            status: period.status,
            facultyName: period.faculty?.name ?? null,
            schoolName: period.school?.name ?? null,
            careerName: period.career?.name ?? null,
            careerOptionName: period.careerOption?.name ?? null,
          })),
          sections: term.sections.map((section) => ({
            id: section.id,
            subjectId: section.subjectId,
            professorId: section.professorId,
            sectionCode: section.sectionCode,
            capacity: section.capacity,
            modality: section.modality,
            status: section.status,
            subject: {
              code: section.subject.code,
              name: section.subject.name,
              departmentName: section.subject.department.name,
            },
            professor: section.professor
              ? {
                  employeeCode: section.professor.employeeCode,
                  name: section.professor.user.name,
                }
              : null,
            schedules: section.schedules.map((schedule) => ({
              id: schedule.id,
              classroomId: schedule.classroomId,
              dayOfWeek: schedule.dayOfWeek,
              startMinute: schedule.startMinute,
              endMinute: schedule.endMinute,
              classroom: schedule.classroom
                ? {
                    code: schedule.classroom.code,
                    building: schedule.classroom.building,
                    room: schedule.classroom.room,
                  }
                : null,
            })),
            enrollmentsCount: section._count.enrollments,
            gradeItemsCount: section._count.gradeItems,
          })),
          counts: {
            enrollmentPeriods: term._count.enrollmentPeriods,
            sections: term._count.sections,
            admittedStudents: term._count.admittedStudents,
            curriculaEffective: term._count.curriculaEffective,
          },
        }}
        subjects={subjects}
        professors={professors}
        classrooms={classrooms}
      />
    </div>
  );
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}
