import { useState } from "react";
import api from "../lib/api";

export default function DevTools() {
  const [out, setOut] = useState("");

  const showToken = () => setOut(localStorage.getItem("token") || "(no token)");

  const pingMe = async () => {
    try { const { data } = await api.get("/api/auth/me"); setOut(JSON.stringify(data, null, 2)); }
    catch (e) { setOut(e?.response?.data?.error || e.message); }
  };

  const createSample = async () => {
    try {
      const body = { title:"Brownies", description:"Fresh batch", quantity:2,
        imageUrl:"https://picsum.photos/400/240", tags:["sweet","chocolate"], allergies:["gluten"] };
      const { data } = await api.post("/api/listings", body);
      setOut(JSON.stringify(data, null, 2));
    } catch (e) { setOut(e?.response?.data?.error || e.message); }
  };

  const getListings = async () => {
    try { const { data } = await api.get("/api/listings"); setOut(JSON.stringify(data, null, 2)); }
    catch (e) { setOut(e?.response?.data?.error || e.message); }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "system-ui", maxWidth: 800 }}>
      <h1>Dev Tools</h1>
      <div style={{ display:"flex", gap:12, flexWrap:"wrap", marginBottom:16 }}>
        <button onClick={showToken}>Show token</button>
        <button onClick={pingMe}>GET /api/auth/me</button>
        <button onClick={createSample}>POST sample listing</button>
        <button onClick={getListings}>GET listings</button>
      </div>
      <pre style={{ background:"#111", color:"#0f0", padding:12, borderRadius:8, whiteSpace:"pre-wrap" }}>
        {out || "No output yet"}
      </pre>
    </div>
  );
}
