'use client';

import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus } from 'lucide-react';
import { getCalendarEvents } from '@/lib/api/calendar';
import { formatDateTime } from '@/lib/utils/format-date';
import { startOfMonth, endOfMonth, format } from 'date-fns';

export default function CalendarPage() {
  const now = new Date();
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', format(now, 'yyyy-MM')],
    queryFn: () => getCalendarEvents(
      startOfMonth(now).toISOString(),
      endOfMonth(now).toISOString(),
    ),
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        description={`${format(now, 'MMMM yyyy')}`}
        action={
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Button>
        }
      />

      {isLoading && <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>}

      {!isLoading && events.length === 0 && (
        <p className="text-sm text-muted-foreground">No events scheduled this month.</p>
      )}

      <div className="space-y-2">
        {events.map((event) => (
          <Card key={event.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="py-3 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{event.title}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(event.startTime)}</p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0">{event.eventType}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
