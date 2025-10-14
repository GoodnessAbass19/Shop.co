import { autoReofferTimedOutDeliveries } from "@/lib/auto-reoffers";
import { NextResponse } from "next/server";

export async function GET() {
  await autoReofferTimedOutDeliveries();
  return NextResponse.json({ ok: true });
}
