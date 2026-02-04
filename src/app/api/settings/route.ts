import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prismadb";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            name: true,
            email: true,
            image: true,
            displayName: true,
            bio: true,
            twoFactorEnabled: true,
            emailUpdates: true,
            newReleases: true,
            securityAlerts: true,
        }
    });

    return NextResponse.json(user);
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const {
        name,
        displayName,
        bio, // Profile
        twoFactorEnabled, // Security
        emailUpdates, newReleases, securityAlerts // Notifications
    } = body;

    // Filter undefined values to allow partial updates
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (displayName !== undefined) updates.displayName = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (twoFactorEnabled !== undefined) updates.twoFactorEnabled = twoFactorEnabled;
    if (emailUpdates !== undefined) updates.emailUpdates = emailUpdates;
    if (newReleases !== undefined) updates.newReleases = newReleases;
    if (securityAlerts !== undefined) updates.securityAlerts = securityAlerts;

    // If new password logic was needed, we'd handle it here (if using credentials provider)
    // But since it's Google Auth mostly, we'll skip password update logic for now or verify provider.

    const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: updates
    });

    return NextResponse.json(updatedUser);
}
