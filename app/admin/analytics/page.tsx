"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const COLORS = ["#8b5e3c", "#c08040", "#d4a574", "#e8c9a0", "#f5e6d3"];

export default function AdminAnalytics() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<any>(null);
  const [period, setPeriod] = useState("monthly");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/analytics?period=${period}`)
      .then((r) => r.json())
      .then(setAnalytics)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-coffee-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const statusData = analytics?.ordersByStatus?.map((s: any) => ({
    name: s.status,
    value: s._count,
  })) || [];

  const hourlyData = (analytics?.hourlyOrders as any[] || []).map((h: any) => ({
    hour: `${h.hour}:00`,
    orders: parseInt(h.count),
  }));

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-coffee-600 rounded-xl"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-xl flex-1">Analytics</h1>
        <div className="flex gap-2">
          {["daily", "weekly", "monthly"].map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${period === p ? "bg-white text-coffee-700" : "bg-coffee-600 text-coffee-200"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Orders", value: analytics?.totalOrders || 0, suffix: "" },
            { label: "Completed", value: analytics?.completedOrders || 0, suffix: "" },
            { label: "Revenue", value: formatCurrency(analytics?.totalRevenue || 0), suffix: "" },
            { label: "Avg Order", value: formatCurrency(analytics?.averageOrderValue || 0), suffix: "" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-2xl p-5 shadow-sm">
              <p className="text-2xl font-bold text-coffee-800">{kpi.value}</p>
              <p className="text-coffee-500 text-sm mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top products */}
          {analytics?.topProducts?.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-coffee-800 mb-4">Best Selling Products</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.topProducts.map((p: any) => ({ name: p.product?.name?.split(" ")[0], qty: p._sum?.quantity || 0 }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#8b5e3c" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Order status pie */}
          {statusData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-coffee-800 mb-4">Orders by Status</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {statusData.map((_: any, index: number) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Peak hours */}
        {hourlyData.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-coffee-800 mb-4">Peak Ordering Hours</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5e6d3" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="orders" stroke="#8b5e3c" strokeWidth={2} dot={{ fill: "#8b5e3c" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top products list */}
        {analytics?.topProducts?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-coffee-800 mb-4">Product Performance</h3>
            <div className="space-y-3">
              {analytics.topProducts.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-coffee-100 rounded-full flex items-center justify-center text-coffee-700 font-bold text-sm">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-coffee-800">{p.product?.name}</span>
                      <span className="text-coffee-600">{p._sum?.quantity || 0} sold</span>
                    </div>
                    <div className="h-2 bg-coffee-100 rounded-full overflow-hidden">
                      <div className="h-full bg-coffee-500 rounded-full" style={{
                        width: `${((p._sum?.quantity || 0) / (analytics.topProducts[0]._sum?.quantity || 1)) * 100}%`
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory alerts */}
        {analytics?.ingredientAlerts?.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-red-700 mb-4">⚠️ Inventory Alerts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {analytics.ingredientAlerts.map((ing: any) => (
                <div key={ing.id} className={`rounded-xl p-3 text-sm ${
                  ing.alertLevel === "CRITICAL" ? "bg-red-50 border border-red-200" : "bg-yellow-50 border border-yellow-200"
                }`}>
                  <p className="font-semibold text-coffee-800">{ing.name}</p>
                  <p className="text-coffee-500">{ing.currentStock} {ing.unit}</p>
                  <span className={`text-xs font-bold ${ing.alertLevel === "CRITICAL" ? "text-red-600" : "text-yellow-600"}`}>
                    {ing.alertLevel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
