import { Button } from "./ui";

interface NavbarProps {
  onNavigate: (route: string) => void;
  showHomeButton?: boolean;
}

export default function Navbar({ onNavigate, showHomeButton }: NavbarProps) {
  return (
    <nav className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
      <div className="flex items-center gap-2">
        <button onClick={() => onNavigate("landing")} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-md">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-slate-900">SatCity Hospital</div>
            <div className="-mt-0.5 text-[11px] uppercase tracking-widest text-slate-500">Management Platform</div>
          </div>
        </button>
      </div>

      <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
        {showHomeButton ? (
          <button onClick={() => onNavigate("landing")} className="hover:text-slate-900">Home</button>
        ) : null}
        <button onClick={() => onNavigate("features")} className="hover:text-slate-900">Features</button>
        <button onClick={() => onNavigate("roles")} className="hover:text-slate-900">Roles</button>
        <button onClick={() => onNavigate("sanity")} className="hover:text-slate-900">Sanity CMS</button>
        <button onClick={() => onNavigate("emergency")} className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:bg-red-700">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-white banner-pulse" /> Emergency
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onNavigate("login-patient")}>Patient sign in</Button>
        <Button variant="outline" size="sm" onClick={() => onNavigate("login-staff")}>Staff sign in</Button>
        <Button size="sm" onClick={() => onNavigate("register-patient")}>Register</Button>
      </div>
    </nav>
  );
}
