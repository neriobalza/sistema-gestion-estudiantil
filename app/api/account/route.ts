import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/src/lib/prisma";
import { Role } from "@/src/generated/prisma/enums";
import type { Prisma } from "@/src/generated/prisma/client";

const emailSchema = z
  .string()
  .trim()
  .email()
  .transform((value) => value.toLowerCase());

const optionalTextSchema = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional();

const passwordSchema = z.string().min(8).max(128).optional();

const baseAccountUpdateSchema = z
  .object({
    email: emailSchema.optional(),
    password: passwordSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

const adminAccountUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(160).optional(),
    email: emailSchema.optional(),
    institutionalId: z.string().trim().min(1).max(80).optional(),
    employeeCode: optionalTextSchema,
    position: optionalTextSchema,
    password: passwordSchema,
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return jsonError("No autenticado", 401);
  }

  try {
    const user = await getAccount(session.user.id);

    if (!user) {
      return jsonError("Usuario no encontrado", 404);
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    return handleAccountApiError(error, "Error al obtener la cuenta");
  }
}

export async function PATCH(request: Request) {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    return jsonError("No autenticado", 401);
  }

  try {
    const userData: Prisma.UserUpdateInput = {};
    const payload = await request.json();

    if (session.user.role === Role.ADMIN) {
      const data = adminAccountUpdateSchema.parse(payload);
      const adminData: {
        employeeCode?: string | null;
        position?: string | null;
      } = {};

      if (data.name !== undefined) userData.name = data.name;
      if (data.email !== undefined) userData.email = data.email;
      if (data.institutionalId !== undefined) {
        userData.institutionalId = data.institutionalId;
      }
      if (data.password !== undefined) {
        userData.passwordHash = await bcrypt.hash(data.password, 12);
        userData.mustChangePassword = false;
      }
      if (data.employeeCode !== undefined) {
        adminData.employeeCode = data.employeeCode;
      }
      if (data.position !== undefined) adminData.position = data.position;

      if (Object.keys(adminData).length > 0) {
        userData.adminProfile = {
          upsert: {
            create: adminData,
            update: adminData,
          },
        };
      }
    } else {
      const data = baseAccountUpdateSchema.parse(payload);

      if (data.email !== undefined) userData.email = data.email;
      if (data.password !== undefined) {
        userData.passwordHash = await bcrypt.hash(data.password, 12);
        userData.mustChangePassword = false;
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: userData,
    });

    const user = await getAccount(session.user.id);

    return NextResponse.json({
      message: "Cuenta actualizada correctamente",
      data: user,
    });
  } catch (error) {
    return handleAccountApiError(error, "Error al actualizar la cuenta");
  }
}

function getAccount(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      institutionalId: true,
      role: true,
      status: true,
      mustChangePassword: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      adminProfile: {
        select: {
          employeeCode: true,
          position: true,
        },
      },
      professorProfile: {
        select: {
          employeeCode: true,
          phone: true,
          academicTitle: true,
          office: true,
          department: {
            select: {
              code: true,
              name: true,
              faculty: {
                select: {
                  code: true,
                  name: true,
                },
              },
            },
          },
        },
      },
      studentProfile: {
        select: {
          studentCode: true,
          nationalId: true,
          birthDate: true,
          phone: true,
          address: true,
          status: true,
          admissionTerm: {
            select: {
              code: true,
            },
          },
          currentCareerOption: {
            select: {
              code: true,
              name: true,
              career: {
                select: {
                  code: true,
                  name: true,
                  school: {
                    select: {
                      code: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
          curriculum: {
            select: {
              code: true,
              name: true,
              version: true,
            },
          },
        },
      },
    },
  });
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function handleAccountApiError(error: unknown, fallbackMessage: string) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        message: "Datos invalidos",
        errors: error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const prismaError = error as { code?: string };

  if (prismaError.code === "P2002") {
    return jsonError("Ya existe un usuario con esos datos unicos", 409);
  }

  if (prismaError.code === "P2025") {
    return jsonError("Usuario no encontrado", 404);
  }

  console.error(fallbackMessage, error);

  return jsonError(fallbackMessage, 500);
}
