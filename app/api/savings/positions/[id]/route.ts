import { NextRequest, NextResponse } from "next/server";
import { getPosition } from "@/lib/savings-store";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const position = getPosition(id);
  if (!position) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ position });
}
