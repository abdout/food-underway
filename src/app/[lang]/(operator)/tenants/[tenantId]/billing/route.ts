import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  await requireOperator();
  const tenantId = resolvedParams.tenantId;

  // Updated for merchant model
  const merchant = await db.merchant.findUnique({
    where: { id: tenantId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEndDate: true
    }
  });

  // TODO: Implement invoice model for merchants if needed
  const outstandingCents = 0;

  return NextResponse.json({
    planType: merchant?.subscriptionTier ?? "STARTER",
    status: merchant?.subscriptionStatus ?? "TRIALING",
    trialEndsAt: merchant?.subscriptionEndDate?.toISOString() ?? null,
    nextInvoiceDate: null as string | null,
    outstandingCents,
  });
}