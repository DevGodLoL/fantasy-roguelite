import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;

    const user = await db.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            commanderLevel: true,
            experience: true,
            talentPoints: true,
            unlockedTalents: true,
            displayName: true
        }
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
}
