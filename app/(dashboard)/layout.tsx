'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Suspense } from 'react';
import { signOut } from '@/app/(login)/actions';
import { useRouter, usePathname } from 'next/navigation';
import { User } from '@/lib/db/schema';
import useSWR, { mutate } from 'swr';
import Image from 'next/image';
import {
  Bell, LogOut, Settings, Home, Monitor, LineChart, Crown, X, Trash2, Menu, User as UserIcon, MessageSquare, CupSoda
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications } from '@/lib/hooks/useNotifications';
import { GlobalAlerts } from '@/components/admin/global-alerts';
import { SystemAlertManager } from '@/components/admin/system-alert-manager';
import { useServiceWorker } from '@/lib/hooks/useServiceWorker';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function NotificationBell() {
  const { notifications, markAllRead, clearAll, unreadCount } = useNotifications();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="p-2"><Bell className="w-5 h-5 text-gray-800" /></div>;

  const handleOpen = () => {
    setOpen(o => !o);
    if (!open) markAllRead();
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[#ff00ea] rounded-full text-[9px] text-white flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-50 w-80 bg-[#0a0a1a] border border-gray-700 rounded-xl shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h3 className="font-orbitron text-white text-sm font-bold">NOTIFICATIONS</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <button onClick={clearAll} title="Clear all" className="text-gray-500 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 font-mono text-xs">
                  No notifications yet.
                </div>
              ) : notifications.map(n => (
                <div key={n.id} className={`p-4 border-b border-gray-800/50 hover:bg-[#0f1026] transition-colors ${!n.read ? 'bg-[#0f1026]/80' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      n.type === 'warning' ? 'bg-[#ffea00]' :
                      n.type === 'error' ? 'bg-[#ff00ea]' :
                      n.type === 'success' ? 'bg-[#00ff55]' : 'bg-[#00f3ff]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-mono text-xs font-bold">{n.title}</p>
                      <p className="text-gray-400 font-mono text-xs mt-0.5">{n.message}</p>
                      <p className="text-gray-600 font-mono text-[10px] mt-1">
                        {new Date(n.timestamp).toLocaleTimeString()}
                      </p>
                      {n.waLink && (
                        <a 
                          href={n.waLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-[#25D366]/10 text-[#25D366] rounded border border-[#25D366]/30 text-[10px] font-bold hover:bg-[#25D366]/20 transition-colors"
                        >
                          <MessageSquare className="w-3 h-3" /> SEND WHATSAPP
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  async function handleSignOut() {
    await signOut();
    mutate('/api/user');
    router.push('/');
  }

  if (!mounted) return <div className="size-8 md:size-9" />;
  if (!user) {
    return (
      <Link href="/sign-in" className="text-sm font-medium text-[#00f3ff] hover:text-white transition-colors">
        Staff Login
      </Link>
    );
  }

  const initials = (user.name || user.email || 'U')
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-8 md:size-9 border-2 border-[#00f3ff]/50 hover:border-[#00f3ff] transition-colors">
          <AvatarFallback className="bg-[#0f1026] text-[#00f3ff] font-bold text-xs md:text-sm">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 bg-[#0a0a1a] border-gray-700 text-gray-200">
        <div className="px-3 py-2 border-b border-gray-800">
          <p className="text-xs font-bold text-white truncate">{user.name || 'Admin'}</p>
          <p className="text-xs text-gray-400 font-mono truncate">{user.email}</p>
        </div>
        <DropdownMenuItem className="cursor-pointer hover:bg-[#0f1026] focus:bg-[#0f1026]">
          <Link href="/account" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4 text-[#00f3ff]" />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-800" />
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer text-red-400 hover:bg-[#0f1026] focus:bg-[#0f1026]">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BottomNav() {
  const pathname = usePathname();
  const items = [
    { href: '/dashboard', label: 'Home', icon: Home, color: '#00f3ff' },
    { href: '/stations', label: 'Stations', icon: Monitor, color: '#00ff55' },
    { href: '/reports', label: 'Reports', icon: LineChart, color: '#ff00ea' },
    { href: '/memberships', label: 'VIP', icon: Crown, color: '#ffea00' },
  ];

  return (
    <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-sm">
      <div className="bg-[#0a0a1a]/80 backdrop-blur-xl border border-white/10 rounded-2xl h-16 flex items-center justify-around px-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        {items.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="relative flex flex-col items-center justify-center p-2 group">
              <Icon 
                className={`w-6 h-6 transition-all duration-300 ${isActive ? '' : 'text-gray-500 group-active:scale-90'}`}
                style={{ color: isActive ? item.color : undefined, filter: isActive ? `drop-shadow(0 0 5px ${item.color})` : 'none' }}
              />
              <span className={`text-[9px] font-pixel mt-1 transition-colors duration-300 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                {item.label}
              </span>
              {isActive && (
                <div 
                  className="absolute -top-1 w-8 h-1 rounded-full animate-pulse"
                  style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}` }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function Header() {
  const pathname = usePathname();
  return (
    <header className="border-b border-gray-800 bg-[#0a0a1a]/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/dashboard" className="flex items-center">
            <Image src="/logo.png" alt="Terminal 8" width={110} height={32} className="object-contain md:w-[130px] md:h-[38px]" />
          </Link>
          <nav className="hidden md:flex space-x-1 ml-8">
            {[
              { href: '/dashboard', label: 'Dashboard' },
              { href: '/stations', label: 'Stations' },
              { href: '/reports', label: 'Reports' },
              { href: '/memberships', label: 'Memberships', highlight: true },
              { href: '/addons', label: 'Addons' },
              { href: '/leaderboard', label: 'Leaderboard' },
              { href: '/gamers', label: 'Gamers' },
            ].map(item => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 border ${
                    isActive
                      ? item.highlight
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  style={
                    isActive
                      ? item.highlight
                        ? {
                            color: '#ffea00',
                            backgroundColor: 'rgba(255, 234, 0, 0.15)',
                            borderColor: 'rgba(255, 234, 0, 0.4)',
                            boxShadow: '0 0 15px rgba(255, 234, 0, 0.2)',
                            fontWeight: 'bold',
                          }
                        : {
                            color: '#00f3ff',
                            backgroundColor: 'rgba(0, 243, 255, 0.15)',
                            borderColor: 'rgba(0, 243, 255, 0.4)',
                            boxShadow: '0 0 15px rgba(0, 243, 255, 0.2)',
                            fontWeight: 'bold',
                          }
                      : {}
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center space-x-1 md:space-x-2">
          {/* Mobile hamburger navigation */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger className="p-2 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-[#00f3ff] focus:outline-none flex items-center justify-center">
                <Menu className="w-5 h-5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0a0a1a] border border-gray-800 text-gray-200 shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
                <div className="px-3 py-1.5 border-b border-gray-800">
                  <p className="text-[9px] text-[#00f3ff] font-pixel tracking-wider">NAVIGATE</p>
                </div>
                {[
                  { href: '/dashboard', label: 'Dashboard' },
                  { href: '/stations', label: 'Stations' },
                  { href: '/reports', label: 'Reports' },
                  { href: '/memberships', label: 'Memberships' },
                  { href: '/addons', label: 'Addons' },
                  { href: '/leaderboard', label: 'Leaderboard' },
                  { href: '/gamers', label: 'Gamers' },
                ].map(item => {
                  const isActive = pathname === item.href;
                  return (
                    <DropdownMenuItem key={item.href} asChild className="cursor-pointer hover:bg-[#0f1026] focus:bg-[#0f1026]">
                      <Link 
                        href={item.href} 
                        className={`flex w-full py-1 text-xs font-mono transition-colors duration-150 ${
                          isActive ? 'text-[#00f3ff] font-bold' : 'text-gray-300 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <NotificationBell />
          <Suspense fallback={<div className="h-8 w-8 md:h-9 md:w-9 rounded-full bg-gray-800 animate-pulse" />}>
            <UserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  useServiceWorker();
  return (
    <section className="flex flex-col min-h-screen bg-[#06070f] relative pb-24 md:pb-0">
      <GlobalAlerts />
      <SystemAlertManager />
      <Header />
      <main className="flex-1 overflow-x-hidden">
        {children}
      </main>
      <BottomNav />
    </section>
  );
}
