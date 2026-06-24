"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ArrowLeft, PackagePlus } from "lucide-react";
import Link from "next/link";

export default function AdminInventory() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showRestock, setShowRestock] = useState<any>(null);
  const [editIng, setEditIng] = useState<any>(null);
  const [form, setForm] = useState({ name: "", unit: "", currentStock: "", lowStockAlert: "10", criticalAlert: "5" });
  const [restockAmount, setRestockAmount] = useState("");
  const [restockNote, setRestockNote] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    fetchData();
  }, [status]);

  async function fetchData() {
    const res = await fetch("/api/ingredients");
    const data = await res.json();
    setIngredients(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editIng ? `/api/ingredients/${editIng.id}` : "/api/ingredients";
    const method = editIng ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editIng ? "Updated!" : "Created!");
      setShowForm(false); setEditIng(null);
      setForm({ name: "", unit: "", currentStock: "", lowStockAlert: "10", criticalAlert: "5" });
      fetchData();
    } else toast.error("Failed");
  }

  async function handleRestock() {
    const res = await fetch(`/api/ingredients/${showRestock.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restock: true, amount: restockAmount, note: restockNote }),
    });
    if (res.ok) { toast.success("Restocked!"); setShowRestock(null); setRestockAmount(""); fetchData(); }
    else toast.error("Failed");
  }

  async function deleteIng(id: number) {
    if (!confirm("Delete ingredient?")) return;
    await fetch(`/api/ingredients/${id}`, { method: "DELETE" });
    toast.success("Deleted"); fetchData();
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-coffee-600 rounded-xl"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-xl flex-1">Inventory Management</h1>
        <button onClick={() => { setShowForm(true); setEditIng(null); }}
          className="flex items-center gap-2 bg-white text-coffee-700 px-4 py-2 rounded-xl font-semibold text-sm">
          <Plus size={16} /> Add Ingredient
        </button>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Alert summary */}
        {ingredients.some((i) => i.alertLevel !== "NORMAL") && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700 font-semibold text-sm">⚠️ {ingredients.filter((i) => i.alertLevel !== "NORMAL").length} ingredient(s) need restocking</p>
          </div>
        )}

        <div className="space-y-3">
          {ingredients.map((ing) => (
            <div key={ing.id} className={`bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm border-l-4 ${
              ing.alertLevel === "CRITICAL" ? "border-red-500" :
              ing.alertLevel === "LOW" ? "border-yellow-400" : "border-green-400"
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-coffee-800">{ing.name}</p>
                  {ing.alertLevel !== "NORMAL" && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      ing.alertLevel === "CRITICAL" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                    }`}>{ing.alertLevel}</span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-coffee-600 text-sm font-medium">{ing.currentStock} {ing.unit}</p>
                  <p className="text-coffee-400 text-xs">Low: {ing.lowStockAlert} | Critical: {ing.criticalAlert}</p>
                </div>
                {/* Stock bar */}
                <div className="mt-2 h-2 bg-coffee-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      ing.alertLevel === "CRITICAL" ? "bg-red-500" :
                      ing.alertLevel === "LOW" ? "bg-yellow-400" : "bg-green-500"
                    }`}
                    style={{ width: `${Math.min(100, (ing.currentStock / (ing.lowStockAlert * 3)) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowRestock(ing)}
                  className="p-2 hover:bg-green-50 rounded-lg" title="Restock">
                  <PackagePlus size={18} className="text-green-600" />
                </button>
                <button onClick={() => { setEditIng(ing); setForm({ name: ing.name, unit: ing.unit, currentStock: ing.currentStock.toString(), lowStockAlert: ing.lowStockAlert.toString(), criticalAlert: ing.criticalAlert.toString() }); setShowForm(true); }}
                  className="p-2 hover:bg-coffee-50 rounded-lg">
                  <Pencil size={16} className="text-coffee-500" />
                </button>
                <button onClick={() => deleteIng(ing.id)} className="p-2 hover:bg-red-50 rounded-lg">
                  <Trash2 size={16} className="text-red-400" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-coffee-800 text-xl mb-5">{editIng ? "Edit Ingredient" : "Add Ingredient"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-coffee-700">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-coffee-700">Unit</label>
                  <input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    placeholder="g, ml, pcs..."
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" required />
                </div>
                <div>
                  <label className="text-sm font-medium text-coffee-700">Current Stock</label>
                  <input type="number" value={form.currentStock} onChange={(e) => setForm({ ...form, currentStock: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-coffee-700">Low Stock Alert</label>
                  <input type="number" value={form.lowStockAlert} onChange={(e) => setForm({ ...form, lowStockAlert: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-coffee-700">Critical Alert</label>
                  <input type="number" value={form.criticalAlert} onChange={(e) => setForm({ ...form, criticalAlert: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditIng(null); }}
                  className="flex-1 py-2.5 border border-coffee-200 rounded-xl text-coffee-600 font-semibold text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-coffee-600 text-white rounded-xl font-semibold text-sm">
                  {editIng ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestock && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-coffee-800 text-xl mb-1">Restock</h2>
            <p className="text-coffee-500 text-sm mb-4">{showRestock.name} — Current: {showRestock.currentStock} {showRestock.unit}</p>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-coffee-700">Amount to Add ({showRestock.unit})</label>
                <input type="number" value={restockAmount} onChange={(e) => setRestockAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" />
              </div>
              <div>
                <label className="text-sm font-medium text-coffee-700">Note (optional)</label>
                <input value={restockNote} onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  placeholder="Supplier, batch #..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowRestock(null)} className="flex-1 py-2.5 border border-coffee-200 rounded-xl text-coffee-600 font-semibold text-sm">Cancel</button>
                <button onClick={handleRestock} className="flex-1 py-2.5 bg-green-600 text-white rounded-xl font-semibold text-sm">Restock</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
