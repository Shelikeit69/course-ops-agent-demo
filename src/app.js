import { STORAGE_KEY, seed, approve, returnRequest, changeTime, requestReschedule, confirmPayment, confirmCompletion, addInquiry, preparePaymentNote, conflicts, formatDate } from './workflow.js';

const labels = { overview: 'Overview', approvals: "Coach's approvals", calendar: 'Calendar', students: 'Students', outbox: 'Email preview', activity: 'Activity log', intake: 'New inquiry' };
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const dateInput = value => { const date = new Date(value); const sgt = new Date(date.getTime() + 8 * 3600000); return sgt.toISOString().slice(0,16); };
const asSingaporeTime = value => `${value}:00+08:00`;
let view = 'overview';
let state;
try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)) || seed(); if (!Array.isArray(state.requests) || !Array.isArray(state.events)) throw new Error('invalid'); } catch { state = seed(); }
const app = document.querySelector('#app');

function save(next) { state = next; localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
function toast(message, error = false) { const el = document.querySelector('#toast'); el.textContent = message; el.className = `show${error ? ' error' : ''}`; clearTimeout(toast.timer); toast.timer = setTimeout(() => el.className = '', 4500); }
function run(action, success) { try { save(action()); toast(success); } catch (error) { toast(error.message, true); } }
function pending() { return state.requests.filter(request => request.status === 'pending'); }
function header(eyebrow, title, description, button = '') { return `<div class="page-head"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${description}</p></div>${button}</div>`; }
function badge(name, orange = false) { return `<span class="person-badge${orange ? ' orange' : ''}">${escape(name.split(' ').map(part => part[0]).join('').slice(0,2))}</span>`; }
function empty(text) { return `<div class="empty">${escape(text)}</div>`; }
function requestRow(request) { const risk = conflicts(state, request).length; return `<div class="request-row">${badge(request.person, request.kind === 'Paid session')}<div class="row-main"><strong>${escape(request.person)}</strong><small>${escape(request.kind)} · ${escape(request.source)} · ${escape(request.id)}</small></div><div class="row-end"><span class="tag ${risk ? 'red' : 'amber'}">${risk ? 'Conflict' : 'Needs approval'}</span><small style="display:block;margin-top:5px">${formatDate(request.proposed)}</small></div></div>`; }
function eventRow(event) { return `<div class="event-row">${badge(event.person, event.kind === 'Paid session')}<div class="row-main"><strong>${escape(event.person)}</strong><small>${escape(event.kind)} · ${event.minutes} min</small></div><div class="row-end"><strong>${formatDate(event.startsAt)}</strong><small style="display:block">${event.completed ? 'Completed' : 'Scheduled'}</small></div></div>`; }

function overview() {
  const paid = state.events.filter(event => event.kind === 'Paid session');
  const today = new Intl.DateTimeFormat('en-SG', { dateStyle: 'full', timeZone: 'Asia/Singapore' }).format(new Date());
  return `${header(`${escape(today)} · DEMO WORKSPACE`, 'A calmer way to run every session.', 'The agent prepares the work. Coach makes the decisions.', '<div class="actions"><button class="button" data-view="intake">+ Add sample inquiry</button><button class="button ghost" data-action="reset">Reset demo</button></div>')}
    <section class="hero"><div><div class="eyebrow" style="color:#b9dba8">READY FOR REVIEW</div><h2>${pending().length} decisions need Coach's attention.</h2><p>Review proposed times, resolve clashes, and approve before anything appears on the calendar or in the simulated customer outbox.</p></div><button class="button" data-view="approvals">Review requests →</button></section>
    <section class="stats" aria-label="Workspace summary"><div class="stat"><span class="label">Awaiting approval</span><strong>${pending().length}</strong><small>Calendar stays unchanged</small></div><div class="stat"><span class="label">Scheduled sessions</span><strong>${state.events.length}</strong><small>Approved by Coach</small></div><div class="stat"><span class="label">Paid sessions arranged</span><strong>${paid.length}</strong><small>Flexible course timing</small></div><div class="stat"><span class="label">Confirmed complete</span><strong>${paid.filter(event => event.completed).length}</strong><small>Coach confirms attendance</small></div></section>
    <div class="grid"><section class="panel"><div class="panel-head"><h2>Approval queue</h2><button data-view="approvals">View all →</button></div><div class="panel-body">${pending().slice(0,3).map(requestRow).join('') || empty('No requests are waiting for approval.')}</div></section><section class="panel"><div class="panel-head"><h2>On the calendar</h2><button data-view="calendar">Open calendar →</button></div><div class="panel-body">${[...state.events].sort((a,b) => new Date(a.startsAt)-new Date(b.startsAt)).slice(0,3).map(eventRow).join('') || empty('No confirmed sessions yet.')}</div></section></div>`;
}

function approvalCard(request) {
  const clash = conflicts(state, request);
  return `<article class="approval-card${clash.length ? ' has-conflict' : ''}"><div class="approval-top"><div class="eyebrow">${escape(request.id)} · ${escape(request.source)}</div><span class="tag ${request.kind === 'Paid session' ? 'amber' : ''}">${escape(request.kind)}</span></div><h2>${escape(request.person)}</h2><div class="muted tiny">${escape(request.email)}</div><p>${escape(request.note)}</p><div class="kv"><span>Proposed</span><strong>${formatDate(request.proposed)} SGT</strong><span>Duration</span><strong>${request.minutes} minutes</strong><span>Action</span><strong>${request.reschedules ? 'Reschedule existing session' : 'Add a new session'}</strong></div>${clash.length ? `<div class="conflict">⚠ Conflicts with ${escape(clash.map(item => item.person).join(', '))}. Choose another time before approval.</div>` : ''}<div class="datetime-edit"><input aria-label="New time for ${escape(request.person)} in Singapore time" type="datetime-local" value="${dateInput(request.proposed)}" data-time-for="${escape(request.id)}"><button class="button ghost" data-action="time" data-id="${escape(request.id)}">Propose new time</button></div><div class="approval-actions"><button class="button" data-action="approve" data-id="${escape(request.id)}" ${clash.length ? 'disabled' : ''}>Approve & schedule</button><button class="button warn" data-action="return" data-id="${escape(request.id)}">Return for changes</button></div></article>`;
}
function approvals() { return `${header('HUMAN DECISION GATE', "Coach's approvals", 'Every email or LinkedIn-led calendar change waits here until Coach decides.')}
  <div class="notice"><strong>Approval rule:</strong> The agent can prepare a proposal and check conflicts. Only Coach's approval creates or changes a demo calendar entry.</div><div class="detail-grid">${pending().map(approvalCard).join('') || `<div class="panel">${empty('Everything has been reviewed. Add a sample inquiry to continue the demo.')}</div>`}</div>`; }

function calendar() { const events = [...state.events].sort((a,b) => new Date(a.startsAt)-new Date(b.startsAt)); return `${header('SINGAPORE TIME', 'Calendar & sessions', 'Only Coach-approved sessions appear here. Each meeting belongs to one person and one session.')}
  <div class="notice">Zoom links below use <strong>example.invalid</strong>. They are visual placeholders, not real meetings. Customer emails are simulated.</div><section class="panel table-wrap"><table class="data-table"><thead><tr><th>When</th><th>Customer & session</th><th>Demo meeting link</th><th>Status</th><th>Actions</th></tr></thead><tbody>${events.map(event => `<tr><td><strong>${formatDate(event.startsAt)}</strong><div class="muted tiny">${event.minutes} min · SGT</div></td><td><strong>${escape(event.person)}</strong><div class="muted tiny">${escape(event.email)}<br>${escape(event.kind)} · ${escape(event.id)}</div></td><td><span class="meeting-url">${escape(event.meetingUrl)}</span></td><td><span class="tag ${event.completed ? '' : 'amber'}">${event.completed ? 'Coach confirmed complete' : 'Scheduled'}</span></td><td><div class="actions"><button class="button ghost" data-action="reschedule" data-id="${escape(event.id)}">Request new time</button>${event.completed ? '' : `<button class="button light" data-action="complete" data-id="${escape(event.id)}">Mark complete</button>`}</div></td></tr>`).join('')}</tbody></table>${events.length ? '' : empty('No approved sessions yet.')}</section>`; }

function students() { return `${header('LEARNING RELATIONSHIPS', 'Students', 'Course length stays flexible. Payment and attendance are confirmed by Coach, not inferred by the agent.')}
  <section class="panel table-wrap"><table class="data-table"><thead><tr><th>Student</th><th>Payment</th><th>Arranged</th><th>Completed</th><th>Coach's action</th></tr></thead><tbody>${state.students.map(student => { const sessions = state.events.filter(event => event.email === student.email && event.kind === 'Paid session'); return `<tr><td><strong>${escape(student.name)}</strong><div class="muted tiny">${escape(student.email)}</div></td><td><span class="tag ${student.payment === 'Unconfirmed' ? 'amber' : ''}">${escape(student.payment)}</span></td><td>${sessions.length}</td><td>${sessions.filter(event => event.completed).length}</td><td><div class="actions">${student.payment === 'Unconfirmed' ? `<button class="button ghost" data-action="payment" data-email="${escape(student.email)}">Confirm payment</button>` : '<span class="muted tiny">Confirmed by Coach</span>'}<button class="button light" data-action="billing" data-email="${escape(student.email)}">Prepare fee note</button></div></td></tr>`; }).join('')}</tbody></table></section><div class="notice" style="margin-top:20px">Demo policy: course fees are collected in full upfront and are non-refundable. Coach decides whether a real payment has been received.</div>`; }

function outbox() { return `${header('SIMULATED DELIVERY', 'Email preview', 'See the confirmation and payment messages the agent would prepare. Nothing is sent from this demo.')}
  <section class="panel">${state.outbox.map(mail => `<article class="email-card"><span class="tag">${escape(mail.status)}</span><p class="tiny"><strong>To:</strong> ${escape(mail.to)}<br><strong>Subject:</strong> ${escape(mail.subject)}</p><pre>${escape(mail.body)}</pre></article>`).join('') || empty('No customer emails yet. Approve a request or prepare a fee note.')}</section><section class="panel" style="margin-top:20px"><div class="panel-head"><h2>Reminder schedule</h2></div><div class="panel-body">${(state.reminders || []).map(item => `<div class="event-row"><div class="row-main"><strong>${escape(item.to)}</strong><small>24 hours before ${escape(item.eventId)}</small></div><div class="row-end">${formatDate(item.dueAt)}<small style="display:block">${escape(item.status)}</small></div></div>`).join('') || empty('A reminder appears here after Coach approves a session.')}</div></section>`; }

function activity() { return `${header('DECISION HISTORY', 'Activity log', 'A readable record of what the agent prepared and what Coach confirmed.')}
  <section class="panel" style="padding:27px"><div class="timeline">${state.activity.map(item => `<div class="timeline-item">${escape(item.text)}<small>${formatDate(item.at)}</small></div>`).join('')}</div></section>`; }

function intake() { const tomorrow = dateInput(new Date(Date.now() + 24 * 3600000)); return `${header('SIMULATED INBOX', 'Add a sample inquiry', 'Create a fictional request to see how the approval workflow handles it.')}
  <section class="panel" style="padding:25px;max-width:750px"><form id="intake-form" class="form"><label>Customer name<input name="person" required placeholder="e.g. Avery Morgan"></label><label>Customer email<input name="email" required type="email" placeholder="avery@example.com"></label><label>Request type<select name="kind"><option>Free introduction</option><option>Paid session</option></select></label><label>Source<select name="source"><option>Email</option><option>LinkedIn lead</option></select></label><label>Proposed time · SGT<input name="proposed" type="datetime-local" required value="${tomorrow}"></label><label>Duration · minutes<input name="minutes" type="number" min="5" max="240" value="15" required></label><label class="full"><button class="button" type="submit">Prepare for Coach's approval</button></label></form></section>`; }

const pages = { overview, approvals, calendar, students, outbox, activity, intake };
function render() {
  document.querySelector('#breadcrumb').textContent = labels[view];
  document.querySelector('#approval-count').textContent = pending().length || '';
  document.querySelectorAll('#nav button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  app.innerHTML = `<div class="main">${pages[view]()}</div>`;
}
document.addEventListener('click', event => {
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.view) { view = button.dataset.view; render(); app.focus(); return; }
  const id = button.dataset.id;
  switch (button.dataset.action) {
    case 'approve': run(() => approve(state,id), 'Coach approved the time. Demo calendar and email preview updated.'); break;
    case 'return': run(() => returnRequest(state,id), 'Returned for a new proposal.'); break;
    case 'time': { const input = document.querySelector(`[data-time-for="${id}"]`); run(() => changeTime(state,id,asSingaporeTime(input.value)), 'New time prepared for Coach’s review.'); break; }
    case 'reschedule': { const eventItem = state.events.find(item => item.id === id); const value = prompt(`New time for ${eventItem.person} (Singapore time, YYYY-MM-DD HH:MM):`, dateInput(eventItem.startsAt).replace('T',' ')); if (value === null) return; run(() => requestReschedule(state,id,asSingaporeTime(value.trim().replace(' ','T'))), 'Reschedule request sent to Coach’s approval queue.'); view = 'approvals'; render(); break; }
    case 'complete': run(() => confirmCompletion(state,id), 'Coach confirmed this session was completed.'); break;
    case 'payment': run(() => confirmPayment(state,button.dataset.email), 'Coach confirmed the payment.'); break;
    case 'billing': run(() => preparePaymentNote(state,button.dataset.email), 'Payment note prepared in the simulated outbox.'); break;
    case 'reset': if (confirm('Reset the fictional demo data?')) { save(seed()); toast('Demo reset.'); } break;
  }
});
document.addEventListener('submit', event => {
  if (event.target.id !== 'intake-form') return; event.preventDefault();
  const form = new FormData(event.target);
  run(() => addInquiry(state, { person: form.get('person'), email: form.get('email'), kind: form.get('kind'), source: form.get('source'), proposed: asSingaporeTime(form.get('proposed')), minutes: form.get('minutes') }), 'Inquiry prepared. Coach’s approval is required.');
  view = 'approvals'; render();
});
render();
