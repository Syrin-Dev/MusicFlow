
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prismadb";
import { NextAuthOptions } from "next-auth";
import bcrypt from 'bcrypt';

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
        // Email/Password Provider
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "text" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('Invalid credentials');
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });

                if (!user || !(user as any).password) {
                    throw new Error('User not found');
                }

                const isValid = await bcrypt.compare(credentials.password, (user as any).password);

                if (!isValid) {
                    throw new Error('Invalid password');
                }

                return user;
            }
        })
    ],
    session: {
        strategy: "jwt", // Use JWT for simpler session management even with DB
    },
    callbacks: {
        async session({ session, token }) {
            if (session.user && token) {
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
};
