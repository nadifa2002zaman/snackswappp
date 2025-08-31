export default function AuthCard({ title = "Welcome", subtitle, children, footer }) {
  return (
    // Full-viewport overlay so parent layouts can't push it left
    <div className="fixed inset-0 z-50 overflow-y-auto
                    bg-gradient-to-br from-indigo-50 via-fuchsia-50 to-orange-50
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md
                      rounded-2xl shadow-2xl ring-1 ring-black/5">
        <div className="p-6 sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-orange-500
                               bg-clip-text text-transparent">
                {title}
              </span>
            </h1>
            {subtitle && <p className="text-slate-600 mt-1">{subtitle}</p>}
          </div>

          <div className="space-y-4">{children}</div>

          {footer && (
            <div className="mt-6 text-center text-sm text-slate-600">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
