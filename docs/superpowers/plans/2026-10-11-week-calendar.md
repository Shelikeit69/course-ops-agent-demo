# Week Calendar Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show a large, readable weekly calendar with each approved session placed at its Singapore-time hour.

**Architecture:** Keep the existing approval and event state unchanged. Add pure Singapore-time week helpers, render a seven-day hour grid in the calendar page, and retain a selected-session detail panel for actions and the demo link.

**Tech Stack:** Vanilla JavaScript, CSS, Node test runner.

---

### Task 1: Week calculations

**Files:** Create `src/calendar.js`; create `test/calendar.test.js`.

- [x] Derive the Monday-to-Sunday range in Singapore time.
- [x] Map approved event start times to their day and time position.
- [x] Test week boundaries and time positioning.

### Task 2: Large calendar interface

**Files:** Modify `src/app.js`, `styles.css`.

- [x] Replace the calendar table with a seven-day weekly grid and hour labels.
- [x] Add previous, next, and current-week controls.
- [x] Show selected session details, demo Zoom link, and existing actions.
- [x] Make narrow screens horizontally scroll the calendar while retaining legible time slots.

### Task 3: Verification and publication

**Files:** Modify `README.md` if needed.

- [x] Run targeted and full tests, inspect the browser view and workflow.
- [ ] Commit and push to the existing GitHub Pages repository.
- [ ] Verify the published page loads the updated interface.
