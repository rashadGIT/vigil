import { Separator } from '@/components/ui/separator';

import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {description && (
            <div className="text-sm text-muted-foreground mt-1">{description}</div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      <Separator className="mt-4" />
    </div>
  );
}
