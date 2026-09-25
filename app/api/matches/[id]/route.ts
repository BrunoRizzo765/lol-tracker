import { NextResponse } from "next/server";
import { getDDragonVersion, getMatchDetail } from "/lib/riot";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!id) return NextResponse.json({ error: "Falta match id." }, { status: 400 });

    const [detail, version] = await Promise.all([
      getMatchDetail(id),
      getDDragonVersion().catch(() => null),
    ]);

    return NextResponse.json({ ...detail, ddragonVersion: version });
  } catch (error) {
    const message = error instanceof Error ? error.message : "MATCH_ERROR";
    const status = message === "RIOT_NOT_FOUND" ? 404 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
