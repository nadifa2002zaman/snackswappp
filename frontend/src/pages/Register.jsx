import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import AuthCard from "../components/AuthCard";

export default function Register() {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      await api.post("/auth/register", form);  // no extra /api
      navigate("/login");
    } catch (e) {
      setErr(e?.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join SnackSwap to share & trade snacks."
      footer={<span>Already have an account? <Link to="/login" className="text-indigo-600 font-medium">Log in</Link></span>}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <input placeholder="Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full p-2 border rounded-lg" required />
        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full p-2 border rounded-lg" required />
        <input type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full p-2 border rounded-lg" required />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button disabled={loading} className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700">
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </AuthCard>
  );
}
