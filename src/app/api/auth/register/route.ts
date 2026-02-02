import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prismadb';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, name, password } = body;

        if (!email || !name || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
        }

        // Create user
        // Note: hashing is omitted for now as requested, but highly recommended for production
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password // Storing as plain text for now, should be bcrypt.hash(password, 10)
            }
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
    }
}
