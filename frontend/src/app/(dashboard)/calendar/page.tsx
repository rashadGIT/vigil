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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, ChevronLeft, ChevronRight, LayoutGrid, LayoutList } from 'lucide-react';
import { getCalendarEvents, createCalendarEvent } from '@/lib/api/calendar';
import type { ICalendarEvent } from '@vigil/shared-types';
import { formatDateTime } from '@/lib/utils/format-date';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday,
  format, addMonths, subMonths,
} from 'date-fns';
import { EventType } from '@vigil/shared-types';
import { cn } from '@/lib/utils/cn';

const EVENT_TYPE_COLORS: Record<EventType, string> = {
  [EventType.visitation]:  'bg-blue-500',
  [EventType.service]:     'bg-purple-500',
  [EventType.committal]:   'bg-slate-500',
  [EventType.pickup]:      'bg-orange-500',
  [EventType.preparation]: 'bg-yellow-500',
  [EventType.meeting]:     'bg-green-500',
  [EventType.other]:       'bg-gray-400',
};

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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="font-medium">Start</Label>
              <Input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="font-medium">End</Label>
              <Input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              {endBeforeStart && <p className="text-xs text-destructive">End must be after start.</p>}
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

function EventPill({ event }: { event: ICalendarEvent }) {
  const dot = EVENT_TYPE_COLORS[event.eventType as EventType] ?? 'bg-gray-400';
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 rounded px-1 py-0.5 text-xs bg-muted hover:bg-muted/80 cursor-default min-w-0">
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', dot)} />
            <span className="truncate">{event.title}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[200px]">
          <p className="font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(event.startTime), 'h:mm a')} – {format(new Date(event.endTime), 'h:mm a')}
          </p>
          <p className="text-xs capitalize text-muted-foreground">{event.eventType}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function MonthGrid({ currentMonth, events }: { currentMonth: Date; events: ICalendarEvent[] }) {
  const gridStart = startOfWeek(startOfMonth(currentMonth));
  const gridEnd   = endOfWeek(endOfMonth(currentMonth));
  const days      = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const eventsByDay = new Map<string, ICalendarEvent[]>();
  events.forEach((e) => {
    const key = format(new Date(e.startTime), 'yyyy-MM-dd');
    if (!eventsByDay.has(key)) eventsByDay.set(key, []);
    eventsByDay.get(key)!.push(e);
  });

  const DAY_HEADERS_LONG  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const DAY_HEADERS_SHORT = ['S',   'M',   'T',   'W',   'T',   'F',   'S'];

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {DAY_HEADERS_LONG.map((d, i) => (
          <div key={i} className="py-2 text-center text-xs font-medium text-muted-foreground">
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{DAY_HEADERS_SHORT[i]}</span>
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 divide-x divide-y">
        {days.map((day) => {
          const key = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDay.get(key) ?? [];
          const inMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const visible = dayEvents.slice(0, 3);
          const overflow = dayEvents.length - 3;

          return (
            <div
              key={key}
              className={cn(
                'min-h-[64px] sm:min-h-[100px] p-1 sm:p-1.5 flex flex-col gap-0.5',
                !inMonth && 'bg-muted/20',
              )}
            >
              <span
                className={cn(
                  'text-xs font-medium mb-0.5 h-5 w-5 flex items-center justify-center rounded-full self-end',
                  today && 'bg-primary text-primary-foreground',
                  !inMonth && !today && 'text-muted-foreground/40',
                  inMonth && !today && 'text-foreground',
                )}
              >
                {format(day, 'd')}
              </span>

              {visible.map((e) => (
                <EventPill key={e.id} event={e} />
              ))}

              {overflow > 0 && (
                <span className="text-xs text-muted-foreground px-1">+{overflow} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'month' | 'list'>('month');

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

  const monthNav = (
    <div className="flex items-center gap-1">
      <Select
        value={format(currentMonth, 'M')}
        onValueChange={(v) => {
          const d = new Date(currentMonth);
          d.setMonth(parseInt(v) - 1);
          setCurrentMonth(d);
        }}
      >
        <SelectTrigger className="h-7 w-[110px] text-sm border-0 shadow-none focus:ring-0 px-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-0.5">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() - 1, currentMonth.getMonth(), 1))}>
          <ChevronLeft className="h-3 w-3" />
        </Button>
        <span className="text-sm w-10 text-center tabular-nums">{format(currentMonth, 'yyyy')}</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear() + 1, currentMonth.getMonth(), 1))}>
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );

  const viewToggle = (
    <div className="flex items-center gap-1 rounded-md border p-0.5">
      <Button
        variant={view === 'month' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-6 w-6"
        onClick={() => setView('month')}
        title="Month view"
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant={view === 'list' ? 'secondary' : 'ghost'}
        size="icon"
        className="h-6 w-6"
        onClick={() => setView('list')}
        title="List view"
      >
        <LayoutList className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Calendar"
        description={monthNav}
        action={
          <div className="flex items-center gap-2">
            {viewToggle}
            <NewEventDialog onCreated={handleCreated} />
          </div>
        }
      />

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}

      {!isLoading && view === 'month' && (
        <MonthGrid currentMonth={currentMonth} events={events} />
      )}

      {!isLoading && view === 'list' && (
        <>
          {events.length === 0 && (
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
        </>
      )}
    </div>
  );
}
