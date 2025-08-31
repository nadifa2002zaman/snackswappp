export default function requireRole(role) {
  return (req, res, next) => {
    const r = req.user?.role;
    if (!r || (r !== role && r !== "superadmin"))
      return res.status(403).json({ error: "Admins only" });
    next();
  };
}
