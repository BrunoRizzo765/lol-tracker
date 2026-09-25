import { NextResponse } from "next/server";
import { syncMatches } from "/lib/match-sync";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST() {
  try {
    const result = await syncMatches();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SYNC_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
