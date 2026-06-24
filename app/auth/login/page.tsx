"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      toast.error("Invalid email or password");
    } else {
      toast.success("Welcome back!");
      // Redirect based on role — fetch session
      const sessionRes = await fetch("/api/auth/session");
      const session = await sessionRes.json();
      const role = session?.user?.role;
      if (role === "ADMIN") router.push("/admin");
      else if (role === "CASHIER") router.push("/cashier");
      else if (role === "BARISTA") router.push("/barista");
      else router.push("/");
    }
  }

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <Image src="/logo.png" alt="Kohi Mina Cafe" width={180} height={72} className="mx-auto mb-2" />
          <p className="text-coffee-500 text-sm">Staff Portal</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500 text-coffee-800"
              placeholder="you@kohimina.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-coffee-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-coffee-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coffee-500 text-coffee-800"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-coffee-600 text-white rounded-lg font-semibold hover:bg-coffee-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="text-xs text-coffee-500 text-center space-y-1">
          <p>Admin: admin@kohimina.com / admin123</p>
          <p>Cashier: cashier@kohimina.com / cashier123</p>
          <p>Barista: barista@kohimina.com / barista123</p>
        </div>
      </div>
    </div>
  );
}
