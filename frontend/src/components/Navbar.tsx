import { useState } from 'react';
import type { FC } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Link, useLocation } from 'react-router-dom';
import {
  LogOut,
  LayoutDashboard,
  ParkingSquare,
  Menu,
  Car,
  Clock,
  CreditCard,
  User,
  Calendar,
  Camera,
  QrCode,
  X,
} from 'lucide-react';
import { MetropolisLogo } from './MetropolisLogo';

export const Navbar: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    {
      label: 'Dashboard',
      path: '/',
      icon: LayoutDashboard,
      roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'],
    },
    {
      label: 'Parking Lots',
      path: '/parking-lots',
      icon: ParkingSquare,
      roles: ['ADMIN', 'OPERATOR'],
    },
    { label: 'Sessions', path: '/sessions', icon: Clock, roles: ['ADMIN', 'OPERATOR'] },
    {
      label: 'ANPR Sim',
      path: '/anpr-simulator',
      icon: Camera,
      roles: ['ADMIN', 'OPERATOR'],
    },
    {
      label: 'QR Gate Pass',
      path: '/qr-scanner',
      icon: QrCode,
      roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'],
    },
    {
      label: 'Reservations',
      path: '/reservations',
      icon: Calendar,
      roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'],
    },
    { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['ADMIN', 'OPERATOR'] },
    { label: 'Vehicles', path: '/vehicles', icon: Car, roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
  ];

  const filteredNavItems = user ? navItems.filter(item => item.roles.includes(user.role)) : [];

  return (
    <header className="border-b border-neutral-border bg-white sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 lg:gap-6 min-w-0 flex-1">
          <Link to="/" className="flex-shrink-0">
            <MetropolisLogo size="md" />
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-none">
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`whitespace-nowrap flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 flex-shrink-0 ${
                      isActive
                        ? 'bg-brand-primary/10 text-brand-primary font-bold'
                        : 'text-neutral-secondary hover:text-brand-primary hover:bg-brand-primary/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4 stroke-[1.75]" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
          {user ? (
            <>
              <Link
                to="/profile"
                className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border transition-all duration-150 ${
                  location.pathname === '/profile'
                    ? 'border-brand-primary/40 bg-brand-primary/5'
                    : 'border-neutral-border hover:border-brand-primary/30 hover:bg-neutral-border/10'
                }`}
                title="View Profile"
              >
                <div className="w-7 h-7 rounded-lg bg-brand-primary/10 text-brand-primary flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-xs font-bold text-neutral-primary max-w-[100px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[9px] text-neutral-secondary uppercase font-bold tracking-wider">
                    {user.role}
                  </span>
                </div>
              </Link>

              <button
                onClick={logout}
                className="p-1.5 lg:p-2 border border-neutral-border rounded-xl text-neutral-secondary hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 transition-all duration-150 cursor-pointer"
                title="Log Out"
              >
                <LogOut className="w-4 h-4 lg:w-4.5 lg:h-4.5 stroke-[1.75]" />
              </button>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-1.5 border border-neutral-border rounded-xl text-neutral-primary"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-brand-lavender hover:bg-brand-primary/10 text-brand-primary rounded-xl text-sm font-bold transition-all duration-150"
            >
              Log in / Sign up
            </Link>
          )}
        </div>
      </div>

      {user && mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-border bg-white px-4 py-3 space-y-1 animate-fade-in">
          {filteredNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-primary/10 text-brand-primary font-bold'
                    : 'text-neutral-secondary hover:bg-neutral-border/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <Link
            to="/profile"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all ${
              location.pathname === '/profile'
                ? 'bg-brand-primary/10 text-brand-primary font-bold'
                : 'text-neutral-secondary hover:bg-neutral-border/20'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </Link>
        </div>
      )}
    </header>
  );
};

