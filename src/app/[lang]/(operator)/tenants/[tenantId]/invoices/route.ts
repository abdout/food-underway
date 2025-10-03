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

  // TODO: Implement invoice model for merchants
  // For now, return orders as invoice-like records
  const orders = await db.order.findMany({
    where: { merchantId: tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      paymentStatus: true,
    }
  });

  const rows = orders.map((order) => ({
    id: order.id,
    number: order.orderNumber,
    status: order.paymentStatus,
    amount: order.total,
    createdAt: order.createdAt?.toISOString?.() ?? String(order.createdAt),
  }));

  return NextResponse.json({ invoices: rows });
}
