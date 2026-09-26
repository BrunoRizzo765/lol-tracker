import { NextResponse } from "next/server";
import { listMatches } from "/lib/matches-store";
import { demoMatchesPage } from "/lib/demo";
import { riotKeyConfigured } from "/lib/riot";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get("limit") || 40);
    const offset = Number(searchParams.get("offset") || 0);
    const before = searchParams.get("before") ? Number(searchParams.get("before")) : undefined;
    const friendId = searchParams.get("friendId") ? Number(searchParams.get("friendId")) : undefined;

    if (!riotKeyConfigured() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoMatchesPage(Number.isFinite(limit) ? limit : 40, before));
    }

    const { matches, total } = await listMatches({
      limit: Number.isFinite(limit) ? limit : 40,
      offset: Number.isFinite(offset) ? offset : 0,
      before: before && Number.isFinite(before) ? before : undefined,
      friendId: friendId && Number.isFinite(friendId) ? friendId : undefined,
    });

    return NextResponse.json({ matches, total, hasMore: offset + matches.length < total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
