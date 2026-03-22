import type { ItineraryDay } from '../types';

export function exportItineraryToICS(recName: string, days: ItineraryDay[]): string {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WanderLog//Travel Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const now = new Date();

  days.forEach((day, i) => {
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1 + i);
    const dateStr = startDate.toISOString().split('T')[0].replace(/-/g, '');

    ics.push('BEGIN:VEVENT');
    ics.push(`SUMMARY:${recName} Day ${day.day}: ${day.title}`);
    ics.push(`DTSTART;VALUE=DATE:${dateStr}`);
    ics.push(`DESCRIPTION:${day.activities.join('\\n')}`);
    ics.push('END:VEVENT');
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}
