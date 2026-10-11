export const STORAGE_KEY = 'course-ops-demo-v1';

function demoDate(daysFromToday, hour, minute = 0) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Singapore', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const part = name => parts.find(item => item.type === name).value;
  const day = new Date(Date.UTC(Number(part('year')), Number(part('month')) - 1, Number(part('day')) + daysFromToday));
  return `${day.toISOString().slice(0,10)}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00+08:00`;
}

export const seed = () => ({
  requests: [
    { id: 'REQ-104', person: 'Maya Chen', email: 'maya@example.com', kind: 'Free introduction', source: 'Email', proposed: demoDate(4, 10), minutes: 15, status: 'pending', note: 'Interested in clarifying her coaching niche.' },
    { id: 'REQ-105', person: 'Daniel Reed', email: 'daniel@example.com', kind: 'Paid session', source: 'LinkedIn lead', proposed: demoDate(5, 14), minutes: 60, status: 'pending', note: 'Session 2. Payment status needs Coach’s confirmation.' },
    { id: 'REQ-106', person: 'Priya Shah', email: 'priya@example.com', kind: 'Paid session', source: 'Email', proposed: demoDate(3, 11), minutes: 60, status: 'pending', note: 'Requested a time that conflicts with an existing session.' }
  ],
  events: [
    { id: 'EV-101', requestId: 'REQ-101', person: 'Daniel Reed', email: 'daniel@example.com', kind: 'Paid session', startsAt: demoDate(3, 11), minutes: 60, meetingUrl: 'https://zoom.example.invalid/j/demo-ev-101', completed: false }
  ],
  students: [
    { email: 'daniel@example.com', name: 'Daniel Reed', payment: 'Unconfirmed', paidCourse: true },
    { email: 'priya@example.com', name: 'Priya Shah', payment: 'Unconfirmed', paidCourse: true }
  ],
  outbox: [],
  reminders: [],
  activity: [{ id: 'ACT-1', text: 'Demo workspace loaded with fictional requests.', at: new Date().toISOString() }],
  nextId: 200
});

export function overlaps(startA, minutesA, startB, minutesB) {
  const a = new Date(startA).getTime();
  const b = new Date(startB).getTime();
  return a < b + minutesB * 60000 && b < a + minutesA * 60000;
}

export function conflicts(state, request, proposed = request.proposed) {
  return state.events.filter(event => event.requestId !== request.reschedules && overlaps(proposed, request.minutes, event.startsAt, event.minutes));
}

function record(state, text) {
  state.activity.unshift({ id: `ACT-${state.nextId++}`, text, at: new Date().toISOString() });
}

function copy(state) { return structuredClone(state); }

export function approve(state, requestId) {
  const next = copy(state);
  const request = next.requests.find(item => item.id === requestId);
  if (!request || request.status !== 'pending') throw new Error('This request is no longer pending.');
  if (!request.email) throw new Error('A customer email is required before confirmation.');
  if (Number.isNaN(new Date(request.proposed).getTime())) throw new Error('A valid time is required.');
  if (conflicts(next, request).length) throw new Error('Calendar conflict: choose another time before approving.');

  if (request.reschedules) {
    const prior = next.events.find(event => event.requestId === request.reschedules);
    if (!prior) throw new Error('The original session could not be found.');
    prior.startsAt = request.proposed;
    prior.minutes = request.minutes;
    prior.meetingUrl = `https://zoom.example.invalid/j/demo-${prior.id.toLowerCase()}-${next.nextId++}`;
    next.reminders = next.reminders.filter(item => item.eventId !== prior.id);
    next.reminders.push({ eventId: prior.id, to: request.email, dueAt: new Date(new Date(prior.startsAt).getTime() - 24 * 3600000).toISOString(), status: 'Demo only · not sent' });
    next.outbox.unshift({ id: `MAIL-${next.nextId++}`, to: request.email, subject: `Updated time: ${request.kind}`, body: `Hi ${request.person},\n\nYour ${request.kind.toLowerCase()} is now scheduled for ${formatDate(prior.startsAt)}.\nDemo Zoom link: ${prior.meetingUrl}\n\nThis is a simulated email; it has not been sent.`, status: 'Simulated · not sent' });
  } else {
    const id = `EV-${next.nextId++}`;
    const meetingUrl = `https://zoom.example.invalid/j/demo-${id.toLowerCase()}`;
    next.events.push({ id, requestId: request.id, person: request.person, email: request.email, kind: request.kind, startsAt: request.proposed, minutes: request.minutes, meetingUrl, completed: false });
    next.reminders.push({ eventId: id, to: request.email, dueAt: new Date(new Date(request.proposed).getTime() - 24 * 3600000).toISOString(), status: 'Demo only · not sent' });
    next.outbox.unshift({ id: `MAIL-${next.nextId++}`, to: request.email, subject: `Confirmed: ${request.kind}`, body: `Hi ${request.person},\n\nYour ${request.kind.toLowerCase()} is scheduled for ${formatDate(request.proposed)}.\nDemo Zoom link: ${meetingUrl}\n\nThis is a simulated email; it has not been sent.`, status: 'Simulated · not sent' });
    if (request.kind === 'Paid session' && !next.students.some(person => person.email === request.email)) {
      next.students.push({ email: request.email, name: request.person, payment: 'Unconfirmed', paidCourse: true });
    }
  }
  request.status = 'approved';
  record(next, `Coach approved ${request.id} for ${request.person}; demo calendar and email were prepared.`);
  return next;
}

export function returnRequest(state, requestId) {
  const next = copy(state);
  const request = next.requests.find(item => item.id === requestId);
  if (!request || request.status !== 'pending') throw new Error('This request is no longer pending.');
  request.status = 'needs-revision';
  record(next, `Coach returned ${request.id} for a new time.`);
  return next;
}

export function changeTime(state, requestId, value) {
  const next = copy(state);
  const request = next.requests.find(item => item.id === requestId);
  if (!request || !['pending', 'needs-revision'].includes(request.status)) throw new Error('This time cannot be changed.');
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Enter a valid date and time.');
  request.proposed = date.toISOString();
  request.status = 'pending';
  record(next, `${request.id} was proposed for ${formatDate(request.proposed)}; Coach’s approval is still required.`);
  return next;
}

export function requestReschedule(state, eventId, proposed) {
  const next = copy(state);
  const event = next.events.find(item => item.id === eventId);
  if (!event) throw new Error('Session not found.');
  if (next.requests.some(item => item.reschedules === event.requestId && item.status === 'pending')) throw new Error('A reschedule is already waiting for approval.');
  if (Number.isNaN(new Date(proposed).getTime())) throw new Error('Enter a valid date and time.');
  const id = `REQ-${next.nextId++}`;
  next.requests.unshift({ id, person: event.person, email: event.email, kind: event.kind, source: 'Student change', proposed: new Date(proposed).toISOString(), minutes: event.minutes, status: 'pending', note: 'Student requested a new time. Original calendar entry stays until Coach approves.', reschedules: event.requestId });
  record(next, `${event.person} requested a new time; ${id} awaits Coach’s decision.`);
  return next;
}

export function confirmPayment(state, email) {
  const next = copy(state);
  const student = next.students.find(item => item.email === email);
  if (!student) throw new Error('Student not found.');
  student.payment = 'Coach confirmed';
  record(next, `Coach confirmed payment for ${student.name}.`);
  return next;
}

export function confirmCompletion(state, eventId) {
  const next = copy(state);
  const event = next.events.find(item => item.id === eventId);
  if (!event) throw new Error('Session not found.');
  event.completed = true;
  record(next, `Coach confirmed ${event.person} completed ${event.kind.toLowerCase()}.`);
  return next;
}

export function addInquiry(state, { person, email, kind, source, proposed, minutes }) {
  if (!person?.trim() || !email?.trim() || !email.includes('@') || Number.isNaN(new Date(proposed).getTime())) throw new Error('Enter a name, email, and valid time.');
  const next = copy(state);
  const id = `REQ-${next.nextId++}`;
  next.requests.unshift({ id, person: person.trim(), email: email.trim(), kind, source, proposed: new Date(proposed).toISOString(), minutes: Number(minutes), status: 'pending', note: 'New fictional inquiry created in the demo.' });
  record(next, `Agent prepared ${id} for Coach’s approval.`);
  return next;
}

export function preparePaymentNote(state, email) {
  const next = copy(state);
  const student = next.students.find(item => item.email === email);
  if (!student) throw new Error('Student not found.');
  next.outbox.unshift({ id: `MAIL-${next.nextId++}`, to: email, subject: 'Course payment information', body: `Hi ${student.name},\n\nThe course fee is paid in full before the course begins. Payments are non-refundable. Coach will confirm the fee and available payment method with you directly.\n\nThis is a draft in a simulated outbox. It has not been sent.`, status: 'Draft · not sent' });
  record(next, `Agent prepared a payment information draft for ${student.name}; no email was sent.`);
  return next;
}

export function formatDate(value) {
  return new Intl.DateTimeFormat('en-SG', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Singapore' }).format(new Date(value));
}
