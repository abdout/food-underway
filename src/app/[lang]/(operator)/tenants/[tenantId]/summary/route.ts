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

  const [owners, orders, menuItems, staff] = await Promise.all([
    db.user.findMany({
      where: { merchantId: tenantId, role: "OWNER" },
      select: { id: true, email: true },
    }),
    db.order.count({ where: { merchantId: tenantId } }),
    db.menuItem.count({
      where: {
        menu: { merchantId: tenantId }
      }
    }),
    db.user.count({
      where: {
        merchantId: tenantId,
        role: { in: ["MANAGER", "CASHIER", "STAFF"] }
      }
    }),
  ]);

  return NextResponse.json({
    owners,
    metrics: { orders, menuItems, staff },
  });
}












