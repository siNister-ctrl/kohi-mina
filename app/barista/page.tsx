"use client";
import { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { RefreshCw, LogOut } from "lucide-react";

const ACTIVE_STATUSES = ["CONFIRMED", "PREPARING"];

export default function BaristaKDS() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      const role = (session?.user as any)?.role;
      if (role !== "BARISTA" && role !== "ADMIN" && role !== "CASHIER") router.push("/auth/login");
    }
  }, [status]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders?limit=50");
      const data = await res.json();
      setOrders(data.filter((o: any) => ACTIVE_STATUSES.includes(o.status) || o.status === "PENDING"));
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
    if (res.ok) { toast.success(`Marked as ${status}`); fetchOrders(); }
    else toast.error("Failed");
  }

  const pending = orders.filter((o) => o.status === "PENDING");
  const confirmed = orders.filter((o) => o.status === "CONFIRMED");
  const preparing = orders.filter((o) => o.status === "PREPARING");

  function OrderCard({ order, actions }: { order: any; actions: React.ReactNode }) {
    const elapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    return (
      <div className={`bg-white rounded-2xl p-4 shadow-sm border-t-4 ${
        elapsed > 15 ? "border-red-500" : elapsed > 10 ? "border-yellow-400" : "border-coffee-500"
      }`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-bold text-coffee-800 text-lg">{order.orderNumber}</p>
            <p className="text-coffee-500 text-sm">Table {order.table?.number}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              elapsed > 15 ? "bg-red-100 text-red-700" : elapsed > 10 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
            }`}>
              {elapsed}m ago
            </span>
          </div>
        </div>
        <div className="space-y-2 mb-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="bg-coffee-50 rounded-xl p-3">
              <div className="flex justify-between">
                <p className="font-semibold text-coffee-800">{item.product?.name}</p>
                <span className="bg-coffee-600 text-white text-xs px-2 py-0.5 rounded-full font-bold">×{item.quantity}</span>
              </div>
              <p className="text-coffee-500 text-xs mt-0.5">{item.size} • Sugar: {item.sugarLevel}</p>
              {item.notes && <p className="text-orange-600 text-xs mt-1 italic">! {item.notes}</p>}
            </div>
          ))}
        </div>
        {order.notes && (
          <p className="text-orange-600 text-sm bg-orange-50 rounded-lg p-2 mb-3">📝 {order.notes}</p>
        )}
        {actions}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-800 text-white">
      {/* Header */}
      <div className="bg-coffee-900 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-2xl">Kitchen Display</h1>
          <p className="text-coffee-300 text-xs">Kohi Mina Cafe — Barista Station</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-4 text-center">
            <div><p className="text-2xl font-bold text-yellow-400">{pending.length}</p><p className="text-xs text-coffee-400">New</p></div>
            <div><p className="text-2xl font-bold text-blue-400">{confirmed.length}</p><p className="text-xs text-coffee-400">Confirmed</p></div>
            <div><p className="text-2xl font-bold text-orange-400">{preparing.length}</p><p className="text-xs text-coffee-400">Preparing</p></div>
          </div>
          <button onClick={fetchOrders} className="p-2 hover:bg-coffee-700 rounded-xl transition-colors">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => signOut({ callbackUrl: "/auth/login" })} className="p-2 hover:bg-coffee-700 rounded-xl">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Columns */}
      <div className="grid grid-cols-3 gap-4 p-6 h-[calc(100vh-80px)] overflow-hidden">
        {/* New Orders */}
        <div className="flex flex-col">
          <div className="bg-yellow-500 text-yellow-900 rounded-xl px-4 py-2 mb-3 font-bold text-center">
            🔔 New Orders ({pending.length})
          </div>
          <div className="overflow-y-auto space-y-3 flex-1">
            {pending.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={
                  <button
                    onClick={() => updateStatus(order.id, "CONFIRMED")}
                    className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm"
                  >
                    Accept Order
                  </button>
                }
              />
            ))}
            {pending.length === 0 && <p className="text-coffee-400 text-center py-10">No new orders</p>}
          </div>
        </div>

        {/* Confirmed */}
        <div className="flex flex-col">
          <div className="bg-blue-500 text-white rounded-xl px-4 py-2 mb-3 font-bold text-center">
            ✅ Confirmed ({confirmed.length})
          </div>
          <div className="overflow-y-auto space-y-3 flex-1">
            {confirmed.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={
                  <button
                    onClick={() => updateStatus(order.id, "PREPARING")}
                    className="w-full py-2.5 bg-orange-500 text-white rounded-xl font-semibold text-sm"
                  >
                    Start Preparing
                  </button>
                }
              />
            ))}
            {confirmed.length === 0 && <p className="text-coffee-400 text-center py-10">No confirmed orders</p>}
          </div>
        </div>

        {/* Preparing */}
        <div className="flex flex-col">
          <div className="bg-orange-500 text-white rounded-xl px-4 py-2 mb-3 font-bold text-center">
            ☕ Preparing ({preparing.length})
          </div>
          <div className="overflow-y-auto space-y-3 flex-1">
            {preparing.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                actions={
                  <button
                    onClick={() => updateStatus(order.id, "READY")}
                    className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm"
                  >
                    🔔 Order Ready!
                  </button>
                }
              />
            ))}
            {preparing.length === 0 && <p className="text-coffee-400 text-center py-10">Nothing in progress</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
