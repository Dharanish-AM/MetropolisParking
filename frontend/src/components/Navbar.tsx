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
} from 'lucide-react';
import { MetropolisLogo } from './MetropolisLogo';

export const Navbar: FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

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
      label: 'ANPR Gate Sim',
      path: '/anpr-simulator',
      icon: Camera,
      roles: ['ADMIN', 'OPERATOR'],
    },
    {
      label: 'Reservations',
      path: '/reservations',
      icon: Calendar,
      roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'],
    },
    { label: 'Payments', path: '/payments', icon: CreditCard, roles: ['ADMIN', 'OPERATOR'] },
    { label: 'Vehicles', path: '/vehicles', icon: Car, roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
    { label: 'Profile', path: '/profile', icon: User, roles: ['ADMIN', 'OPERATOR', 'CUSTOMER'] },
  ];

  const filteredNavItems = user ? navItems.filter(item => item.roles.includes(user.role)) : [];

  return (
    <header className="border-b border-neutral-border bg-white sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4 lg:gap-8 min-w-0">
          <Link to="/" className="flex-shrink-0">
            <MetropolisLogo size="md" />
          </Link>

          {user && (
            <nav className="hidden md:flex items-center gap-0.5 lg:gap-1 min-w-0 overflow-x-auto scrollbar-none">
              {filteredNavItems.map(item => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`whitespace-nowrap flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3.5 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 flex-shrink-0 ${
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

        <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
          {user ? (
            <>
              <div className="flex flex-col items-end flex-shrink-0">
                <span className="text-xs lg:text-sm font-bold text-neutral-primary whitespace-nowrap">
                  {user.name}
                </span>
                <span className="text-[9px] lg:text-[10px] text-neutral-secondary uppercase font-bold tracking-wider">
                  {user.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="p-1.5 lg:p-2 border border-neutral-border rounded-xl text-neutral-secondary hover:text-red-600 hover:border-red-100 hover:bg-red-50/50 transition-all duration-150 cursor-pointer flex-shrink-0"
              >
                <LogOut className="w-4.5 h-4.5 lg:w-5 lg:h-5 stroke-[1.5]" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 bg-brand-lavender hover:bg-brand-primary/10 text-brand-primary rounded-xl text-sm font-bold transition-all duration-150"
              >
                Log in / Sign up
              </Link>
              <button className="p-2 border border-neutral-border hover:bg-neutral-border/20 rounded-xl text-neutral-primary cursor-pointer">
                <Menu className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
