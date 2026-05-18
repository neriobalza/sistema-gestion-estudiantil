"use server";

import { prisma } from "@/src/lib/prisma";
import { requireAdmin } from "@/src/lib/auth/require-admin";
import { facultyCreateSchema } from "@/app/api/admin/validation";

export type CreateFacultyState = {
  status: "idle" | "success" | "error";
  message: string;
  errors?: Record<string, string[] | undefined>;
};

export async function createFacultyAction(
  _previousState: CreateFacultyState,
  formData: FormData,
): Promise<CreateFacultyState> {
  await requireAdmin();

  const result = facultyCreateSchema.safeParse({
    code: formData.get("code"),
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!result.success) {
    return {
      status: "error",
      message: "Revisa los campos del formulario.",
      errors: result.error.flatten().fieldErrors,
    };
  }

  try {
    await prisma.faculty.create({
      data: result.data,
    });

    return {
      status: "success",
      message: "Facultad creada correctamente.",
    };
  } catch (error) {
    const prismaError = error as { code?: string };

    if (prismaError.code === "P2002") {
      return {
        status: "error",
        message: "Ya existe una facultad con ese codigo.",
      };
    }

    return {
      status: "error",
      message: "Error al crear la facultad.",
    };
  }
}
