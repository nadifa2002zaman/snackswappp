import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../lib/auth";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginWithToken } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", {
        email: form.email.trim(),
        password: form.password,
      });

      const ok = data?.ok ?? true;
      const token = data?.token ?? data?.data?.token;
      if (!ok || !token) throw new Error(data?.error || data?.message || "Login failed");

      if (typeof loginWithToken === "function") {
        await loginWithToken(token);
      } else {
        localStorage.setItem("token", token);
      }

      navigate("/dashboard");
    } catch (e2) {
      const msg =
        e2?.response?.data?.error ||
        e2?.response?.data?.message ||
        e2?.message ||
        "Invalid email or password";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    // full-viewport, centered overlay so outer wrappers can't push it left
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-orange-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-2xl shadow-xl p-6 sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-orange-500
                             bg-clip-text text-transparent">
              Welcome back
            </span>
          </h1>
          <p className="text-slate-600 mt-1">Log in to manage your snacks.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-200"
            required
          />

          {err && <p className="text-red-600 text-sm">{err}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-2.5
                       hover:bg-indigo-700 active:translate-y-px transition disabled:opacity-60">
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          New here?{" "}
          <Link to="/register" className="text-indigo-600 font-medium hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
