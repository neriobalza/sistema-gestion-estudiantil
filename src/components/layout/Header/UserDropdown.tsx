"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut, Settings } from "lucide-react";
import { signOut } from "next-auth/react";
import { Role } from "@/src/generated/prisma/enums";

export type HeaderUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: Role | null;
};

type UserDropdownProps = {
  user: HeaderUser;
};

export function UserDropdown({ user }: UserDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials = getInitials(user.name ?? user.email ?? "Usuario");

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleSignOut() {
    await signOut({
      redirectTo: "/",
    });
  }

  let dashboardUrl = "/student";
  let settingsUrl = "/student/settings";

  switch (user.role) {
    case Role.ADMIN:
      dashboardUrl = "/admin";
      settingsUrl = "/admin/settings";
      break;
    case Role.PROFESSOR:
      dashboardUrl = "/professor";
      settingsUrl = "/professor/settings";
      break;
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-[#031b46] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#031b46]/90"
      >
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-yellow-400 text-sm font-bold text-[#061b3a]">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? "Usuario"}
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="hidden max-w-35 text-left lg:block">
          <p className="truncate text-sm leading-4 text-white">
            {user.name ?? "Usuario"}
          </p>
          <p className="truncate text-xs font-normal text-slate-300">
            {getRoleLabel(user.role)}
          </p>
        </div>

        <ChevronDown
          size={16}
          className={`transition ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[#061b3a] text-sm font-bold text-white">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? "Usuario"}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initials
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate font-bold text-[#061b3a]">
                  {user.name ?? "Usuario"}
                </p>

                {user.email && (
                  <p className="truncate text-sm text-slate-500">
                    {user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {user.role && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0b3b75]">
                  {getRoleLabel(user.role)}
                </span>
              )}
            </div>
          </div>

          <div className="p-2">
            <DropdownLink
              href={dashboardUrl}
              icon={LayoutDashboard}
              label="Panel de Control"
            />
            <DropdownLink
              href={settingsUrl}
              icon={Settings}
              label="Configuración"
            />

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
            >
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-[#061b3a]"
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function getInitials(value: string) {
  const parts = value.trim().split(" ");

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getRoleLabel(role?: Role | null) {
  if (!role) return "Usuario";

  const roleLabels: Record<Role, string> = {
    ADMIN: "Administrador",
    STUDENT: "Estudiante",
    PROFESSOR: "Docente",
  };

  return roleLabels[role] ?? role;
}
