import { describe, expect, it } from 'vitest';
import { exportItineraryToICS } from './itineraryIcs';
import type { ItineraryDay } from '../types';

describe('exportItineraryToICS', () => {
  it('emits valid VCALENDAR with events', () => {
    const days: ItineraryDay[] = [
      { day: 1, title: 'Arrive', activities: ['Check-in', 'Dinner'] },
      { day: 2, title: 'Explore', activities: ['Museum'] },
    ];
    const ics = exportItineraryToICS('Paris', days);
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toContain('SUMMARY:Paris Day 1: Arrive');
    expect(ics).toContain('SUMMARY:Paris Day 2: Explore');
    expect(ics).toContain('DESCRIPTION:Check-in\\nDinner');
    expect(ics).toMatch(/DTSTART;VALUE=DATE:\d{8}/);
  });

  it('handles empty activities', () => {
    const ics = exportItineraryToICS('X', [{ day: 1, title: 'T', activities: [] }]);
    expect(ics).toContain('DESCRIPTION:');
  });
});
