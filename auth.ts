import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/src/lib/prisma";
import { Role, UserStatus } from "@/src/generated/prisma/enums";

const min = 100;

// class InvalidLoginError extends CredentialsSignin {
//   code = "Invalid identifier or password";
// }

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * min,
  },

  providers: [
    Credentials({
      credentials: {
        identifier: {
          label: "Correo o ID",
          type: "text",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? "").trim();
        const password = String(credentials?.password ?? "");

        if (!identifier || !password) {
          return null;
        }

        const normalizedIdentifier = identifier.toLowerCase();

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              {
                email: normalizedIdentifier,
              },
              {
                institutionalId: identifier,
              },
            ],
          },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        if (user.status !== UserStatus.ACTIVE) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(
          password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }

      return session;
    },
  },
});
