import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { handleApiError, requireApiAdmin } from "@/src/lib/api/admin";
import { curriculumSubjectCreateSchema } from "../validation";

export async function GET(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { searchParams } = new URL(request.url);
  const curriculumId = searchParams.get("curriculumId") ?? undefined;
  const subjectId = searchParams.get("subjectId") ?? undefined;
  const electiveGroupId = searchParams.get("electiveGroupId") ?? undefined;
  const requirementType = searchParams.get("requirementType") ?? undefined;

  try {
    const curriculumSubjects = await prisma.curriculumSubject.findMany({
      where: {
        curriculumId,
        subjectId,
        electiveGroupId,
        requirementType: requirementType as "REQUIRED" | "ELECTIVE" | undefined,
      },
      orderBy: [{ semesterNumber: "asc" }, { subject: { code: "asc" } }],
      include: {
        curriculum: {
          include: {
            careerOption: {
              include: {
                career: true,
              },
            },
          },
        },
        subject: {
          include: {
            department: {
              include: {
                faculty: true,
              },
            },
          },
        },
        electiveGroup: true,
      },
    });

    return NextResponse.json({ data: curriculumSubjects });
  } catch (error) {
    return handleApiError(error, "Error al obtener las materias del pensum");
  }
}

export async function POST(request: Request) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  try {
    const data = curriculumSubjectCreateSchema.parse(await request.json());
    const [curriculum, subject, electiveGroup] = await Promise.all([
      prisma.curriculum.findUnique({
        where: { id: data.curriculumId },
        select: { id: true },
      }),
      prisma.subject.findUnique({
        where: { id: data.subjectId },
        select: { id: true, isActive: true },
      }),
      data.electiveGroupId
        ? prisma.electiveGroup.findUnique({
            where: { id: data.electiveGroupId },
            select: { curriculumId: true },
          })
        : Promise.resolve(null),
    ]);

    if (!curriculum) {
      return NextResponse.json({ message: "Pensum no encontrado" }, { status: 404 });
    }

    if (!subject || !subject.isActive) {
      return NextResponse.json(
        { message: "La materia no existe o no esta activa" },
        { status: 400 },
      );
    }

    if (data.electiveGroupId && electiveGroup?.curriculumId !== data.curriculumId) {
      return NextResponse.json(
        { message: "El grupo electivo no pertenece a este pensum" },
        { status: 400 },
      );
    }

    const curriculumSubject = await prisma.curriculumSubject.create({
      data,
      include: {
        curriculum: true,
        subject: true,
        electiveGroup: true,
      },
    });

    return NextResponse.json(
      {
        message: "Materia agregada al pensum correctamente",
        data: curriculumSubject,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error, "Error al agregar la materia al pensum");
  }
}
