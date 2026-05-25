import "dotenv/config";
import bcrypt from "bcryptjs";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  AcademicPeriod,
  CurriculumStatus,
  DayOfWeek,
  Modality,
  PrismaClient,
  RequirementType,
  Role,
  SectionStatus,
  TermStatus,
  UserStatus,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

type SchoolSeed = {
  code: string;
  name: string;
  description: string;
};

type DepartmentSeed = {
  code: string;
  name: string;
  description: string;
};

type SubjectSeed = {
  code: string;
  name: string;
  departmentCode: string;
  credits: number;
  hoursPerWeek: number;
  description: string;
};

type ProfessorSeed = {
  name: string;
  email: string;
  institutionalId: string;
  employeeCode: string;
  departmentCode: string;
  academicTitle: string;
  office: string;
  phone: string;
};

type CurriculumSubjectSeed = {
  code: string;
  semesterNumber: number;
  requirementType?: (typeof RequirementType)[keyof typeof RequirementType];
};

type FacultySeed = {
  code: string;
  name: string;
  description: string;
  schools: SchoolSeed[];
  departments: DepartmentSeed[];
  classrooms: {
    code: string;
    building: string;
    room: string;
    capacity: number;
  }[];
  careers: {
    schoolCode: string;
    code: string;
    name: string;
    description: string;
    options: {
      code: string;
      name: string;
      description: string;
      curriculum: {
        code: string;
        name: string;
        version: number;
        subjects: CurriculumSubjectSeed[];
      };
    }[];
  }[];
  subjects: SubjectSeed[];
  professors: ProfessorSeed[];
};

const adminUsers = [
  {
    name: "Administrador Principal",
    email: "admin@universidad.edu",
    institutionalId: "V012345678",
    employeeCode: "EMP-ADM-0001",
    position: "Administrador del Sistema",
  },
  {
    name: "Coordinadora Academica",
    email: "coordinacion@universidad.edu",
    institutionalId: "V087654321",
    employeeCode: "EMP-ADM-0002",
    position: "Coordinadora Academica",
  },
];

const faculties: FacultySeed[] = [
  {
    code: "FING",
    name: "Facultad de Ingenieria",
    description:
      "Facultad dedicada a la formacion en ingenieria, ciencias aplicadas, tecnologia e infraestructura.",
    schools: [
      {
        code: "EBAS",
        name: "Escuela Basica de Ingenieria",
        description: "Unidad responsable de las asignaturas basicas comunes.",
      },
      {
        code: "ESIS",
        name: "Escuela de Ingenieria de Sistemas",
        description: "Escuela responsable de Ingenieria de Sistemas.",
      },
      {
        code: "ECIV",
        name: "Escuela de Ingenieria Civil",
        description: "Escuela responsable de Ingenieria Civil.",
      },
    ],
    departments: [
      {
        code: "DMAT",
        name: "Departamento de Matematicas",
        description: "Calculo, algebra, estadistica y matematica aplicada.",
      },
      {
        code: "DFIS",
        name: "Departamento de Fisica",
        description: "Fisica general, laboratorios y mecanica.",
      },
      {
        code: "DSIS",
        name: "Departamento de Sistemas Computacionales",
        description: "Programacion, algoritmos, datos, redes y sistemas.",
      },
      {
        code: "DCIV",
        name: "Departamento de Ingenieria Civil",
        description: "Estructuras, geotecnia, vialidad e hidraulica.",
      },
    ],
    classrooms: [
      { code: "ING-A101", building: "A", room: "101", capacity: 45 },
      { code: "ING-A102", building: "A", room: "102", capacity: 40 },
      { code: "ING-LAB1", building: "Laboratorios", room: "1", capacity: 28 },
      { code: "ING-C201", building: "C", room: "201", capacity: 50 },
    ],
    careers: [
      {
        schoolCode: "ESIS",
        code: "ISIS",
        name: "Ingenieria de Sistemas",
        description: "Carrera orientada al desarrollo de soluciones computacionales.",
        options: [
          {
            code: "GEN",
            name: "General",
            description: "Opcion general de Ingenieria de Sistemas.",
            curriculum: {
              code: "ISIS-2026",
              name: "Pensum 2026 - Ingenieria de Sistemas",
              version: 1,
              subjects: [
                { code: "MAT101", semesterNumber: 1 },
                { code: "MAT111", semesterNumber: 1 },
                { code: "FIS101", semesterNumber: 1 },
                { code: "SIS101", semesterNumber: 1 },
                { code: "SIS102", semesterNumber: 1 },
                { code: "MAT201", semesterNumber: 2 },
                { code: "FIS201", semesterNumber: 2 },
                { code: "SIS201", semesterNumber: 2 },
                { code: "SIS202", semesterNumber: 2 },
                { code: "MAT301", semesterNumber: 3 },
                { code: "SIS301", semesterNumber: 3 },
                { code: "SIS302", semesterNumber: 3 },
                { code: "SIS401", semesterNumber: 4 },
                {
                  code: "SIS402",
                  semesterNumber: 4,
                  requirementType: RequirementType.ELECTIVE,
                },
              ],
            },
          },
        ],
      },
      {
        schoolCode: "ECIV",
        code: "ICIV",
        name: "Ingenieria Civil",
        description: "Carrera orientada a obras civiles e infraestructura.",
        options: [
          {
            code: "GEN",
            name: "General",
            description: "Opcion general de Ingenieria Civil.",
            curriculum: {
              code: "ICIV-2026",
              name: "Pensum 2026 - Ingenieria Civil",
              version: 1,
              subjects: [
                { code: "MAT101", semesterNumber: 1 },
                { code: "MAT111", semesterNumber: 1 },
                { code: "FIS101", semesterNumber: 1 },
                { code: "CIV101", semesterNumber: 1 },
                { code: "MAT201", semesterNumber: 2 },
                { code: "FIS201", semesterNumber: 2 },
                { code: "CIV201", semesterNumber: 2 },
                { code: "CIV202", semesterNumber: 2 },
              ],
            },
          },
        ],
      },
    ],
    subjects: [
      {
        code: "MAT101",
        name: "Calculo I",
        departmentCode: "DMAT",
        credits: 5,
        hoursPerWeek: 6,
        description: "Limites, derivadas y aplicaciones.",
      },
      {
        code: "MAT111",
        name: "Algebra Lineal",
        departmentCode: "DMAT",
        credits: 4,
        hoursPerWeek: 5,
        description: "Vectores, matrices y sistemas lineales.",
      },
      {
        code: "MAT201",
        name: "Calculo II",
        departmentCode: "DMAT",
        credits: 5,
        hoursPerWeek: 6,
        description: "Integrales, series y aplicaciones.",
      },
      {
        code: "MAT301",
        name: "Probabilidad y Estadistica",
        departmentCode: "DMAT",
        credits: 4,
        hoursPerWeek: 4,
        description: "Modelos probabilisticos e inferencia estadistica.",
      },
      {
        code: "FIS101",
        name: "Fisica I",
        departmentCode: "DFIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Mecanica clasica y laboratorio.",
      },
      {
        code: "FIS201",
        name: "Fisica II",
        departmentCode: "DFIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Electricidad, magnetismo y laboratorio.",
      },
      {
        code: "SIS101",
        name: "Introduccion a la Programacion",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Fundamentos de algoritmos y programacion.",
      },
      {
        code: "SIS102",
        name: "Logica Computacional",
        departmentCode: "DSIS",
        credits: 3,
        hoursPerWeek: 4,
        description: "Logica proposicional, predicados y razonamiento formal.",
      },
      {
        code: "SIS201",
        name: "Programacion II",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Estructuras de control avanzadas y modularidad.",
      },
      {
        code: "SIS202",
        name: "Estructuras de Datos",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Listas, arboles, grafos y tablas hash.",
      },
      {
        code: "SIS301",
        name: "Bases de Datos",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Modelo relacional, SQL y diseno de bases de datos.",
      },
      {
        code: "SIS302",
        name: "Sistemas Operativos",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Procesos, memoria, archivos y concurrencia.",
      },
      {
        code: "SIS401",
        name: "Ingenieria de Software",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Procesos, requisitos, arquitectura y pruebas.",
      },
      {
        code: "SIS402",
        name: "Redes de Computadoras",
        departmentCode: "DSIS",
        credits: 4,
        hoursPerWeek: 5,
        description: "Protocolos, direccionamiento y servicios de red.",
      },
      {
        code: "CIV101",
        name: "Dibujo Tecnico",
        departmentCode: "DCIV",
        credits: 3,
        hoursPerWeek: 4,
        description: "Representacion grafica y planos tecnicos.",
      },
      {
        code: "CIV201",
        name: "Estatica",
        departmentCode: "DCIV",
        credits: 4,
        hoursPerWeek: 5,
        description: "Equilibrio de particulas y cuerpos rigidos.",
      },
      {
        code: "CIV202",
        name: "Materiales de Construccion",
        departmentCode: "DCIV",
        credits: 4,
        hoursPerWeek: 5,
        description: "Propiedades y ensayos de materiales.",
      },
    ],
    professors: [
      {
        name: "Ana Maria Torres",
        email: "ana.torres@universidad.edu",
        institutionalId: "V100000001",
        employeeCode: "PROF-ING-001",
        departmentCode: "DMAT",
        academicTitle: "Dra.",
        office: "A-210",
        phone: "0412-1000001",
      },
      {
        name: "Luis Rafael Molina",
        email: "luis.molina@universidad.edu",
        institutionalId: "V100000002",
        employeeCode: "PROF-ING-002",
        departmentCode: "DMAT",
        academicTitle: "MSc.",
        office: "A-211",
        phone: "0412-1000002",
      },
      {
        name: "Carolina Vargas",
        email: "carolina.vargas@universidad.edu",
        institutionalId: "V100000003",
        employeeCode: "PROF-ING-003",
        departmentCode: "DFIS",
        academicTitle: "Dra.",
        office: "B-105",
        phone: "0412-1000003",
      },
      {
        name: "Pedro Jose Rivas",
        email: "pedro.rivas@universidad.edu",
        institutionalId: "V100000004",
        employeeCode: "PROF-ING-004",
        departmentCode: "DFIS",
        academicTitle: "Ing.",
        office: "B-106",
        phone: "0412-1000004",
      },
      {
        name: "Gabriela Paredes",
        email: "gabriela.paredes@universidad.edu",
        institutionalId: "V100000005",
        employeeCode: "PROF-ING-005",
        departmentCode: "DSIS",
        academicTitle: "Dra.",
        office: "LAB-2",
        phone: "0412-1000005",
      },
      {
        name: "Jorge Alberto Nieves",
        email: "jorge.nieves@universidad.edu",
        institutionalId: "V100000006",
        employeeCode: "PROF-ING-006",
        departmentCode: "DSIS",
        academicTitle: "MSc.",
        office: "LAB-3",
        phone: "0412-1000006",
      },
      {
        name: "Mariela Contreras",
        email: "mariela.contreras@universidad.edu",
        institutionalId: "V100000007",
        employeeCode: "PROF-ING-007",
        departmentCode: "DSIS",
        academicTitle: "Ing.",
        office: "C-310",
        phone: "0412-1000007",
      },
      {
        name: "Ricardo Salcedo",
        email: "ricardo.salcedo@universidad.edu",
        institutionalId: "V100000008",
        employeeCode: "PROF-ING-008",
        departmentCode: "DSIS",
        academicTitle: "MSc.",
        office: "C-311",
        phone: "0412-1000008",
      },
      {
        name: "Valentina Figueroa",
        email: "valentina.figueroa@universidad.edu",
        institutionalId: "V100000009",
        employeeCode: "PROF-ING-009",
        departmentCode: "DCIV",
        academicTitle: "Dra.",
        office: "D-201",
        phone: "0412-1000009",
      },
      {
        name: "Hector Medina",
        email: "hector.medina@universidad.edu",
        institutionalId: "V100000010",
        employeeCode: "PROF-ING-010",
        departmentCode: "DCIV",
        academicTitle: "Ing.",
        office: "D-202",
        phone: "0412-1000010",
      },
    ],
  },
  {
    code: "FMED",
    name: "Facultad de Medicina",
    description:
      "Facultad dedicada a ciencias de la salud, medicina clinica, investigacion biomedica y atencion comunitaria.",
    schools: [
      {
        code: "EMED",
        name: "Escuela de Medicina",
        description: "Escuela responsable de la carrera de Medicina.",
      },
      {
        code: "EENF",
        name: "Escuela de Enfermeria",
        description: "Escuela responsable de la carrera de Enfermeria.",
      },
      {
        code: "ESPC",
        name: "Escuela de Salud Publica",
        description: "Escuela orientada a salud comunitaria y epidemiologia.",
      },
    ],
    departments: [
      {
        code: "DANA",
        name: "Departamento de Anatomia",
        description: "Anatomia humana, histologia y embriologia.",
      },
      {
        code: "DFISIO",
        name: "Departamento de Fisiologia",
        description: "Fisiologia humana y bases funcionales de la salud.",
      },
      {
        code: "DCLIN",
        name: "Departamento de Ciencias Clinicas",
        description: "Semiologia, medicina interna, cirugia y pediatria.",
      },
      {
        code: "DSPUB",
        name: "Departamento de Salud Publica",
        description: "Epidemiologia, bioestadistica y medicina preventiva.",
      },
    ],
    classrooms: [
      { code: "MED-A101", building: "Anatomia", room: "101", capacity: 60 },
      { code: "MED-A102", building: "Anatomia", room: "102", capacity: 55 },
      { code: "MED-LAB1", building: "Laboratorios", room: "1", capacity: 32 },
      { code: "MED-C201", building: "Clinico", room: "201", capacity: 45 },
    ],
    careers: [
      {
        schoolCode: "EMED",
        code: "MED",
        name: "Medicina",
        description: "Carrera de formacion medica integral.",
        options: [
          {
            code: "GEN",
            name: "General",
            description: "Opcion general de Medicina.",
            curriculum: {
              code: "MED-2026",
              name: "Pensum 2026 - Medicina",
              version: 1,
              subjects: [
                { code: "MED101", semesterNumber: 1 },
                { code: "MED102", semesterNumber: 1 },
                { code: "MED103", semesterNumber: 1 },
                { code: "MED104", semesterNumber: 1 },
                { code: "MED201", semesterNumber: 2 },
                { code: "MED202", semesterNumber: 2 },
                { code: "MED203", semesterNumber: 2 },
                { code: "MED301", semesterNumber: 3 },
                { code: "MED302", semesterNumber: 3 },
                { code: "MED401", semesterNumber: 4 },
                {
                  code: "MED402",
                  semesterNumber: 4,
                  requirementType: RequirementType.ELECTIVE,
                },
                { code: "MED403", semesterNumber: 4 },
              ],
            },
          },
        ],
      },
      {
        schoolCode: "EENF",
        code: "ENF",
        name: "Enfermeria",
        description: "Carrera orientada al cuidado integral del paciente.",
        options: [
          {
            code: "GEN",
            name: "General",
            description: "Opcion general de Enfermeria.",
            curriculum: {
              code: "ENF-2026",
              name: "Pensum 2026 - Enfermeria",
              version: 1,
              subjects: [
                { code: "MED101", semesterNumber: 1 },
                { code: "MED103", semesterNumber: 1 },
                { code: "ENF101", semesterNumber: 1 },
                { code: "MED203", semesterNumber: 2 },
                { code: "MED302", semesterNumber: 2 },
                { code: "MED403", semesterNumber: 3 },
              ],
            },
          },
        ],
      },
    ],
    subjects: [
      {
        code: "MED101",
        name: "Anatomia Humana I",
        departmentCode: "DANA",
        credits: 5,
        hoursPerWeek: 6,
        description: "Anatomia general, osteologia y miologia.",
      },
      {
        code: "MED102",
        name: "Histologia",
        departmentCode: "DANA",
        credits: 4,
        hoursPerWeek: 5,
        description: "Tejidos fundamentales y tecnicas histologicas.",
      },
      {
        code: "MED103",
        name: "Biologia Celular",
        departmentCode: "DANA",
        credits: 4,
        hoursPerWeek: 5,
        description: "Estructura celular, membranas y organelos.",
      },
      {
        code: "MED104",
        name: "Bioquimica Medica",
        departmentCode: "DFISIO",
        credits: 4,
        hoursPerWeek: 5,
        description: "Biomoleculas, metabolismo y enzimas.",
      },
      {
        code: "MED201",
        name: "Fisiologia Humana I",
        departmentCode: "DFISIO",
        credits: 5,
        hoursPerWeek: 6,
        description: "Homeostasis, neurofisiologia y fisiologia muscular.",
      },
      {
        code: "MED202",
        name: "Microbiologia",
        departmentCode: "DFISIO",
        credits: 4,
        hoursPerWeek: 5,
        description: "Bacterias, virus, hongos e inmunologia basica.",
      },
      {
        code: "MED203",
        name: "Epidemiologia",
        departmentCode: "DSPUB",
        credits: 3,
        hoursPerWeek: 4,
        description: "Medicion de eventos de salud y vigilancia epidemiologica.",
      },
      {
        code: "MED301",
        name: "Semiologia",
        departmentCode: "DCLIN",
        credits: 5,
        hoursPerWeek: 6,
        description: "Historia clinica, examen fisico y razonamiento clinico.",
      },
      {
        code: "MED302",
        name: "Farmacologia",
        departmentCode: "DCLIN",
        credits: 4,
        hoursPerWeek: 5,
        description: "Principios farmacocineticos y farmacodinamicos.",
      },
      {
        code: "MED401",
        name: "Medicina Interna I",
        departmentCode: "DCLIN",
        credits: 5,
        hoursPerWeek: 6,
        description: "Evaluacion y manejo inicial de patologias frecuentes.",
      },
      {
        code: "MED402",
        name: "Salud Comunitaria",
        departmentCode: "DSPUB",
        credits: 3,
        hoursPerWeek: 4,
        description: "Atencion primaria, promocion y prevencion en salud.",
      },
      {
        code: "MED403",
        name: "Bioestadistica",
        departmentCode: "DSPUB",
        credits: 3,
        hoursPerWeek: 4,
        description: "Analisis estadistico aplicado a ciencias de la salud.",
      },
      {
        code: "ENF101",
        name: "Fundamentos de Enfermeria",
        departmentCode: "DCLIN",
        credits: 4,
        hoursPerWeek: 5,
        description: "Cuidado basico, seguridad del paciente y registros.",
      },
    ],
    professors: [
      {
        name: "Isabel Montilla",
        email: "isabel.montilla@universidad.edu",
        institutionalId: "V200000001",
        employeeCode: "PROF-MED-001",
        departmentCode: "DANA",
        academicTitle: "Dra.",
        office: "AN-101",
        phone: "0414-2000001",
      },
      {
        name: "Ramon Eduardo Gil",
        email: "ramon.gil@universidad.edu",
        institutionalId: "V200000002",
        employeeCode: "PROF-MED-002",
        departmentCode: "DANA",
        academicTitle: "Dr.",
        office: "AN-102",
        phone: "0414-2000002",
      },
      {
        name: "Sofia Castillo",
        email: "sofia.castillo@universidad.edu",
        institutionalId: "V200000003",
        employeeCode: "PROF-MED-003",
        departmentCode: "DANA",
        academicTitle: "MSc.",
        office: "AN-103",
        phone: "0414-2000003",
      },
      {
        name: "Mauricio Leon",
        email: "mauricio.leon@universidad.edu",
        institutionalId: "V200000004",
        employeeCode: "PROF-MED-004",
        departmentCode: "DFISIO",
        academicTitle: "Dr.",
        office: "FI-201",
        phone: "0414-2000004",
      },
      {
        name: "Daniela Mejias",
        email: "daniela.mejias@universidad.edu",
        institutionalId: "V200000005",
        employeeCode: "PROF-MED-005",
        departmentCode: "DFISIO",
        academicTitle: "Dra.",
        office: "FI-202",
        phone: "0414-2000005",
      },
      {
        name: "Andres Silva",
        email: "andres.silva@universidad.edu",
        institutionalId: "V200000006",
        employeeCode: "PROF-MED-006",
        departmentCode: "DCLIN",
        academicTitle: "Dr.",
        office: "CL-301",
        phone: "0414-2000006",
      },
      {
        name: "Patricia Rondon",
        email: "patricia.rondon@universidad.edu",
        institutionalId: "V200000007",
        employeeCode: "PROF-MED-007",
        departmentCode: "DCLIN",
        academicTitle: "Dra.",
        office: "CL-302",
        phone: "0414-2000007",
      },
      {
        name: "Miguel Angel Farfan",
        email: "miguel.farfan@universidad.edu",
        institutionalId: "V200000008",
        employeeCode: "PROF-MED-008",
        departmentCode: "DCLIN",
        academicTitle: "Dr.",
        office: "CL-303",
        phone: "0414-2000008",
      },
      {
        name: "Elena Duarte",
        email: "elena.duarte@universidad.edu",
        institutionalId: "V200000009",
        employeeCode: "PROF-MED-009",
        departmentCode: "DSPUB",
        academicTitle: "MSc.",
        office: "SP-401",
        phone: "0414-2000009",
      },
      {
        name: "Carlos Enrique Prieto",
        email: "carlos.prieto@universidad.edu",
        institutionalId: "V200000010",
        employeeCode: "PROF-MED-010",
        departmentCode: "DSPUB",
        academicTitle: "Dr.",
        office: "SP-402",
        phone: "0414-2000010",
      },
    ],
  },
];

const prerequisites = [
  { subjectCode: "MAT201", prerequisiteCode: "MAT101" },
  { subjectCode: "SIS201", prerequisiteCode: "SIS101" },
  { subjectCode: "SIS202", prerequisiteCode: "SIS201" },
  { subjectCode: "SIS301", prerequisiteCode: "SIS202" },
  { subjectCode: "SIS302", prerequisiteCode: "SIS202" },
  { subjectCode: "SIS401", prerequisiteCode: "SIS301" },
  { subjectCode: "CIV201", prerequisiteCode: "FIS101" },
  { subjectCode: "MED201", prerequisiteCode: "MED101" },
  { subjectCode: "MED301", prerequisiteCode: "MED201" },
  { subjectCode: "MED401", prerequisiteCode: "MED301" },
];

const sectionSeeds = [
  {
    subjectCode: "MAT101",
    professorEmployeeCode: "PROF-ING-001",
    classroomCode: "ING-A101",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.MONDAY,
    startMinute: 480,
    endMinute: 600,
  },
  {
    subjectCode: "SIS101",
    professorEmployeeCode: "PROF-ING-005",
    classroomCode: "ING-LAB1",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.TUESDAY,
    startMinute: 600,
    endMinute: 720,
  },
  {
    subjectCode: "SIS102",
    professorEmployeeCode: "PROF-ING-006",
    classroomCode: "ING-A102",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startMinute: 480,
    endMinute: 600,
  },
  {
    subjectCode: "FIS101",
    professorEmployeeCode: "PROF-ING-003",
    classroomCode: "ING-C201",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.THURSDAY,
    startMinute: 600,
    endMinute: 720,
  },
  {
    subjectCode: "MED101",
    professorEmployeeCode: "PROF-MED-001",
    classroomCode: "MED-A101",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.MONDAY,
    startMinute: 480,
    endMinute: 600,
  },
  {
    subjectCode: "MED102",
    professorEmployeeCode: "PROF-MED-002",
    classroomCode: "MED-LAB1",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.TUESDAY,
    startMinute: 600,
    endMinute: 720,
  },
  {
    subjectCode: "MED103",
    professorEmployeeCode: "PROF-MED-003",
    classroomCode: "MED-A102",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.WEDNESDAY,
    startMinute: 480,
    endMinute: 600,
  },
  {
    subjectCode: "ENF101",
    professorEmployeeCode: "PROF-MED-007",
    classroomCode: "MED-C201",
    sectionCode: "A",
    dayOfWeek: DayOfWeek.THURSDAY,
    startMinute: 600,
    endMinute: 720,
  },
];

async function upsertAdmins(passwordHash: string) {
  for (const admin of adminUsers) {
    await prisma.user.upsert({
      where: { email: admin.email },
      update: {
        name: admin.name,
        institutionalId: admin.institutionalId,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        mustChangePassword: true,
        adminProfile: {
          upsert: {
            update: {
              employeeCode: admin.employeeCode,
              position: admin.position,
            },
            create: {
              employeeCode: admin.employeeCode,
              position: admin.position,
            },
          },
        },
      },
      create: {
        name: admin.name,
        email: admin.email,
        institutionalId: admin.institutionalId,
        passwordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
        adminProfile: {
          create: {
            employeeCode: admin.employeeCode,
            position: admin.position,
          },
        },
      },
    });
  }
}

async function upsertFacultyStructure() {
  for (const facultySeed of faculties) {
    const faculty = await prisma.faculty.upsert({
      where: { code: facultySeed.code },
      update: {
        name: facultySeed.name,
        description: facultySeed.description,
      },
      create: {
        code: facultySeed.code,
        name: facultySeed.name,
        description: facultySeed.description,
      },
    });

    for (const schoolSeed of facultySeed.schools) {
      await prisma.school.upsert({
        where: {
          facultyId_code: {
            facultyId: faculty.id,
            code: schoolSeed.code,
          },
        },
        update: {
          name: schoolSeed.name,
          description: schoolSeed.description,
        },
        create: {
          facultyId: faculty.id,
          code: schoolSeed.code,
          name: schoolSeed.name,
          description: schoolSeed.description,
        },
      });
    }

    for (const departmentSeed of facultySeed.departments) {
      await prisma.department.upsert({
        where: {
          facultyId_code: {
            facultyId: faculty.id,
            code: departmentSeed.code,
          },
        },
        update: {
          name: departmentSeed.name,
          description: departmentSeed.description,
        },
        create: {
          facultyId: faculty.id,
          code: departmentSeed.code,
          name: departmentSeed.name,
          description: departmentSeed.description,
        },
      });
    }

    for (const classroomSeed of facultySeed.classrooms) {
      await prisma.classroom.upsert({
        where: {
          facultyId_code: {
            facultyId: faculty.id,
            code: classroomSeed.code,
          },
        },
        update: {
          building: classroomSeed.building,
          room: classroomSeed.room,
          capacity: classroomSeed.capacity,
        },
        create: {
          facultyId: faculty.id,
          ...classroomSeed,
        },
      });
    }
  }
}

async function upsertSubjects() {
  for (const facultySeed of faculties) {
    const faculty = await prisma.faculty.findUniqueOrThrow({
      where: { code: facultySeed.code },
    });

    for (const subjectSeed of facultySeed.subjects) {
      const department = await prisma.department.findUniqueOrThrow({
        where: {
          facultyId_code: {
            facultyId: faculty.id,
            code: subjectSeed.departmentCode,
          },
        },
      });

      await prisma.subject.upsert({
        where: { code: subjectSeed.code },
        update: {
          departmentId: department.id,
          name: subjectSeed.name,
          description: subjectSeed.description,
          credits: subjectSeed.credits,
          hoursPerWeek: subjectSeed.hoursPerWeek,
          isActive: true,
        },
        create: {
          departmentId: department.id,
          code: subjectSeed.code,
          name: subjectSeed.name,
          description: subjectSeed.description,
          credits: subjectSeed.credits,
          hoursPerWeek: subjectSeed.hoursPerWeek,
          isActive: true,
        },
      });
    }
  }
}

async function upsertCareersAndCurricula() {
  for (const facultySeed of faculties) {
    const faculty = await prisma.faculty.findUniqueOrThrow({
      where: { code: facultySeed.code },
    });

    for (const careerSeed of facultySeed.careers) {
      const school = await prisma.school.findUniqueOrThrow({
        where: {
          facultyId_code: {
            facultyId: faculty.id,
            code: careerSeed.schoolCode,
          },
        },
      });

      const career = await prisma.career.upsert({
        where: {
          schoolId_code: {
            schoolId: school.id,
            code: careerSeed.code,
          },
        },
        update: {
          name: careerSeed.name,
          description: careerSeed.description,
        },
        create: {
          schoolId: school.id,
          code: careerSeed.code,
          name: careerSeed.name,
          description: careerSeed.description,
        },
      });

      for (const optionSeed of careerSeed.options) {
        const option = await prisma.careerOption.upsert({
          where: {
            careerId_code: {
              careerId: career.id,
              code: optionSeed.code,
            },
          },
          update: {
            name: optionSeed.name,
            description: optionSeed.description,
          },
          create: {
            careerId: career.id,
            code: optionSeed.code,
            name: optionSeed.name,
            description: optionSeed.description,
          },
        });

        const totalCredits = optionSeed.curriculum.subjects.reduce(
          (sum, curriculumSubjectSeed) => {
            const subject = facultySeed.subjects.find(
              (item) => item.code === curriculumSubjectSeed.code,
            );

            return sum + (subject?.credits ?? 0);
          },
          0,
        );

        const curriculum = await prisma.curriculum.upsert({
          where: {
            careerOptionId_version: {
              careerOptionId: option.id,
              version: optionSeed.curriculum.version,
            },
          },
          update: {
            code: optionSeed.curriculum.code,
            name: optionSeed.curriculum.name,
            status: CurriculumStatus.ACTIVE,
            totalCredits,
          },
          create: {
            careerOptionId: option.id,
            code: optionSeed.curriculum.code,
            name: optionSeed.curriculum.name,
            version: optionSeed.curriculum.version,
            status: CurriculumStatus.ACTIVE,
            totalCredits,
          },
        });

        for (const curriculumSubjectSeed of optionSeed.curriculum.subjects) {
          const subject = await prisma.subject.findUniqueOrThrow({
            where: { code: curriculumSubjectSeed.code },
          });

          await prisma.curriculumSubject.upsert({
            where: {
              curriculumId_subjectId: {
                curriculumId: curriculum.id,
                subjectId: subject.id,
              },
            },
            update: {
              requirementType:
                curriculumSubjectSeed.requirementType ?? RequirementType.REQUIRED,
              semesterNumber: curriculumSubjectSeed.semesterNumber,
              credits: subject.credits,
            },
            create: {
              curriculumId: curriculum.id,
              subjectId: subject.id,
              requirementType:
                curriculumSubjectSeed.requirementType ?? RequirementType.REQUIRED,
              semesterNumber: curriculumSubjectSeed.semesterNumber,
              credits: subject.credits,
            },
          });
        }
      }
    }
  }
}

async function upsertProfessors(passwordHash: string) {
  for (const facultySeed of faculties) {
    const faculty = await prisma.faculty.findUniqueOrThrow({
      where: { code: facultySeed.code },
    });

    for (const professorSeed of facultySeed.professors) {
      const department = await prisma.department.findUniqueOrThrow({
        where: {
          facultyId_code: {
            facultyId: faculty.id,
            code: professorSeed.departmentCode,
          },
        },
      });

      await prisma.user.upsert({
        where: { email: professorSeed.email },
        update: {
          name: professorSeed.name,
          institutionalId: professorSeed.institutionalId,
          passwordHash,
          role: Role.PROFESSOR,
          status: UserStatus.ACTIVE,
          mustChangePassword: true,
          professorProfile: {
            upsert: {
              update: {
                employeeCode: professorSeed.employeeCode,
                departmentId: department.id,
                phone: professorSeed.phone,
                academicTitle: professorSeed.academicTitle,
                office: professorSeed.office,
              },
              create: {
                employeeCode: professorSeed.employeeCode,
                departmentId: department.id,
                phone: professorSeed.phone,
                academicTitle: professorSeed.academicTitle,
                office: professorSeed.office,
              },
            },
          },
        },
        create: {
          name: professorSeed.name,
          email: professorSeed.email,
          institutionalId: professorSeed.institutionalId,
          passwordHash,
          role: Role.PROFESSOR,
          status: UserStatus.ACTIVE,
          professorProfile: {
            create: {
              employeeCode: professorSeed.employeeCode,
              departmentId: department.id,
              phone: professorSeed.phone,
              academicTitle: professorSeed.academicTitle,
              office: professorSeed.office,
            },
          },
        },
      });
    }
  }
}

async function upsertPrerequisites() {
  for (const prerequisiteSeed of prerequisites) {
    const [subject, prerequisite] = await Promise.all([
      prisma.subject.findUniqueOrThrow({
        where: { code: prerequisiteSeed.subjectCode },
      }),
      prisma.subject.findUniqueOrThrow({
        where: { code: prerequisiteSeed.prerequisiteCode },
      }),
    ]);

    await prisma.subjectPrerequisite.upsert({
      where: {
        subjectId_prerequisiteId: {
          subjectId: subject.id,
          prerequisiteId: prerequisite.id,
        },
      },
      update: {},
      create: {
        subjectId: subject.id,
        prerequisiteId: prerequisite.id,
      },
    });
  }
}

async function upsertAcademicOfferings() {
  const term = await prisma.academicTerm.upsert({
    where: { code: "2026-2" },
    update: {
      year: 2026,
      period: AcademicPeriod.SECOND,
      startsAt: new Date("2026-09-14T04:00:00.000Z"),
      endsAt: new Date("2027-02-13T04:00:00.000Z"),
      status: TermStatus.PLANNED,
    },
    create: {
      code: "2026-2",
      year: 2026,
      period: AcademicPeriod.SECOND,
      startsAt: new Date("2026-09-14T04:00:00.000Z"),
      endsAt: new Date("2027-02-13T04:00:00.000Z"),
      status: TermStatus.PLANNED,
    },
  });

  for (const facultySeed of faculties) {
    const faculty = await prisma.faculty.findUniqueOrThrow({
      where: { code: facultySeed.code },
    });

    await prisma.enrollmentPeriod.upsert({
      where: { id: `${facultySeed.code}-2026-2-enrollment` },
      update: {
        termId: term.id,
        facultyId: faculty.id,
        name: `Inscripcion ${facultySeed.name} 2026-2`,
        startsAt: new Date("2026-08-24T04:00:00.000Z"),
        endsAt: new Date("2026-09-04T04:00:00.000Z"),
      },
      create: {
        id: `${facultySeed.code}-2026-2-enrollment`,
        termId: term.id,
        facultyId: faculty.id,
        name: `Inscripcion ${facultySeed.name} 2026-2`,
        startsAt: new Date("2026-08-24T04:00:00.000Z"),
        endsAt: new Date("2026-09-04T04:00:00.000Z"),
      },
    });
  }

  for (const sectionSeed of sectionSeeds) {
    const [subject, professor, classroom] = await Promise.all([
      prisma.subject.findUniqueOrThrow({
        where: { code: sectionSeed.subjectCode },
      }),
      prisma.professorProfile.findUniqueOrThrow({
        where: { employeeCode: sectionSeed.professorEmployeeCode },
      }),
      prisma.classroom.findFirstOrThrow({
        where: { code: sectionSeed.classroomCode },
      }),
    ]);

    const section = await prisma.courseSection.upsert({
      where: {
        termId_subjectId_sectionCode: {
          termId: term.id,
          subjectId: subject.id,
          sectionCode: sectionSeed.sectionCode,
        },
      },
      update: {
        professorId: professor.id,
        capacity: 30,
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
      },
      create: {
        termId: term.id,
        subjectId: subject.id,
        professorId: professor.id,
        sectionCode: sectionSeed.sectionCode,
        capacity: 30,
        modality: Modality.IN_PERSON,
        status: SectionStatus.OPEN,
      },
    });

    const existingSchedule = await prisma.sectionSchedule.findFirst({
      where: {
        sectionId: section.id,
        dayOfWeek: sectionSeed.dayOfWeek,
        startMinute: sectionSeed.startMinute,
        endMinute: sectionSeed.endMinute,
      },
    });

    if (existingSchedule) {
      await prisma.sectionSchedule.update({
        where: { id: existingSchedule.id },
        data: { classroomId: classroom.id },
      });
    } else {
      await prisma.sectionSchedule.create({
        data: {
          sectionId: section.id,
          classroomId: classroom.id,
          dayOfWeek: sectionSeed.dayOfWeek,
          startMinute: sectionSeed.startMinute,
          endMinute: sectionSeed.endMinute,
        },
      });
    }
  }
}

async function main() {
  const passwordHash = await bcrypt.hash("Admin123456!", 12);

  await upsertAdmins(passwordHash);
  await upsertFacultyStructure();
  await upsertSubjects();
  await upsertCareersAndCurricula();
  await upsertProfessors(passwordHash);
  await upsertPrerequisites();
  await upsertAcademicOfferings();

  const summary = await Promise.all([
    prisma.user.count({ where: { role: Role.ADMIN } }),
    prisma.faculty.count(),
    prisma.school.count(),
    prisma.department.count(),
    prisma.career.count(),
    prisma.careerOption.count(),
    prisma.curriculum.count(),
    prisma.subject.count(),
    prisma.professorProfile.count(),
    prisma.courseSection.count(),
  ]);

  console.log("Seed completado correctamente");
  console.table({
    admins: summary[0],
    faculties: summary[1],
    schools: summary[2],
    departments: summary[3],
    careers: summary[4],
    careerOptions: summary[5],
    curricula: summary[6],
    subjects: summary[7],
    professors: summary[8],
    sections: summary[9],
  });
  console.log("Contrasena de prueba para admins y profesores: Admin123456!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    await pool.end();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    await pool.end();
    process.exit(1);
  });
