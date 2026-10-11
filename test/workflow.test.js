import test from 'node:test';
import assert from 'node:assert/strict';
import { seed, approve, conflicts, changeTime, requestReschedule, confirmPayment, confirmCompletion, addInquiry, preparePaymentNote } from '../src/workflow.js';

test('a request cannot write to the calendar until Coach approves it', () => {
  const state = seed();
  assert.equal(state.events.length, 1);
  const next = approve(state, 'REQ-104');
  assert.equal(state.events.length, 1);
  assert.equal(next.events.length, 2);
  assert.equal(next.outbox.length, 1);
  assert.match(next.events[1].meetingUrl, /^https:\/\/zoom\.example\.invalid\//);
  assert.equal(next.outbox[0].status, 'Simulated · not sent');
  assert.equal(next.reminders.length, 1);
});

test('conflicting time blocks approval', () => {
  const state = seed();
  const request = state.requests.find(item => item.id === 'REQ-104');
  assert.equal(conflicts(state, request).length, 0);
  const moved = changeTime(state, 'REQ-104', new Date(new Date(state.events[0].startsAt).getTime() + 15 * 60000).toISOString());
  assert.throws(() => approve(moved, 'REQ-104'), /conflict/i);
});

test('rescheduling keeps the old event until Coach approves', () => {
  const state = seed();
  const newTime = new Date(new Date(state.events[0].startsAt).getTime() + 6 * 24 * 3600000).toISOString();
  const pending = requestReschedule(state, 'EV-101', newTime);
  assert.equal(pending.events[0].startsAt, state.events[0].startsAt);
  const approved = approve(pending, pending.requests[0].id);
  assert.equal(approved.events.length, 1);
  assert.equal(approved.events[0].startsAt, newTime);
  assert.match(approved.outbox[0].subject, /Updated time/);
});

test('payment and attendance require Coach actions', () => {
  const state = seed();
  assert.equal(state.students[0].payment, 'Unconfirmed');
  assert.equal(state.events[0].completed, false);
  const paid = confirmPayment(state, 'daniel@example.com');
  const complete = confirmCompletion(paid, 'EV-101');
  assert.equal(complete.students[0].payment, 'Coach confirmed');
  assert.equal(complete.events[0].completed, true);
  assert.equal(state.events[0].completed, false);
});

test('new inquiries remain pending and email stays simulated', () => {
  const state = addInquiry(seed(), { person: 'Avery Test', email: 'avery@example.com', kind: 'Paid session', source: 'Email', proposed: '2026-10-21T10:00:00+08:00', minutes: 45 });
  assert.equal(state.requests[0].status, 'pending');
  assert.equal(state.outbox.length, 0);
  assert.equal(state.events.length, 1);
});

test('payment note is a draft and does not assert payment was received', () => {
  const next = preparePaymentNote(seed(), 'daniel@example.com');
  assert.equal(next.outbox[0].status, 'Draft · not sent');
  assert.equal(next.students[0].payment, 'Unconfirmed');
});
