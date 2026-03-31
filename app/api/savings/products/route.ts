import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/savings-store";

export async function GET() {
  return NextResponse.json({ products: PRODUCTS });
}
