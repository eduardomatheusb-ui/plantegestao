import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import type { Papel } from "@prisma/client";

// Expande os tipos da sessão/JWT com id e papel do usuário.
declare module "next-auth" {
  interface User {
    papel: Papel;
  }
  interface Session {
    user: {
      id: string;
      papel: Papel;
    } & DefaultSession["user"];
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      name: "Credenciais",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      authorize: async (raw) => {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, senha } = parsed.data;
        try {
          const usuario = await db.usuario.findUnique({
            where: { email: email.toLowerCase().trim() },
          });
          // Sem senha definida = convite pendente; inativo = bloqueado.
          if (!usuario || !usuario.ativo || !usuario.senhaHash) return null;

          const ok = await bcrypt.compare(senha, usuario.senhaHash);
          if (!ok) return null;

          return {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email,
            image: usuario.avatarUrl ?? undefined,
            papel: usuario.papel,
          };
        } catch (e) {
          // Erro de infraestrutura (ex.: conexão com o banco) — registra no log da função.
          console.error("[auth] falha ao autenticar (verifique a DATABASE_URL):", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.papel = user.papel;
      }
      return token;
    },
    session: ({ session, token }) => {
      session.user.id = token.id as string;
      session.user.papel = token.papel as Papel;
      return session;
    },
  },
});
