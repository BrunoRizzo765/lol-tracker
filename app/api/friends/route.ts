import { NextResponse } from "next/server";
import { addFriend, listFriends, parseRiotId } from "/lib/friends-store";
import { getAccount } from "/lib/riot";

export const runtime = "nodejs";

export async function GET() {
  try {
    const friends = await listFriends();
    return NextResponse.json({ friends });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { riotId?: string; gameName?: string; tagLine?: string };
    const parsed =
      body.gameName && body.tagLine
        ? { gameName: body.gameName.trim(), tagLine: body.tagLine.trim() }
        : parseRiotId(body.riotId || "");

    if (!parsed) {
      return NextResponse.json(
        { error: "Usá el formato GameName#TAG (ej: Faker#KR1)." },
        { status: 400 },
      );
    }

    // Validate the Riot ID exists before saving.
    let account;
    try {
      account = await getAccount(parsed.gameName, parsed.tagLine);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "RIOT_ERROR";
      if (msg === "RIOT_NOT_FOUND") {
        return NextResponse.json({ error: "No existe ese Riot ID." }, { status: 404 });
      }
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const friend = await addFriend(account.gameName, account.tagLine);
    return NextResponse.json({ friend }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "DB_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
