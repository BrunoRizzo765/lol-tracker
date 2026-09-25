import { NextResponse } from "next/server";
import { syncMatches, type SyncMode } from "/lib/match-sync";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { mode?: SyncMode };
    const mode: SyncMode = body.mode === "backfill" ? "backfill" : "refresh";
    const result = await syncMatches(mode);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SYNC_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
