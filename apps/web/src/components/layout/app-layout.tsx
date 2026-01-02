import { Avatar, Button, Dropdown, DropdownItem } from '@anso/ui';
import { Users, Kanban, Settings, LogOut, Menu, X, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useState } from 'react';
import { Outlet, NavLink, Link } from 'react-router-dom';

import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Contacts', href: '/app/contacts', icon: Users },
  { name: 'Pipeline', href: '/app/deals', icon: Kanban },
  { name: 'Paramètres', href: '/app/settings', icon: Settings },
];

export function AppLayout(): JSX.Element {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const closeSidebar = (): void => setSidebarOpen(false);

  const SidebarContent = (
    <>
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-4">
        <Link
          to="/app"
          className="flex items-center gap-2 rounded-lg transition-colors hover:opacity-80"
          onClick={closeSidebar}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-md shadow-brand-500/20">
            <svg className="h-5 w-5 text-white" viewBox="0 0 32 32" fill="none">
              <path
                d="M8 22L16 10L24 22H8Z"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Anso</span>
          )}
        </Link>
        {/* Mobile close button */}
        <button
          onClick={closeSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
        {/* Desktop collapse button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:block"
          title={sidebarCollapsed ? 'Agrandir' : 'Réduire'}
        >
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 space-y-1', sidebarCollapsed ? 'p-2' : 'p-4')}>
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            onClick={closeSidebar}
            title={sidebarCollapsed ? item.name : undefined}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium transition-all duration-200',
                sidebarCollapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5',
                isActive
                  ? 'bg-gradient-to-r from-brand-50 to-brand-100/50 text-brand-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1'
              )
            }
          >
            <item.icon className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && item.name}
          </NavLink>
        ))}
      </nav>

      {/* User menu */}
      <div className={cn('border-t border-slate-200/80', sidebarCollapsed ? 'p-2' : 'p-4')}>
        <Dropdown
          trigger={
            <button
              className={cn(
                'flex items-center rounded-xl transition-all duration-200 hover:bg-slate-100',
                sidebarCollapsed ? 'w-full justify-center p-2' : 'w-full gap-3 p-2 text-left'
              )}
              title={sidebarCollapsed ? user?.name || user?.email : undefined}
            >
              <Avatar src={user?.avatarUrl} name={user?.name || user?.email} size="sm" />
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {user?.name || 'Utilisateur'}
                  </p>
                  <p className="truncate text-xs text-slate-500">{user?.email}</p>
                </div>
              )}
            </button>
          }
          align="left"
          position="top"
        >
          <DropdownItem onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" />
            Déconnexion
          </DropdownItem>
        </Dropdown>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden flex-col border-r border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all duration-300 lg:flex',
          sidebarCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {SidebarContent}
      </aside>

      {/* Sidebar - Mobile */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200/80 bg-white shadow-xl transition-transform duration-300 lg:hidden',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {SidebarContent}
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-16 items-center gap-4 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600">
              <svg className="h-4 w-4 text-white" viewBox="0 0 32 32" fill="none">
                <path
                  d="M8 22L16 10L24 22H8Z"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-lg font-bold text-slate-900">Anso</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
