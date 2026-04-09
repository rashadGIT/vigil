import { apiClient } from './client';
import type { ICalendarEvent } from '@vigil/shared-types';
import { EventType } from '@vigil/shared-types';

export async function getCalendarEvents(start?: string, end?: string): Promise<ICalendarEvent[]> {
  const res = await apiClient.get<ICalendarEvent[]>('/calendar', { params: { start, end } });
  return res.data;
}

export async function createCalendarEvent(dto: {
  title: string;
  eventType: EventType;
  startTime: string;
  endTime: string;
  caseId?: string;
  notes?: string;
}): Promise<ICalendarEvent> {
  const res = await apiClient.post<ICalendarEvent>('/calendar', dto);
  return res.data;
}
