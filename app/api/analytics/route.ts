import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") || "daily";

    const now = new Date();
    let startDate = new Date();

    if (period === "daily") {
      startDate.setHours(0, 0, 0, 0);
    } else if (period === "weekly") {
      startDate.setDate(now.getDate() - 7);
    } else if (period === "monthly") {
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);
    }

    const [
      totalOrders,
      completedOrders,
      totalRevenue,
      ordersByStatus,
      topProducts,
      recentOrders,
      hourlyOrders,
      ingredientAlerts,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: startDate } } }),
      prisma.order.count({ where: { status: "COMPLETED", createdAt: { gte: startDate } } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: "COMPLETED", paymentStatus: "PAID", createdAt: { gte: startDate } },
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
        where: { createdAt: { gte: startDate } },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        _count: true,
        where: { order: { createdAt: { gte: startDate }, status: "COMPLETED" } },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: startDate } },
        include: { table: true, items: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.$queryRaw`
        SELECT EXTRACT(HOUR FROM "createdAt") as hour, COUNT(*) as count
        FROM "Order"
        WHERE "createdAt" >= ${startDate}
        GROUP BY hour
        ORDER BY hour
      `,
      prisma.ingredient.findMany({
        where: { alertLevel: { in: ["LOW", "CRITICAL"] } },
        orderBy: { alertLevel: "desc" },
      }),
    ]);

    // Fetch product names for top products
    const topProductsWithNames = await Promise.all(
      topProducts.map(async (tp: { productId: number; _count: number; _sum: { quantity: number | null } }) => {
        const product = await prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, category: { select: { name: true } } },
        });
        return { ...tp, product };
      })
    );

    return NextResponse.json({
      totalOrders,
      completedOrders,
      totalRevenue: totalRevenue._sum.total || 0,
      averageOrderValue: completedOrders > 0 ? (totalRevenue._sum.total || 0) / completedOrders : 0,
      ordersByStatus,
      topProducts: topProductsWithNames,
      recentOrders,
      hourlyOrders,
      ingredientAlerts,
      period,
      startDate,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}
