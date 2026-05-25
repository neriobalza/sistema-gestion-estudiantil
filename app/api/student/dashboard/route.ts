import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@/src/generated/prisma/enums";

const activeEnrollmentStatuses = new Set(["PENDING", "ENROLLED"]);

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  }

  if (session.user.role !== Role.STUDENT) {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  try {
    const student = await prisma.studentProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        admissionTerm: true,
        currentCareerOption: {
          include: {
            career: {
              include: {
                school: {
                  include: {
                    faculty: true,
                  },
                },
              },
            },
          },
        },
        curriculum: {
          include: {
            subjects: {
              orderBy: [{ semesterNumber: "asc" }, { subject: { code: "asc" } }],
              include: {
                subject: true,
              },
            },
          },
        },
        enrollments: {
          orderBy: [
            { section: { term: { year: "desc" } } },
            { section: { subject: { code: "asc" } } },
          ],
          include: {
            enrollmentPeriod: {
              include: {
                term: true,
              },
            },
            grades: {
              include: {
                gradeItem: true,
              },
              orderBy: { gradeItem: { name: "asc" } },
            },
            section: {
              include: {
                term: true,
                subject: true,
                professor: {
                  include: {
                    user: true,
                  },
                },
                schedules: {
                  orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
                  include: {
                    classroom: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Perfil de estudiante no encontrado" },
        { status: 404 },
      );
    }

    const creditsBySubjectId = new Map(
      student.curriculum.subjects.map((curriculumSubject) => [
        curriculumSubject.subjectId,
        curriculumSubject.credits,
      ]),
    );
    const gradedEnrollments = student.enrollments.filter(
      (enrollment) =>
        enrollment.finalGrade !== null &&
        enrollment.status !== "DROPPED" &&
        enrollment.gradeStatus !== "WITHDRAWN",
    );
    const totalGradeCredits = gradedEnrollments.reduce(
      (sum, enrollment) =>
        sum + (creditsBySubjectId.get(enrollment.section.subjectId) ?? 0),
      0,
    );
    const gradePoints = gradedEnrollments.reduce((sum, enrollment) => {
      const credits = creditsBySubjectId.get(enrollment.section.subjectId) ?? 0;
      return sum + Number(enrollment.finalGrade) * credits;
    }, 0);
    const average =
      totalGradeCredits > 0
        ? gradePoints / totalGradeCredits
        : gradedEnrollments.length > 0
          ? gradedEnrollments.reduce(
              (sum, enrollment) => sum + Number(enrollment.finalGrade),
              0,
            ) / gradedEnrollments.length
          : null;
    const approvedSubjectIds = new Set(
      student.enrollments
        .filter((enrollment) => enrollment.gradeStatus === "PASSED")
        .map((enrollment) => enrollment.section.subjectId),
    );
    const approvedCredits = student.curriculum.subjects.reduce(
      (sum, curriculumSubject) =>
        approvedSubjectIds.has(curriculumSubject.subjectId)
          ? sum + curriculumSubject.credits
          : sum,
      0,
    );
    const totalCredits =
      student.curriculum.totalCredits ??
      student.curriculum.subjects.reduce(
        (sum, curriculumSubject) => sum + curriculumSubject.credits,
        0,
      );
    const activeEnrollments = student.enrollments.filter((enrollment) =>
      activeEnrollmentStatuses.has(enrollment.status),
    );

    return NextResponse.json({
      data: {
        student: {
          id: student.id,
          name: student.user.name,
          email: student.user.email,
          institutionalId: student.user.institutionalId,
          studentCode: student.studentCode,
          nationalId: student.nationalId,
          birthDate: student.birthDate?.toISOString() ?? null,
          phone: student.phone,
          address: student.address,
          status: student.status,
          admissionTerm: student.admissionTerm
            ? {
                code: student.admissionTerm.code,
                startsAt: student.admissionTerm.startsAt.toISOString(),
              }
            : null,
          career: {
            faculty: student.currentCareerOption.career.school.faculty.name,
            school: student.currentCareerOption.career.school.name,
            name: student.currentCareerOption.career.name,
            option: student.currentCareerOption.name,
          },
          curriculum: {
            code: student.curriculum.code,
            name: student.curriculum.name,
            version: student.curriculum.version,
            totalCredits,
          },
        },
        summary: {
          average: average === null ? null : roundToTwo(average),
          enrollmentGroup: getEnrollmentGroup(average),
          approvedCredits,
          totalCredits,
          approvedSubjects: approvedSubjectIds.size,
          totalSubjects: student.curriculum.subjects.length,
          activeEnrollments: activeEnrollments.length,
        },
        enrollments: student.enrollments.map((enrollment) => ({
          id: enrollment.id,
          status: enrollment.status,
          finalGrade:
            enrollment.finalGrade === null ? null : Number(enrollment.finalGrade),
          gradeStatus: enrollment.gradeStatus,
          termCode: enrollment.section.term.code,
          enrollmentPeriodName: enrollment.enrollmentPeriod?.name ?? null,
          subject: {
            code: enrollment.section.subject.code,
            name: enrollment.section.subject.name,
            credits:
              creditsBySubjectId.get(enrollment.section.subjectId) ??
              enrollment.section.subject.credits,
          },
          section: {
            code: enrollment.section.sectionCode,
            modality: enrollment.section.modality,
            professorName: enrollment.section.professor?.user.name ?? null,
          },
          grades: enrollment.grades.map((grade) => ({
            id: grade.id,
            itemName: grade.gradeItem.name,
            score: Number(grade.score),
            maxScore: Number(grade.gradeItem.maxScore),
            weight: Number(grade.gradeItem.weight),
            gradedAt: grade.gradedAt.toISOString(),
          })),
          schedules: enrollment.section.schedules.map((schedule) => ({
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
        curriculumSubjects: student.curriculum.subjects.map(
          (curriculumSubject) => ({
            id: curriculumSubject.id,
            semesterNumber: curriculumSubject.semesterNumber,
            requirementType: curriculumSubject.requirementType,
            credits: curriculumSubject.credits,
            minPassingGrade: Number(curriculumSubject.minPassingGrade),
            subject: {
              code: curriculumSubject.subject.code,
              name: curriculumSubject.subject.name,
            },
            approved: approvedSubjectIds.has(curriculumSubject.subjectId),
          }),
        ),
      },
    });
  } catch (error) {
    console.error("Error al obtener el dashboard del estudiante", error);

    return NextResponse.json(
      { message: "Error al obtener el dashboard del estudiante" },
      { status: 500 },
    );
  }
}

function getEnrollmentGroup(average: number | null) {
  if (average === null) return null;
  if (average >= 16) return 1;
  if (average >= 14) return 2;
  if (average >= 12) return 3;
  if (average >= 10) return 4;
  if (average >= 8) return 5;
  if (average >= 6) return 6;
  return 7;
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}
