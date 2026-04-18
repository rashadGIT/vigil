'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FolderOpen,
  Calendar,
  Building2,
  DollarSign,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const navItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard, exact: true },
  { label: 'Cases', href: '/cases', icon: FolderOpen },
  { label: 'Calendar', href: '/calendar', icon: Calendar },
  { label: 'Vendors', href: '/vendors', icon: Building2 },
  { label: 'Price List', href: '/price-list', icon: DollarSign },
  { label: 'Settings', href: '/settings', icon: Settings },
];

function NavLink({ item, onClick }: { item: (typeof navItems)[number]; onClick?: () => void }) {
  const pathname = usePathname();
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-semibold'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground font-normal',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo / brand */}
      <div className="flex items-center gap-2 px-4 py-5 border-b">
        <span className="text-lg font-semibold tracking-tight">Vela</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} onClick={onClose} />
        ))}
      </nav>
    </div>
  );
}

// Mobile hamburger trigger — rendered inside TopBar
export function MobileSidebarTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SidebarContent onClose={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

// Desktop sidebar — always visible on md+
export function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:fixed md:inset-y-0 border-r bg-card">
      <SidebarContent />
    </aside>
  );
}
