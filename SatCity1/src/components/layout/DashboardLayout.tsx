import { ReactNode, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { cn } from "../../utils/cn";
import { useHospital, Role } from "../../lib/store";
import { Avatar, Badge, Button, Dropdown } from "../ui/primitives";
import {
  LayoutDashboard, Users, Stethoscope, FlaskConical, Pill, User,
  Ambulance, LogOut, Bell, ChevronLeft, Building2, FileText, Settings,
  Activity, CalendarClock, AlertTriangle,
} from "lucide-react";

type NavItem = { label: string; path: string; icon: ReactNode; badge?: number };

const roleAccent: Record<Role, { bg: string; text: string; border: string; label: string }> = {
  super_admin: { bg: "bg-neutral-900", text: "text-neutral-900", border: "border-neutral-900", label: "Platform-wide" },
  admin: { bg: "bg-blue-600", text: "text-blue-700", border: "border-blue-600", label: "Dept-scoped" },
  doctor: { bg: "bg-emerald-600", text: "text-emerald-700", border: "border-emerald-600", label: "Clinical" },
  lab_tech: { bg: "bg-purple-600", text: "text-purple-700", border: "border-purple-600", label: "Laboratory" },
  pharmacist: { bg: "bg-amber-600", text: "text-amber-700", border: "border-amber-600", label: "Pharmacy" },
  patient: { bg: "bg-teal-600", text: "text-teal-700", border: "border-teal-600", label: "Patient Portal" },
};

export function getNavForRole(role: Role, notifsCount: number, emergencyCount: number): NavItem[] {
  switch (role) {
    case "super_admin":
      return [
        { label: "Overview", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "All Departments", path: "/dashboard/departments", icon: <Building2 size={16} /> },
        { label: "All Users", path: "/dashboard/users", icon: <Users size={16} /> },
        { label: "All Doctors", path: "/dashboard/doctors", icon: <Stethoscope size={16} /> },
        { label: "All Patients", path: "/dashboard/patients", icon: <User size={16} /> },
        { label: "Lab Results", path: "/dashboard/lab-results", icon: <FlaskConical size={16} /> },
        { label: "Ambulance & Emergency", path: "/dashboard/ambulance", icon: <Ambulance size={16} />, badge: emergencyCount },
        { label: "Drug Inventory", path: "/dashboard/drugs", icon: <Pill size={16} /> },
        { label: "Sanity CMS Studio", path: "/dashboard/cms", icon: <FileText size={16} /> },
        { label: "Audit Log", path: "/dashboard/audit", icon: <FileText size={16} /> },
        { label: "Settings", path: "/dashboard/settings", icon: <Settings size={16} /> },
      ];
    case "admin":
      return [
        { label: "Department Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Staff", path: "/dashboard/users", icon: <Users size={16} /> },
        { label: "Patients", path: "/dashboard/patients", icon: <User size={16} /> },
        { label: "Doctors", path: "/dashboard/doctors", icon: <Stethoscope size={16} /> },
        { label: "Lab Results", path: "/dashboard/lab-results", icon: <FlaskConical size={16} /> },
        { label: "Ambulance & Emergency", path: "/dashboard/ambulance", icon: <Ambulance size={16} />, badge: emergencyCount },
        { label: "Drug Inventory", path: "/dashboard/drugs", icon: <Pill size={16} /> },
      ];
    case "doctor":
      return [
        { label: "My Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Active Patients", path: "/dashboard/patients", icon: <User size={16} /> },
        { label: "Lab Results", path: "/dashboard/lab-results", icon: <FlaskConical size={16} /> },
        { label: "Treatments", path: "/dashboard/treatments", icon: <Activity size={16} /> },
        { label: "Notifications", path: "/dashboard/notifications", icon: <Bell size={16} />, badge: notifsCount },
        { label: "Drug Reference", path: "/dashboard/drugs", icon: <Pill size={16} /> },
        { label: "Profile", path: "/dashboard/profile", icon: <Stethoscope size={16} /> },
      ];
    case "lab_tech":
      return [
        { label: "Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "Upload Result", path: "/dashboard/upload", icon: <FileText size={16} /> },
        { label: "My Uploads", path: "/dashboard/uploads", icon: <FlaskConical size={16} /> },
      ];
    case "pharmacist":
      return [
        { label: "Inventory Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "All Drugs", path: "/dashboard/drugs", icon: <Pill size={16} /> },
        { label: "Sanity CMS Studio", path: "/dashboard/cms", icon: <FileText size={16} /> },
        { label: "Low Stock Alerts", path: "/dashboard/low-stock", icon: <AlertTriangle size={16} /> },
      ];
    case "patient":
      return [
        { label: "My Dashboard", path: "/dashboard", icon: <LayoutDashboard size={16} /> },
        { label: "My Profile", path: "/dashboard/profile", icon: <User size={16} /> },
        { label: "Lab Results", path: "/dashboard/lab-results", icon: <FlaskConical size={16} /> },
        { label: "Treatments", path: "/dashboard/treatments", icon: <Activity size={16} /> },
        { label: "My Doctor", path: "/dashboard/doctor", icon: <Stethoscope size={16} /> },
        { label: "Book Ambulance", path: "/dashboard/ambulance", icon: <CalendarClock size={16} /> },
      ];
    default:
      return [];
  }
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { currentUser, currentUserDoctor, notifications, ambulanceBookings, logout } = useHospital();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const role = currentUser.role;
  const accent = roleAccent[role];
  const myNotifs = notifications.filter((n) => n.recipient_id === currentUser.id && !n.is_read);
  const emergencyCount = ambulanceBookings.filter((b) => b.type === "emergency" && !b.is_resolved).length;
  const nav = getNavForRole(role, myNotifs.length, emergencyCount);
  const deptName = currentUser.department_id
    ? ["Cardiology", "Neurology", "Pediatrics", "Orthopedics"][["d-cardio", "d-neuro", "d-peds", "d-ortho"].indexOf(currentUser.department_id)] ?? null
    : null;

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <aside className={cn("bg-white border-r border-neutral-200 flex flex-col transition-all", collapsed ? "w-16" : "w-64")}>
        <div className="h-16 px-4 flex items-center justify-between border-b border-neutral-200">
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 leading-none">SatCity Hospital</div>
                <div className="text-[10px] text-neutral-500 mt-0.5">Management Platform</div>
              </div>
            </Link>
          )}
          {collapsed && (
            <div className="h-8 w-8 rounded-lg bg-neutral-900 flex items-center justify-center mx-auto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M12 2v20M2 12h20"/></svg>
            </div>
          )}
          <button onClick={() => setCollapsed((c) => !c)} className={cn("text-neutral-400 hover:text-neutral-700 cursor-pointer", collapsed && "hidden")}>
            <ChevronLeft size={16} />
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-neutral-200">
            <Badge variant="outline" className={cn("border", accent.border, accent.text)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", accent.bg)} />
              {accent.label}
            </Badge>
            {deptName && <div className="text-xs text-neutral-500 mt-2">{deptName}</div>}
            {currentUserDoctor && (
              <div className="text-xs text-neutral-500 mt-1">
                Status: <span className="font-medium text-neutral-700 capitalize">{currentUserDoctor.availability_status.replace("_", " ")}</span>
              </div>
            )}
          </div>
        )}

        <nav className="flex-1 overflow-y-auto p-2">
          {nav.map((item) => {
            const active = location.pathname === item.path || (item.path !== "/dashboard" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  active ? "bg-neutral-900 text-white" : "text-neutral-700 hover:bg-neutral-100",
                  collapsed && "justify-center"
                )}
                title={collapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="flex-1">{item.label}</span>}
                {!collapsed && typeof item.badge === "number" && item.badge > 0 && (
                  <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full font-semibold", active ? "bg-white/20 text-white" : "bg-red-500 text-white")}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {!collapsed && (
          <div className="p-3 border-t border-neutral-200">
            <div className="flex items-center gap-2">
              <Avatar name={currentUser.full_name} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-neutral-900 truncate">{currentUser.full_name}</div>
                <div className="text-[10px] text-neutral-500 truncate">{currentUser.email}</div>
              </div>
              <button onClick={() => { logout(); navigate("/"); }} className="text-neutral-400 hover:text-red-600 cursor-pointer" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-neutral-200 px-6 flex items-center justify-between shrink-0">
          <div className="text-sm text-neutral-500">
            <span className="text-neutral-400">Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-neutral-900 font-medium">{nav.find((n) => n.path === location.pathname)?.label ?? "Page"}</span>
          </div>
          <div className="flex items-center gap-3">
            <Dropdown
              trigger={
                <button className="relative h-9 w-9 rounded-md border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 cursor-pointer">
                  <Bell size={16} className="text-neutral-700" />
                  {myNotifs.length > 0 && <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{myNotifs.length}</span>}
                </button>
              }
              items={myNotifs.length === 0
                ? [{ label: "No new notifications", onClick: () => {} }]
                : myNotifs.slice(0, 5).map((n) => ({
                    label: n.message.slice(0, 45) + (n.message.length > 45 ? "..." : ""),
                    onClick: () => navigate("/dashboard/notifications"),
                  }))
              }
            />
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>Public site</Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
