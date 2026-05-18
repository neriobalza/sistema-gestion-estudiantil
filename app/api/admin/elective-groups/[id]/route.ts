import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import {
  handleApiError,
  jsonError,
  requireApiAdmin,
} from "@/src/lib/api/admin";
import { electiveGroupUpdateSchema } from "../../validation";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const electiveGroup = await prisma.electiveGroup.findUnique({
      where: { id },
      include: {
        curriculum: {
          include: {
            careerOption: {
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
        subjects: {
          include: {
            subject: true,
          },
          orderBy: [{ semesterNumber: "asc" }, { subject: { code: "asc" } }],
        },
      },
    });

    if (!electiveGroup) {
      return jsonError("Grupo electivo no encontrado", 404);
    }

    return NextResponse.json({ data: electiveGroup });
  } catch (error) {
    return handleApiError(error, "Error al obtener el grupo electivo");
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const authError = await requireApiAdmin();
  if (authError) return authError;

  const { id } = await params;

  try {
    const data = electiveGroupUpdateSchema.parse(await request.json());

    const electiveGroup = await prisma.electiveGroup.update({
      where: { id },
      data,
      include: {
        curriculum: true,
      },
    });

    return NextResponse.json({
      message: "Grupo electivo actualizado correctamente",
      data: electiveGroup,
    });
  } catch (error) {
    return handleApiError(error, "Error al actualizar el grupo electivo");
  }
}
