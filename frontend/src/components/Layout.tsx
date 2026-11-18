import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Trophy,
  LayoutDashboard,
  LogOut,
  User as UserIcon,
  PlusCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-emerald-50 text-emerald-700'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-900">
                Volunteer<span className="text-emerald-600">Hub</span>
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 leading-none">
                Інфраструктура довіри для банок
              </span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
            <NavLink to="/" end className={navLinkClass}>
              Вітрина потреб
            </NavLink>

            <NavLink to="/leaderboard" className={navLinkClass}>
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Лідерборд</span>
            </NavLink>

            {user && (user.role === 'volunteer' || user.role === 'admin') && (
              <NavLink to="/volunteer" className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Мої банки</span>
              </NavLink>
            )}

            {user && (user.role === 'military' || user.role === 'admin') && (
              <NavLink to="/military" className={navLinkClass}>
                <PlusCircle className="w-4 h-4" />
                <span>Кабінет підрозділу</span>
              </NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            {user ? (
              <>
                <Link
                  to="/profile"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <div className="text-left">
                    <div className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.full_name}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-medium">
                      {user.role === 'military'
                        ? user.unit_name || 'Військовий'
                        : user.role === 'admin'
                        ? 'Адмін'
                        : 'Волонтер'}
                    </div>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  title="Вийти"
                  className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition shadow-sm"
              >
                Увійти
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            Volunteer Hub — координаційна платформа дружніх банок. Платформа не
            акумулює кошти: усі донати йдуть напряму на Monobank-банки волонтерів.
          </p>
          <span className="font-medium text-slate-600">Разом до перемоги 🇺🇦</span>
        </div>
      </footer>
    </div>
  );
};
