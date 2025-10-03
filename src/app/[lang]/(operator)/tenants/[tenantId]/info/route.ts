import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  await requireOperator();
  const merchant = await db.merchant.findUnique({
    where: { id: resolvedParams.tenantId },
    select: { name: true, id: true, type: true }
  });
  return NextResponse.json({
    name: merchant?.name ?? null,
    domain: merchant?.id ?? null,
    type: merchant?.type ?? null
  });
}












