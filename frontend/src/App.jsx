// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./lib/auth";
import NavBar from "./components/NavBar";

// pages
import Listings from "./pages/Listing";
import CreateListing from "./pages/CreateListing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Threads from "./pages/Threads.jsx";
import ThreadView from "./pages/ThreadView.jsx";
import Offers from "./pages/offers"; // ⬅️ if your file is "Offers.jsx", change to: ./pages/Offers
import Reviews from "./pages/Reviews";
import Admin from "./pages/Admin";


function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-6">Loading…</p>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Navigate to="/listings" replace />} />
          <Route path="/listings" element={<Listings />} />
           <Route path="/admin" element={<Admin />} />

          {/* Messages */}
          <Route path="/threads" element={<Threads />} />
          <Route path="/threads/:id" element={<ThreadView />} />

          {/* Offers */}
          <Route path="/offers" element={<Offers />} />

          {/* Protected */}
          <Route
            path="/create"
            element={
              <Private>
                <CreateListing />
              </Private>
            }
          />
          <Route
            path="/dashboard"
            element={
              <Private>
                <Dashboard />
              </Private>
            }
          />
          <Route path="/reviews" element={<Reviews />} />


          {/* Auth */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/listings" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
