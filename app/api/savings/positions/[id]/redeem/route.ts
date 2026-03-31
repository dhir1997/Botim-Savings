import { NextRequest, NextResponse } from "next/server";
import { redeemPosition, getWalletBalance } from "@/lib/savings-store";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = redeemPosition(id);
    return NextResponse.json({ ...result, walletBalance: getWalletBalance() });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 422 }
    );
  }
}
