'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent } from '@/lib/api/calendar';
import { formatDateTime } from '@/lib/utils/format-date';
import { startOfMonth, endOfMonth, format, addMonths, subMonths } from 'date-fns';
import { EventType } from '@vigil/shared-types';

function NewEventDialog({ onCreated }: { onCreated: (startTime: string) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>(EventType.other);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => createCalendarEvent({
      title,
      eventType,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      notes: notes || undefined,
    }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      toast.success('Event created.');
      onCreated(created.startTime as string);
      setOpen(false);
      setTitle(''); setStartTime(''); setEndTime(''); setNotes('');
      setEventType(EventType.other);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Failed to create event.'));
    },
  });

  const endBeforeStart = startTime && endTime && new Date(endTime) <= new Date(startTime);
  const canSubmit = title.trim() && startTime && endTime && !endBeforeStart;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New Event</DialogTitle></DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <Label className="font-medium">Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" />
          </div>
          <div className="space-y-1">
            <Label className="font-medium">Type</Label>
            <Select value={eventType} onValueChange={(v) => setEventType(v as EventType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.values(EventType).map((t) => (
                  <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-medium">Start</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">End</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              {endBeforeStart && <p className="text-xs text-destructive">End must be after start.</p>}
              {endTime === '' && startTime !== '' && !endBeforeStart && (
                <p className="text-xs text-destructive">Enter a valid date.</p>
              )}
            </div>
          </div>
          <div className="space-y-1">
            <Label className="font-medium">Notes <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." />
          </div>
          <Button
            className="w-full"
            disabled={!canSubmit || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? 'Saving…' : 'Create Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', format(currentMonth, 'yyyy-MM')],
    queryFn: () => getCalendarEvents(
      startOfMonth(currentMonth).toISOString(),
      endOfMonth(currentMonth).toISOString(),
    ),
  });

  function handleCreated(startTime: string) {
    setCurrentMonth(new Date(startTime));
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        description={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{format(currentMonth, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        }
        action={<NewEventDialog onCreated={handleCreated} />}
      />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

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
