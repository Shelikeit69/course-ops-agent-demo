import test from 'node:test';
import assert from 'node:assert/strict';
import { weekMonday, shiftWeek, weekDays, eventPosition } from '../src/calendar.js';

test('Singapore week begins Monday even across a UTC date boundary', () => {
  assert.equal(weekMonday('2026-10-11T18:00:00Z'), '2026-10-12');
  assert.equal(weekMonday('2026-10-14T03:00:00Z'), '2026-10-12');
  assert.equal(shiftWeek('2026-10-12', -1), '2026-10-05');
  assert.equal(weekDays('2026-10-12')[6].key, '2026-10-18');
});

test('events map to the correct Singapore day and hour', () => {
  assert.deepEqual(eventPosition('2026-10-14T11:30:00+08:00', '2026-10-12'), { dayIndex: 2, minuteOfDay: 690 });
  assert.deepEqual(eventPosition('2026-10-19T09:00:00+08:00', '2026-10-12'), { dayIndex: -1, minuteOfDay: 540 });
});
