import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: leagueId } = await params;
    const body = await req.json();
    const { teamId, powerupId } = body;

    // 1. Verify Team & Gold
    const team = await db.team.findUnique({
        where: { id: teamId }
    });

    if (!team) return NextResponse.json({ error: "Team not found" }, { status: 404 });

    // 2. Verify Item
    const item = await db.powerup.findUnique({
        where: { id: powerupId }
    });

    if (!item || !item.price) return NextResponse.json({ error: "Item not found" }, { status: 404 });

    // 3. Transaction
    if (team.gold < item.price) {
        return NextResponse.json({ error: "Not enough gold" }, { status: 400 });
    }

    // Atomic Update
    await db.$transaction([
        // Deduct Gold
        db.team.update({
            where: { id: teamId },
            data: { gold: { decrement: item.price } }
        }),
        // Add Relic to Team
        db.teamPowerup.create({
            data: {
                teamId: team.id,
                powerupId: item.id,
                isConsumed: false // Relics are permanent
            }
        }),
        // Log Transaction
        db.leagueTransaction.create({
            data: {
                leagueId,
                teamId,
                type: "SHOP_PURCHASE",
                description: `Purchased ${item.name} for ${item.price} Gold`,
                amount: -item.price
            }
        })
    ]);

    return NextResponse.json({ success: true });
}
