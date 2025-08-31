import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function CreateListing() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    quantity: 1,
    imageUrl: "" // optional URL
  });
  const [file, setFile] = useState(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState("");
  const [allergies, setAllergies] = useState("");


  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);

    try {
      let finalImageUrl = (form.imageUrl || "").trim();

      // If a file is chosen, upload it first
      if (file) {
        const fd = new FormData();
        fd.append("image", file);

        // NOTE: baseURL already contains /api, so don't prefix /api here
        const { data: up } = await api.post("/uploads", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        finalImageUrl = up?.url;
        if (!finalImageUrl) throw new Error("Upload failed: no URL returned");
      }

      if (!finalImageUrl) {
        throw new Error("Please choose a file or paste an image URL");
      }

      const toArray = (s) =>
        Array.isArray(s) ? s :
        (typeof s === "string" ? s.split(/[,\n]/).map(x=>x.trim()).filter(Boolean) : []);

      const payload = {
        title: form.title,
        description: form.description,
        quantity: Number(form.quantity) || 1,
        imageUrl: finalImageUrl,
        tags: toArray(tags),
        allergies: toArray(allergies).map(a => a.toLowerCase()),
      };


      
      
      
      
      
      
      
      
      
      
      // Create the listing
      await api.post("/listings", payload);

      navigate("/listings");
    } catch (e) {
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.error ||
        (status ? `Request failed with status code ${status}` : e.message || "Request failed");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-5xl font-bold text-slate-800 mb-8">Create Listing</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full p-2 border rounded-lg"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <input
            className="w-full p-2 border rounded-lg"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Quantity</label>
          <input
            type="number"
            min="1"
            className="w-full p-2 border rounded-lg"
            value={form.quantity}
            onChange={(e) => setForm({ ...form, quantity: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Choose image (phone/PC)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Or paste an image URL (optional)
          </label>
          <input
            placeholder="https://…"
            className="w-full p-2 border rounded-lg"
            value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          />
        </div>
      
      {/* Extra metadata fields */}
      <label className="block text-sm mt-3">Tags (csv)</label>
      <input
        className="w-full p-2 border rounded-lg"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="vegan,sweet,homemade"
      />

      <label className="block text-sm mt-3">Allergies (csv)</label>
      <input
        className="w-full p-2 border rounded-lg"
        value={allergies}
        onChange={(e) => setAllergies(e.target.value)}
        placeholder="nuts,gluten,dairy"
      />




        {file && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(file)}
              alt="preview"
              className="max-h-56 rounded border"
            />
          </div>
        )}

        {err && <p className="text-red-600">{err}</p>}

        <button
          disabled={loading}
          className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </form>
    </div>
  );
}
