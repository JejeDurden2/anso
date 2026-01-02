import { Avatar, Dropdown, DropdownItem } from '@anso/ui';
import { Users, Kanban, Settings, LogOut } from 'lucide-react';
import { Outlet, NavLink } from 'react-router-dom';


import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Contacts', href: '/app/contacts', icon: Users },
  { name: 'Pipeline', href: '/app/deals', icon: Kanban },
  { name: 'Paramètres', href: '/app/settings', icon: Settings },
];

export function AppLayout(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500">
            <svg className="h-5 w-5 text-white" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 22L16 10L24 22H8Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="text-lg font-semibold text-slate-900">Anso</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User menu */}
        <div className="border-t border-slate-200 p-4">
          <Dropdown
            trigger={
              <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-100">
                <Avatar src={user?.avatarUrl} name={user?.name || user?.email} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user?.name || 'Utilisateur'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              </button>
            }
            align="left"
          >
            <DropdownItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownItem>
          </Dropdown>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
