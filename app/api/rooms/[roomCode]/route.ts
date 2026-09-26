import { NextRequest, NextResponse } from "next/server";

import { DEFAULT_ROOM_CODE } from "@/lib/room-store";
import { getSupabaseAuthContext, isSupabaseServerConfigured } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  if ((roomCode || DEFAULT_ROOM_CODE).toUpperCase() !== DEFAULT_ROOM_CODE) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { user, error } = await getSupabaseAuthContext();
  if (error || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  return NextResponse.json({ room: { roomCode: DEFAULT_ROOM_CODE, maxPlayers: 10 } });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ roomCode: string }> }
) {
  const { roomCode } = await params;
  if ((roomCode || DEFAULT_ROOM_CODE).toUpperCase() !== DEFAULT_ROOM_CODE) {
    return NextResponse.json({ error: "Room not found." }, { status: 404 });
  }

  if (!isSupabaseServerConfigured) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const { client, user, error: authError } = await getSupabaseAuthContext();
  if (authError || !user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { error } = await client.rpc("leave_study_room");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
