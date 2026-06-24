"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
import Link from "next/link";

export default function AdminMenu() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [form, setForm] = useState({ name: "", description: "", price: "", categoryId: "", imageUrl: "" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    fetchData();
  }, [status]);

  async function fetchData() {
    const [prods, cats] = await Promise.all([
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]);
    setProducts(Array.isArray(prods) ? prods : []);
    setCategories(Array.isArray(cats) ? cats : []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editProduct ? `/api/products/${editProduct.id}` : "/api/products";
    const method = editProduct ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editProduct ? "Product updated!" : "Product created!");
      setShowForm(false);
      setEditProduct(null);
      setForm({ name: "", description: "", price: "", categoryId: "", imageUrl: "" });
      fetchData();
    } else {
      toast.error("Failed to save product");
    }
  }

  async function toggleAvailability(product: any) {
    await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !product.isAvailable }),
    });
    fetchData();
  }

  async function deleteProduct(id: number) {
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    toast.success("Deleted");
    fetchData();
  }

  const grouped = categories.map((cat) => ({
    ...cat,
    products: products.filter((p) => p.category?.id === cat.id),
  }));

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-coffee-600 rounded-xl transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-bold text-xl flex-1">Menu Management</h1>
        <button
          onClick={() => { setShowForm(true); setEditProduct(null); setForm({ name: "", description: "", price: "", categoryId: "", imageUrl: "" }); }}
          className="flex items-center gap-2 bg-white text-coffee-700 px-4 py-2 rounded-xl font-semibold text-sm"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-8">
        {grouped.map((cat) => (
          <div key={cat.id}>
            <h2 className="font-bold text-coffee-700 text-lg mb-3 border-b border-coffee-200 pb-2">{cat.name}</h2>
            <div className="space-y-2">
              {cat.products.length === 0 && (
                <p className="text-coffee-400 text-sm pl-2">No products in this category</p>
              )}
              {cat.products.map((product: any) => (
                <div key={product.id} className={`bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm ${!product.isAvailable ? "opacity-60" : ""}`}>
                  <div className="w-14 h-14 bg-coffee-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                    {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover rounded-xl" /> : "☕"}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-coffee-800">{product.name}</p>
                    <p className="text-coffee-500 text-xs line-clamp-1">{product.description}</p>
                    <p className="text-coffee-700 font-bold text-sm">{formatCurrency(product.price)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => toggleAvailability(product)} title={product.isAvailable ? "Mark unavailable" : "Mark available"}>
                      {product.isAvailable
                        ? <ToggleRight size={24} className="text-green-500" />
                        : <ToggleLeft size={24} className="text-gray-400" />}
                    </button>
                    <button onClick={() => { setEditProduct(product); setForm({ name: product.name, description: product.description || "", price: product.price.toString(), categoryId: product.categoryId?.toString() || "", imageUrl: product.imageUrl || "" }); setShowForm(true); }}
                      className="p-2 hover:bg-coffee-50 rounded-lg transition-colors">
                      <Pencil size={16} className="text-coffee-500" />
                    </button>
                    <button onClick={() => deleteProduct(product.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} className="text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-coffee-800 text-xl mb-5">{editProduct ? "Edit Product" : "Add Product"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-coffee-700">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" required />
              </div>
              <div>
                <label className="text-sm font-medium text-coffee-700">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm resize-none" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-coffee-700">Price (₱)</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-coffee-700">Category</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm" required>
                    <option value="">Select...</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-coffee-700">Image URL (optional)</label>
                <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coffee-500 text-sm"
                  placeholder="https://..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditProduct(null); }}
                  className="flex-1 py-2.5 border border-coffee-200 rounded-xl text-coffee-600 font-semibold text-sm">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-2.5 bg-coffee-600 text-white rounded-xl font-semibold text-sm">
                  {editProduct ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
