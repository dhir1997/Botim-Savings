import { NextRequest, NextResponse } from "next/server";
import {
  getPositions,
  getWalletBalance,
  createPosition,
  ProductId,
} from "@/lib/savings-store";

export async function GET() {
  return NextResponse.json({
    positions: getPositions(),
    walletBalance: getWalletBalance(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, amount } = body as { productId: ProductId; amount: number };

    if (!productId || !amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const position = createPosition(productId, amount);
    return NextResponse.json({ position, walletBalance: getWalletBalance() }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 422 }
    );
  }
}
