"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency, getStatusColor, getPaymentStatusColor } from "@/lib/utils";
import { Bell, LogOut, RefreshCw, CheckCircle, X } from "lucide-react";

const ORDER_STATUSES = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];
const NEXT_STATUS: Record<string, string> = {
  PENDING: "CONFIRMED",
  CONFIRMED: "PREPARING",
  PREPARING: "READY",
  READY: "SERVED",
  SERVED: "COMPLETED",
};

export default function CashierDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [notifSound] = useState(() => typeof window !== "undefined" ? new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA...") : null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "CASHIER" && role !== "ADMIN") router.push("/auth/login");
    }
  }, [status]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders?limit=100");
      const data = await res.json();
      const prev = orders.length;
      setOrders(data);
      // Notify if new orders
      if (prev > 0 && data.filter((o: any) => o.status === "PENDING").length > orders.filter((o: any) => o.status === "PENDING").length) {
        toast("🔔 New order received!", { icon: "☕" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: number, status: string) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Order updated to ${status}`);
      fetchOrders();
      setSelectedOrder(null);
    } else {
      toast.error("Failed to update");
    }
  }

  async function markPaid(orderId: number) {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus: "PAID" }),
    });
    if (res.ok) { toast.success("Marked as Paid"); fetchOrders(); setSelectedOrder(null); }
  }

  const filteredOrders = filter === "ALL" ? orders : orders.filter((o) => o.status === filter);
  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="font-bold text-xl">Cashier Dashboard</h1>
          <p className="text-coffee-200 text-xs">Kohi Mina Cafe</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-sm px-3 py-1 rounded-full font-bold animate-pulse">
              {pendingCount} Pending
            </span>
          )}
          <button onClick={fetchOrders} className="p-2 hover:bg-coffee-600 rounded-xl transition-colors">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="p-2 hover:bg-coffee-600 rounded-xl transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 px-6 py-4">
        {[
          { label: "Pending", value: orders.filter((o) => o.status === "PENDING").length, color: "bg-yellow-50 border-yellow-200 text-yellow-700" },
          { label: "Preparing", value: orders.filter((o) => o.status === "PREPARING").length, color: "bg-orange-50 border-orange-200 text-orange-700" },
          { label: "Ready", value: orders.filter((o) => o.status === "READY").length, color: "bg-green-50 border-green-200 text-green-700" },
          { label: "Today", value: orders.filter((o) => new Date(o.createdAt).toDateString() === new Date().toDateString()).length, color: "bg-coffee-50 border-coffee-200 text-coffee-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} border rounded-xl p-3 text-center`}>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs font-medium">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="px-6 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
        {["ALL", ...ORDER_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === s ? "bg-coffee-600 text-white" : "bg-white text-coffee-600 border border-coffee-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Orders grid */}
      <div className="px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
        {loading ? (
          <div className="col-span-3 text-center py-20 text-coffee-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="col-span-3 text-center py-20 text-coffee-500">
            <p className="text-4xl mb-3">☕</p>
            <p>No orders {filter !== "ALL" ? `with status ${filter}` : "yet"}</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => setSelectedOrder(order)}
              className={`bg-white rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow border-l-4 ${
                order.status === "PENDING" ? "border-yellow-400" :
                order.status === "CONFIRMED" ? "border-blue-400" :
                order.status === "PREPARING" ? "border-orange-400" :
                order.status === "READY" ? "border-green-500" :
                order.status === "COMPLETED" ? "border-gray-300" :
                "border-red-400"
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-coffee-800">{order.orderNumber}</p>
                  <p className="text-coffee-500 text-sm">Table {order.table?.number}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-1 mb-3">
                {order.items?.slice(0, 3).map((item: any) => (
                  <p key={item.id} className="text-coffee-600 text-xs">• {item.product?.name} ×{item.quantity}</p>
                ))}
                {order.items?.length > 3 && (
                  <p className="text-coffee-400 text-xs">+{order.items.length - 3} more items</p>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold text-coffee-800">{formatCurrency(order.total)}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {order.paymentMethod} · {order.paymentStatus}
                  </span>
                </div>
              </div>
              <p className="text-coffee-400 text-xs mt-2">{new Date(order.createdAt).toLocaleTimeString()}</p>
            </div>
          ))
        )}
      </div>

      {/* Order detail modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-coffee-800 text-xl">{selectedOrder.orderNumber}</h2>
                <button onClick={() => setSelectedOrder(null)}>
                  <X size={20} className="text-coffee-500" />
                </button>
              </div>
              <div className="space-y-1 mb-4">
                <p className="text-coffee-600 text-sm">Table {selectedOrder.table?.number}</p>
                <p className="text-coffee-600 text-sm">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                {selectedOrder.notes && <p className="text-coffee-500 text-sm italic">Note: {selectedOrder.notes}</p>}
              </div>

              <div className="space-y-2 mb-5">
                {selectedOrder.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between bg-coffee-50 rounded-xl p-3">
                    <div>
                      <p className="font-medium text-coffee-800 text-sm">{item.product?.name}</p>
                      <p className="text-coffee-400 text-xs">{item.size} • Sugar {item.sugarLevel}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-coffee-700 font-semibold text-sm">{formatCurrency(item.price * item.quantity)}</p>
                      <p className="text-coffee-400 text-xs">×{item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-coffee-100 pt-4 mb-5">
                <div className="flex justify-between font-bold text-coffee-800 text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-coffee-500">Payment</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                    {selectedOrder.paymentMethod} · {selectedOrder.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {NEXT_STATUS[selectedOrder.status] && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, NEXT_STATUS[selectedOrder.status])}
                    className="w-full py-3 bg-coffee-600 text-white rounded-xl font-semibold"
                  >
                    → Mark as {NEXT_STATUS[selectedOrder.status]}
                  </button>
                )}
                {selectedOrder.paymentStatus !== "PAID" && (
                  <button
                    onClick={() => markPaid(selectedOrder.id)}
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold"
                  >
                    ✓ Mark as Paid
                  </button>
                )}
                {selectedOrder.status !== "CANCELLED" && selectedOrder.status !== "COMPLETED" && (
                  <button
                    onClick={() => updateStatus(selectedOrder.id, "CANCELLED")}
                    className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold"
                  >
                    Cancel Order
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
