import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { useUnread } from "../lib/unread";

export default function NavBar() {
  const { user, logout } = useAuth();
  const { msgs, offers } = useUnread();
  const nav = useNavigate();
  const loc = useLocation();

  function handleLogout() {
    logout();
    if (
      loc.pathname.startsWith("/create") ||
      loc.pathname.startsWith("/dashboard")
    ) {
      nav("/login");
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center">
      {/* LEFT group (Listings / Create) */}
      <div className="inline-flex items-center gap-5 nav-fix">
        <Link to="/listings" className="font-medium text-indigo-300 hover:text-pink-300">
          Listings
        </Link>
        <Link to="/create" className="font-medium text-indigo-300 hover:text-pink-300">
          Create
        </Link>
      </div>

      {/* RIGHT group */}
      <div className="ml-auto inline-flex items-center gap-4 nav-fix">
        {user ? (
          <>
            <Link to="/threads" className="relative font-medium text-indigo-600">
              Messages
              {msgs > 0 && (
                <span className="absolute -top-2 -right-3 text-xs bg-rose-600 text-white rounded-full px-1.5 py-0.5">
                  {msgs}
                </span>
              )}
            </Link>

            <Link to="/offers" className="relative font-medium text-indigo-600">
              Offers
              {offers > 0 && (
                 <span className="absolute -top-2 -right-3 text-xs bg-rose-600 text-white rounded-full px-1.5 py-0.5">
                     {offers}
                 </span>
              )}
            </Link>

            {user.role === "admin" && (
              <Link to="/admin" className="font-medium text-indigo-300 hover:text-pink-300">
                Admin
              </Link>
            )}
            <Link to="/dashboard" className="font-medium text-indigo-300 hover:text-pink-300">
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15
                         border border-white/10 text-slate-100 font-semibold"
            >
              Logout
            </button>
          </>
        ) : (
          <Link to="/login" className="font-medium text-indigo-300 hover:text-pink-300">
            Login
          </Link>
        )}
      </div>
    </div>
  );
}
