"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatCurrency, getStatusColor } from "@/lib/utils";
import Image from "next/image";

const STATUS_STEPS = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "COMPLETED"];
const STATUS_LABELS: Record<string, string> = {
  PENDING: "Order Received",
  CONFIRMED: "Order Confirmed",
  PREPARING: "Being Prepared",
  READY: "Ready for Pickup",
  SERVED: "Served",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};
const STATUS_DESC: Record<string, string> = {
  PENDING: "Your order has been received. Waiting for confirmation.",
  CONFIRMED: "Your order is confirmed! Our baristas are getting ready.",
  PREPARING: "Your drinks are being prepared. Sit back and relax!",
  READY: "Your order is ready! Someone will bring it to your table soon.",
  SERVED: "Enjoy your order!",
  COMPLETED: "Thank you for dining with us!",
  CANCELLED: "Your order was cancelled. Please contact our staff.",
};

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [id]);

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) setOrder(await res.json());
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-coffee-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="min-h-screen bg-cream flex items-center justify-center">
      <p className="text-coffee-600">Order not found.</p>
    </div>
  );

  const currentStep = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-4 py-4">
        <div className="max-w-lg mx-auto">
          <Image src="/logo.png" alt="Kohi Mina Cafe" width={120} height={48} className="mb-2" />
          <h1 className="font-bold text-lg">Order Tracking</h1>
          <p className="text-coffee-200 text-sm">Table {order.table?.number} • {order.orderNumber}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Status card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
          <div className="text-5xl mb-3">
            {order.status === "PENDING" && "⏳"}
            {order.status === "CONFIRMED" && "✅"}
            {order.status === "PREPARING" && "☕"}
            {order.status === "READY" && "🔔"}
            {order.status === "SERVED" && "🍵"}
            {order.status === "COMPLETED" && "⭐"}
            {order.status === "CANCELLED" && "❌"}
          </div>
          <h2 className="font-bold text-coffee-800 text-xl">{STATUS_LABELS[order.status]}</h2>
          <p className="text-coffee-500 text-sm mt-1">{STATUS_DESC[order.status]}</p>
          {!isCancelled && (
            <p className="text-coffee-400 text-xs mt-2">Auto-refreshing every 5 seconds</p>
          )}
        </div>

        {/* Progress steps */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="space-y-3">
              {STATUS_STEPS.slice(0, -1).map((step, idx) => (
                <div key={step} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    idx < currentStep ? "bg-coffee-600 text-white" :
                    idx === currentStep ? "bg-coffee-400 text-white ring-4 ring-coffee-200" :
                    "bg-gray-100 text-gray-400"
                  }`}>
                    {idx < currentStep ? "✓" : idx + 1}
                  </div>
                  <span className={`text-sm font-medium ${
                    idx <= currentStep ? "text-coffee-800" : "text-gray-400"
                  }`}>
                    {STATUS_LABELS[step]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order items */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-coffee-800 mb-3">Your Items</h3>
          <div className="space-y-3">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between items-start">
                <div>
                  <p className="text-coffee-800 text-sm font-medium">{item.product?.name}</p>
                  <p className="text-coffee-500 text-xs">{item.size} • {item.sugarLevel} sugar × {item.quantity}</p>
                </div>
                <p className="text-coffee-700 text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-coffee-100 mt-4 pt-4 flex justify-between font-bold text-coffee-800">
            <span>Total</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Payment status */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold text-coffee-800 mb-2">Payment</h3>
          <div className="flex justify-between text-sm">
            <span className="text-coffee-600">Method</span>
            <span className="font-medium text-coffee-800">{order.paymentMethod}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-coffee-600">Status</span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
              order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" :
              order.paymentStatus === "PENDING" ? "bg-yellow-100 text-yellow-800" :
              "bg-red-100 text-red-800"
            }`}>
              {order.paymentStatus}
            </span>
          </div>
          {order.payment?.paymongoUrl && order.paymentStatus !== "PAID" && (
            <a
              href={order.payment.paymongoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full block text-center py-2 bg-blue-600 text-white rounded-xl text-sm font-medium"
            >
              Complete GCash Payment
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
