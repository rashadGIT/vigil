'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const tabs = [
  { label: 'Overview', href: '' },
  { label: 'Tasks', href: '/tasks' },
  { label: 'Obituary', href: '/obituary' },
  { label: 'Documents', href: '/documents' },
  { label: 'Payments', href: '/payments' },
  { label: 'Follow-ups', href: '/follow-ups' },
  { label: 'Vendors', href: '/vendors' },
  { label: 'Signatures', href: '/signatures' },
];

export function CaseWorkspaceTabs({ caseId }: { caseId: string }) {
  const pathname = usePathname();
  const base = `/cases/${caseId}`;

  return (
    <div className="overflow-x-auto border-b mb-6">
      <nav className="flex min-w-max -mb-px">
        {tabs.map((tab) => {
          const href = `${base}${tab.href}`;
          const isActive = tab.href === '' ? pathname === base : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              href={href}
              className={cn(
                'px-4 py-3 text-sm whitespace-nowrap border-b-2 transition-colors',
                isActive
                  ? 'border-primary text-primary font-medium'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground',
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
