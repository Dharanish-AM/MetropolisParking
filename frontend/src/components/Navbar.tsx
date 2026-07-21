import type { FC } from "react";
import { useAuth } from "../features/auth/hooks/useAuth";
import { Link, useLocation } from "react-router-dom";
import { LogOut, LayoutDashboard, ParkingSquare } from "lucide-react";

export const Navbar: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Parking Lots", path: "/parking-lots", icon: ParkingSquare },
  ];

  return (
    <header className="border-b border-neutral-border bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <span className="font-bold tracking-tight text-neutral-primary text-base">
              Metropolis Control
            </span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                    isActive
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-neutral-secondary hover:text-neutral-primary hover:bg-neutral-border/30"
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[1.75]" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-neutral-primary">{user?.name}</span>
            <span className="text-xs text-neutral-secondary uppercase font-bold tracking-wider">{user?.role}</span>
          </div>
          <button
            onClick={logout}
            className="p-2 border border-neutral-border rounded-xl text-neutral-secondary hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 transition-all duration-150 cursor-pointer"
          >
            <LogOut className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
};
