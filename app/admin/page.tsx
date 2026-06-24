"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils";
import { BarChart2, Package, Users, QrCode, FileText, ShoppingBag, LogOut, AlertTriangle } from "lucide-react";

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState("daily");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "ADMIN") router.push("/auth/login");
    }
  }, [status]);

  useEffect(() => {
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setAnalytics);
  }, [period]);

  const navItems = [
    { href: "/admin/menu", label: "Menu Management", icon: ShoppingBag, desc: "Add, edit, remove products" },
    { href: "/admin/inventory", label: "Inventory", icon: Package, desc: "Manage stock & ingredients" },
    { href: "/admin/users", label: "Staff Accounts", icon: Users, desc: "Manage staff & roles" },
    { href: "/admin/qr-codes", label: "QR Codes", icon: QrCode, desc: "Print table QR codes" },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart2, desc: "Sales & performance" },
    { href: "/admin/reports", label: "Reports", icon: FileText, desc: "Export PDF & Excel" },
  ];

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Kohi Mina" width={100} height={40} />
          <div>
            <h1 className="font-bold text-lg">Admin Panel</h1>
            <p className="text-coffee-200 text-xs">{(session?.user as any)?.name}</p>
          </div>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="flex items-center gap-2 p-2 hover:bg-coffee-600 rounded-xl transition-colors text-sm">
          <LogOut size={16} /> Logout
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Period selector */}
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors ${
                period === p ? "bg-coffee-600 text-white" : "bg-white text-coffee-600 border border-coffee-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Stats */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Orders", value: analytics.totalOrders, icon: "📦" },
              { label: "Completed", value: analytics.completedOrders, icon: "✅" },
              { label: "Revenue", value: formatCurrency(analytics.totalRevenue), icon: "💰" },
              { label: "Avg Order", value: formatCurrency(analytics.averageOrderValue), icon: "📊" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-3xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold text-coffee-800">{s.value}</p>
                <p className="text-coffee-500 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Inventory alerts */}
        {analytics?.ingredientAlerts?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={20} className="text-red-600" />
              <h3 className="font-bold text-red-700">Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {analytics.ingredientAlerts.map((ing: any) => (
                <div key={ing.id} className={`rounded-xl p-3 text-sm ${
                  ing.alertLevel === "CRITICAL" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                }`}>
                  <p className="font-semibold">{ing.name}</p>
                  <p>{ing.currentStock} {ing.unit} left</p>
                  <span className={`text-xs font-bold ${ing.alertLevel === "CRITICAL" ? "text-red-600" : "text-yellow-600"}`}>
                    {ing.alertLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top products */}
        {analytics?.topProducts?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-coffee-800 mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {analytics.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-coffee-100 rounded-full flex items-center justify-center text-coffee-700 font-bold text-sm">{i + 1}</span>
                  <div className="flex-1">
                    <p className="font-medium text-coffee-800 text-sm">{p.product?.name}</p>
                    <p className="text-coffee-500 text-xs">{p.product?.category?.name}</p>
                  </div>
                  <span className="font-bold text-coffee-700">{p._sum?.quantity || 0} sold</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nav cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group border border-coffee-100 hover:border-coffee-300"
            >
              <item.icon size={28} className="text-coffee-500 mb-3 group-hover:text-coffee-700 transition-colors" />
              <h3 className="font-bold text-coffee-800 mb-1">{item.label}</h3>
              <p className="text-coffee-500 text-sm">{item.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
