"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, ArrowLeft, Shield } from "lucide-react";
import Link from "next/link";

const ROLES = ["ADMIN", "CASHIER", "BARISTA"];

export default function AdminUsers() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "CASHIER" });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    fetchData();
  }, [status]);

  async function fetchData() {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = editUser ? `/api/users/${editUser.id}` : "/api/users";
    const method = editUser ? "PATCH" : "POST";
    const body: any = { name: form.name, role: form.role };
    if (!editUser) { body.email = form.email; body.password = form.password; }
    if (form.password && editUser) body.password = form.password;

    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) {
      toast.success(editUser ? "Updated!" : "Created!");
      setShowForm(false); setEditUser(null);
      setForm({ name: "", email: "", password: "", role: "CASHIER" });
      fetchData();
    } else toast.error("Failed");
  }

  async function toggleActive(user: any) {
    await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchData();
  }

  async function deleteUser(id: number) {
    if (!confirm("Delete this user?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    toast.success("Deleted"); fetchData();
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-700",
    CASHIER: "bg-blue-100 text-blue-700",
    BARISTA: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="min-h-screen bg-cream">
      <div className="bg-coffee-700 text-white px-6 py-4 flex items-center gap-4">
        <Link href="/admin" className="p-2 hover:bg-coffee-600 rounded-xl"><ArrowLeft size={20} /></Link>
        <h1 className="font-bold text-xl flex-1">Staff Accounts</h1>
        <button onClick={() => { setShowForm(true); setEditUser(null); setForm({ name: "", email: "", password: "", role: "CASHIER" }); }}
          className="flex items-center gap-2 bg-white text-coffee-700 px-4 py-2 rounded-xl font-semibold text-sm">
          <Plus size={16} /> Add Staff
        </button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        {users.map((user) => (
          <div key={user.id} className={`bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm ${!user.isActive ? "opacity-60" : ""}`}>
            <div className="w-10 h-10 bg-coffee-100 rounded-full flex items-center justify-center text-coffee-700 font-bold text-sm flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-coffee-800">{user.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${roleColors[user.role]}`}>{user.role}</span>
                {!user.isActive && <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">Inactive</span>}
              </div>
              <p className="text-coffee-500 text-sm">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggleActive(user)} title={user.isActive ? "Deactivate" : "Activate"}
                className="p-2 hover:bg-coffee-50 rounded-lg">
                <Shield size={16} className={user.isActive ? "text-green-500" : "text-gray-400"} />
              </button>
              <button onClick={() => { setEditUser(user); setForm({ name: user.name, email: user.email, password: "", role: user.role }); setShowForm(true); }}
                className="p-2 hover:bg-coffee-50 rounded-lg">
                <Pencil size={16} className="text-coffee-500" />
              </button>
              <button onClick={() => deleteUser(user.id)} className="p-2 hover:bg-red-50 rounded-lg">
                <Trash2 size={16} className="text-red-400" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="font-bold text-coffee-800 text-xl mb-5">{editUser ? "Edit Staff" : "Add Staff"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-coffee-700">Name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" required />
              </div>
              {!editUser && (
                <div>
                  <label className="text-sm font-medium text-coffee-700">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500" required />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-coffee-700">{editUser ? "New Password (leave blank to keep)" : "Password"}</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500"
                  required={!editUser} />
              </div>
              <div>
                <label className="text-sm font-medium text-coffee-700">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-coffee-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-coffee-500">
                  {ROLES.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); setEditUser(null); }}
                  className="flex-1 py-2.5 border border-coffee-200 rounded-xl text-coffee-600 font-semibold text-sm">Cancel</button>
                <button type="submit" className="flex-1 py-2.5 bg-coffee-600 text-white rounded-xl font-semibold text-sm">
                  {editUser ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
