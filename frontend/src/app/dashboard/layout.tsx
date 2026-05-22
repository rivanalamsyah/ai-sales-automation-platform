"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bot, 
  LayoutDashboard, 
  MessageSquareCode, 
  KanbanSquare, 
  Compass, 
  Sparkles, 
  CreditCard, 
  ShieldAlert, 
  LogOut, 
  Menu, 
  X, 
  Bell, 
  ChevronDown, 
  Moon, 
  Sun,
  Radio,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { apiRequest } from '@/lib/api';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [whatsAppStatus, setWhatsAppStatus] = useState<string>('DISCONNECTED');
  const [notifications, setNotifications] = useState<any[]>([
    { id: 1, title: 'Handoff alert', message: 'Chat with Natasha Romanoff requested human help', time: '3m ago' }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [theme, setTheme] = useState('dark');

  // Verify auth on mount
  useEffect(() => {
    const token = localStorage.getItem('whatsaas_token');
    const storedUser = localStorage.getItem('whatsaas_user');

    if (!token || !storedUser) {
      router.push('/auth/login');
      return;
    }

    setUser(JSON.parse(storedUser));
    
    // Fetch WhatsApp Connection status
    apiRequest('/whatsapp/status').then(res => {
      setWhatsAppStatus(res.status);
    }).catch(() => {});
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('whatsaas_token');
    localStorage.removeItem('whatsaas_user');
    router.push('/auth/login');
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      html.classList.add('light');
      setTheme('light');
    } else {
      html.classList.remove('light');
      html.classList.add('dark');
      setTheme('dark');
    }
  };

  const navItems = [
    { name: 'Analytics Hub', path: '/dashboard', icon: LayoutDashboard },
    { name: 'AI Live Chat', path: '/dashboard/chat', icon: MessageSquareCode },
    { name: 'CRM Kanban Board', path: '/dashboard/crm', icon: KanbanSquare },
    { name: 'Visual Workflows', path: '/dashboard/workflows', icon: Compass },
    { name: 'AI Copywriter', path: '/dashboard/ai-templates', icon: Sparkles },
    { name: 'Plans & Quotas', path: '/dashboard/billing', icon: CreditCard },
  ];

  if (user?.role === 'SUPERADMIN') {
    navItems.push({ name: 'System Monitoring', path: '/dashboard/admin', icon: ShieldAlert });
  }

  if (!user) return null; // Prevent flashes of loading contents

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Sidebar Navigation */}
      <aside className={`fixed inset-y-0 left-0 z-40 bg-neutral-950 border-r border-border flex flex-col justify-between transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0 md:w-20'
      }`}>
        {/* Top brand header */}
        <div>
          <div className="h-16 border-b border-border flex items-center justify-between px-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center glow-primary">
                <Bot className="w-5 h-5 text-white" />
              </div>
              {sidebarOpen && <span className="font-extrabold text-lg text-white">Veloce<span className="text-primary">AI</span></span>}
            </Link>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-neutral-400 hover:text-white md:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Links list */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3.5 h-10 px-3.5 rounded-lg text-sm font-medium transition-all ${
                    isActive 
                      ? 'bg-primary text-white shadow-lg shadow-primary/10 font-bold' 
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border space-y-2">
          {/* User profile row */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white uppercase text-xs">
                {user.name.charAt(0)}
              </div>
              {sidebarOpen && (
                <div className="text-left overflow-hidden">
                  <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                  <div className="text-[10px] text-neutral-500 capitalize">{user.role.toLowerCase()}</div>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <button onClick={handleLogout} className="text-neutral-400 hover:text-red-400 p-1.5 rounded-md hover:bg-neutral-900 transition-colors">
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Panel Content Box */}
      <div className={`flex-1 flex flex-col transition-all duration-300 min-h-screen overflow-x-hidden ${
        sidebarOpen ? 'md:pl-64' : 'md:pl-20'
      }`}>
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-neutral-950/40 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-neutral-400 hover:text-white">
              <Menu className="w-5 h-5" />
            </button>
            {/* Org Switcher mock */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-neutral-900 text-xs font-medium text-neutral-300">
              <div className="w-2.5 h-2.5 rounded bg-violet-600" />
              Acme Corporation (Workspace)
              <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* WhatsApp Connection status indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-neutral-900">
              <span className={`w-2 h-2 rounded-full ${whatsAppStatus === 'CONNECTED' ? 'bg-whatsapp animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider hidden xs:inline">WhatsApp Bot:</span>
              <span className="text-[11px] font-bold text-neutral-200 capitalize">{whatsAppStatus.toLowerCase()}</span>
            </div>

            {/* Theme switcher */}
            <button onClick={toggleTheme} className="p-2 rounded-lg border border-border hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all">
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg border border-border hover:bg-neutral-900 text-neutral-400 hover:text-white transition-all relative"
              >
                <Bell className="w-4 h-4" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full ring-2 ring-neutral-950" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-neutral-950 border border-border rounded-xl shadow-2xl p-4 z-50 text-left">
                  <div className="flex items-center justify-between border-b border-border pb-2.5 mb-2.5">
                    <span className="font-bold text-sm text-white">System Alerts</span>
                    <button onClick={() => setNotifications([])} className="text-xs text-primary hover:underline">Clear all</button>
                  </div>
                  {notifications.length === 0 ? (
                    <div className="text-xs text-neutral-500 py-6 text-center">No unread notifications</div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((n) => (
                        <div key={n.id} className="p-2.5 rounded-lg bg-neutral-900 border border-border/60">
                          <div className="font-bold text-xs text-white">{n.title}</div>
                          <div className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">{n.message}</div>
                          <div className="text-[10px] text-neutral-600 mt-1">{n.time}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-6 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
