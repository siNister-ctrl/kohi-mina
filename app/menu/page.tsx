"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, X, ChevronDown } from "lucide-react";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  isAvailable: boolean;
  category: { id: number; name: string };
}

interface CartItem extends Product {
  quantity: number;
  size?: string;
  sugarLevel?: string;
}

const SIZES = ["Small", "Medium", "Large"];
const SUGAR_LEVELS = ["0%", "25%", "50%", "75%", "100%"];

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams.get("table");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [customSize, setCustomSize] = useState("Medium");
  const [customSugar, setCustomSugar] = useState("50%");
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!tableNumber) { toast.error("Invalid QR code — no table specified"); return; }
    fetchMenu();
  }, [tableNumber]);

  async function fetchMenu() {
    try {
      const [prodsRes, catsRes] = await Promise.all([
        fetch("/api/products"),
        fetch("/api/categories"),
      ]);
      const prods = await prodsRes.json();
      const cats = await catsRes.json();
      setProducts(prods);
      setCategories(cats);
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = activeCategory === "All"
    ? products
    : products.filter((p) => p.category.name === activeCategory);

  function addToCart(product: Product, size = "Medium", sugarLevel = "50%") {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id && i.size === size && i.sugarLevel === sugarLevel);
      if (existing) return prev.map((i) => i.id === product.id && i.size === size ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1, size, sugarLevel }];
    });
    setSelectedProduct(null);
    toast.success(`${product.name} added!`);
  }

  function updateQty(idx: number, delta: number) {
    setCart((prev) => {
      const updated = [...prev];
      updated[idx].quantity += delta;
      if (updated[idx].quantity <= 0) updated.splice(idx, 1);
      return updated;
    });
  }

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  async function placeOrder(paymentMethod: "CASH" | "GCASH") {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: tableNumber,
          paymentMethod,
          notes,
          items: cart.map((i) => ({
            productId: i.id,
            quantity: i.quantity,
            size: i.size,
            sugarLevel: i.sugarLevel,
          })),
        }),
      });

      const order = await res.json();
      if (!res.ok) throw new Error(order.error);

      if (paymentMethod === "GCASH") {
        const payRes = await fetch("/api/payments/gcash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: order.id }),
        });
        const payData = await payRes.json();
        if (payData.checkoutUrl) {
          window.location.href = payData.checkoutUrl;
          return;
        }
      }

      router.push(`/order/${order.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  if (!tableNumber) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-coffee-600 text-lg">Please scan the QR code on your table.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-coffee-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-coffee-600">Loading menu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream pb-32">
      {/* Header */}
      <div className="bg-coffee-700 text-white px-4 py-4 sticky top-0 z-40 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">Kohi Mina Cafe</h1>
            <p className="text-coffee-200 text-xs">Table {tableNumber} • Order at your seat</p>
          </div>
          <button
            onClick={() => setShowCart(true)}
            className="relative p-2 bg-coffee-600 rounded-xl"
          >
            <ShoppingCart size={22} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="bg-white shadow-sm sticky top-[72px] z-30">
        <div className="max-w-lg mx-auto px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide">
          {["All", ...categories.map((c) => c.name)].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-coffee-600 text-white"
                  : "bg-coffee-100 text-coffee-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Products */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3">
        {filteredProducts.map((product) => (
          <div
            key={product.id}
            className="bg-white rounded-2xl shadow-sm overflow-hidden flex items-center gap-4 p-4"
          >
            <div className="w-20 h-20 bg-coffee-100 rounded-xl flex-shrink-0 overflow-hidden">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">☕</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-coffee-800 text-sm">{product.name}</h3>
              <p className="text-coffee-500 text-xs mt-0.5 line-clamp-2">{product.description}</p>
              <p className="text-coffee-700 font-bold mt-1">{formatCurrency(product.price)}</p>
            </div>
            <button
              onClick={() => {
                setSelectedProduct(product);
                setCustomSize("Medium");
                setCustomSugar("50%");
              }}
              disabled={!product.isAvailable}
              className="flex-shrink-0 w-9 h-9 bg-coffee-600 text-white rounded-xl flex items-center justify-center hover:bg-coffee-700 transition-colors disabled:opacity-40"
            >
              <Plus size={18} />
            </button>
          </div>
        ))}
      </div>

      {/* Customize Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-coffee-800 text-lg">{selectedProduct.name}</h3>
                <p className="text-coffee-500 text-sm">{formatCurrency(selectedProduct.price)}</p>
              </div>
              <button onClick={() => setSelectedProduct(null)}>
                <X size={22} className="text-coffee-500" />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-coffee-700 mb-2">Size</p>
              <div className="flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setCustomSize(s)}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium border-2 transition-colors ${
                      customSize === s ? "border-coffee-600 bg-coffee-50 text-coffee-700" : "border-coffee-200 text-coffee-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-coffee-700 mb-2">Sugar Level</p>
              <div className="flex gap-2 flex-wrap">
                {SUGAR_LEVELS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setCustomSugar(s)}
                    className={`px-3 py-1.5 rounded-lg text-sm border-2 transition-colors ${
                      customSugar === s ? "border-coffee-600 bg-coffee-50 text-coffee-700" : "border-coffee-200 text-coffee-500"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => addToCart(selectedProduct, customSize, customSugar)}
              className="w-full py-3 bg-coffee-600 text-white rounded-xl font-semibold hover:bg-coffee-700 transition-colors"
            >
              Add to Order — {formatCurrency(selectedProduct.price)}
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-coffee-800 text-xl">Your Order</h2>
              <button onClick={() => setShowCart(false)}>
                <X size={22} className="text-coffee-500" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-coffee-500">
                <ShoppingCart size={40} className="mx-auto mb-3 opacity-40" />
                <p>Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-5">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-coffee-50 rounded-xl p-3">
                      <div className="flex-1">
                        <p className="font-medium text-coffee-800 text-sm">{item.name}</p>
                        <p className="text-coffee-500 text-xs">{item.size} • Sugar {item.sugarLevel}</p>
                        <p className="text-coffee-700 text-sm font-semibold">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(idx, -1)} className="w-7 h-7 bg-coffee-200 rounded-lg flex items-center justify-center">
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-coffee-800 w-5 text-center">{item.quantity}</span>
                        <button onClick={() => updateQty(idx, 1)} className="w-7 h-7 bg-coffee-600 text-white rounded-lg flex items-center justify-center">
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="text-sm font-medium text-coffee-700">Special Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-coffee-500"
                    rows={2}
                    placeholder="Allergies, special requests..."
                  />
                </div>

                <div className="border-t border-coffee-200 pt-4 mt-4">
                  <div className="flex justify-between font-bold text-coffee-800 text-lg mb-4">
                    <span>Total</span>
                    <span>{formatCurrency(cartTotal)}</span>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => placeOrder("CASH")}
                      disabled={submitting}
                      className="w-full py-3 bg-coffee-700 text-white rounded-xl font-semibold disabled:opacity-50"
                    >
                      💵 Pay with Cash
                    </button>
                    <button
                      onClick={() => placeOrder("GCASH")}
                      disabled={submitting}
                      className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
                    >
                      📱 Pay with GCash
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Sticky cart bar */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => setShowCart(true)}
              className="w-full py-4 bg-coffee-700 text-white rounded-2xl font-semibold flex items-center justify-between px-5 shadow-2xl"
            >
              <span className="bg-coffee-600 rounded-lg px-2 py-0.5 text-sm">{cartCount} items</span>
              <span>View Order</span>
              <span className="font-bold">{formatCurrency(cartTotal)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense>
      <MenuContent />
    </Suspense>
  );
}
