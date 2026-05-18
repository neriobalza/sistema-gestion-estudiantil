import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional();

const optionalId = z
  .string()
  .trim()
  .transform((value) => (value.length > 0 ? value : null))
  .optional();

const code = z
  .string()
  .trim()
  .min(2)
  .max(20)
  .transform((value) => value.toUpperCase());
const name = z.string().trim().min(2).max(160);
const id = z.string().trim().min(1);
const optionalPositiveInt = z.coerce.number().int().positive().optional();
const nullablePositiveInt = z
  .union([z.coerce.number().int().positive(), z.null()])
  .optional();

const dateValue = z.coerce.date();

const booleanValue = z.coerce.boolean();

export const curriculumStatusSchema = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);
export const academicPeriodSchema = z.enum(["FIRST", "SECOND", "SUMMER"]);
export const termStatusSchema = z.enum(["PLANNED", "ACTIVE", "CLOSED"]);
export const userStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
export const modalitySchema = z.enum(["IN_PERSON", "ONLINE", "HYBRID"]);
export const sectionStatusSchema = z.enum([
  "PLANNED",
  "OPEN",
  "CLOSED",
  "CANCELLED",
]);
export const dayOfWeekSchema = z.enum([
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
]);

export const facultyCreateSchema = z.object({
  code,
  name,
  description: optionalText,
});

export const facultyUpdateSchema = facultyCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

export const schoolCreateSchema = z.object({
  facultyId: id,
  code,
  name,
  description: optionalText,
});

export const schoolUpdateSchema = schoolCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

export const departmentCreateSchema = z.object({
  facultyId: id,
  code,
  name,
  description: optionalText,
});

export const departmentUpdateSchema = departmentCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

export const classroomCreateSchema = z.object({
  facultyId: id,
  code,
  building: optionalText,
  room: optionalText,
  capacity: z.coerce.number().int().positive().optional(),
});

export const classroomUpdateSchema = classroomCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

export const subjectCreateSchema = z.object({
  departmentId: id,
  code,
  name,
  description: optionalText,
  credits: z.coerce.number().int().positive(),
  hoursPerWeek: optionalPositiveInt,
  isActive: booleanValue.optional(),
});

export const subjectUpdateSchema = subjectCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

export const curriculumCreateSchema = z.object({
  careerOptionId: id,
  code,
  name,
  version: z.coerce.number().int().positive(),
  status: curriculumStatusSchema.optional(),
  totalCredits: nullablePositiveInt,
  effectiveFromTermId: optionalId,
});

export const curriculumUpdateSchema = curriculumCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar" },
);

const academicTermBaseSchema = z.object({
  code,
  year: z.coerce.number().int().min(1900).max(2200),
  period: academicPeriodSchema,
  startsAt: dateValue,
  endsAt: dateValue,
  status: termStatusSchema.optional(),
  facultyId: optionalId,
  enrollmentName: optionalText,
});

export const academicTermCreateSchema = academicTermBaseSchema.refine(
  (data) => data.endsAt >= data.startsAt,
  {
    message: "La fecha de fin debe ser posterior o igual a la fecha de inicio",
    path: ["endsAt"],
  },
);

export const academicTermUpdateSchema = academicTermBaseSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  })
  .refine(
    (data) => {
      if (!data.startsAt || !data.endsAt) return true;
      return data.endsAt >= data.startsAt;
    },
    {
      message:
        "La fecha de fin debe ser posterior o igual a la fecha de inicio",
      path: ["endsAt"],
    },
  );

export const professorCreateSchema = z.object({
  name,
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  institutionalId: id,
  password: z.string().min(8),
  employeeCode: id,
  departmentId: optionalId,
  phone: optionalText,
  academicTitle: optionalText,
  office: optionalText,
  status: userStatusSchema.optional(),
});

export const professorUpdateSchema = professorCreateSchema
  .omit({ password: true })
  .extend({
    password: z.string().min(8).optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });

const sectionScheduleSchema = z
  .object({
    classroomId: optionalId,
    dayOfWeek: dayOfWeekSchema,
    startMinute: z.coerce.number().int().min(0).max(1439),
    endMinute: z.coerce.number().int().min(1).max(1440),
  })
  .refine((data) => data.endMinute > data.startMinute, {
    message: "La hora de fin debe ser posterior a la hora de inicio",
    path: ["endMinute"],
  });

export const courseSectionCreateSchema = z.object({
  termId: id,
  subjectId: id,
  professorId: optionalId,
  sectionCode: z.string().trim().min(1).max(20).transform((value) => value.toUpperCase()),
  capacity: z.coerce.number().int().positive(),
  modality: modalitySchema.optional(),
  status: sectionStatusSchema.optional(),
  schedules: z.array(sectionScheduleSchema).optional(),
});

export const courseSectionUpdateSchema = z
  .object({
    termId: id.optional(),
    subjectId: id.optional(),
    professorId: optionalId,
    sectionCode: z
      .string()
      .trim()
      .min(1)
      .max(20)
      .transform((value) => value.toUpperCase())
      .optional(),
    capacity: z.coerce.number().int().positive().optional(),
    modality: modalitySchema.optional(),
    status: sectionStatusSchema.optional(),
    schedules: z.array(sectionScheduleSchema).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Debes enviar al menos un campo para actualizar",
  });
