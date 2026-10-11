# Course Operations Agent Demo

A small, English-language browser demo of an approval-first assistant for a personal coaching business. Every person, message, and session in this repository is fictional.

## One-click preview

Open the [live GitHub Pages preview](https://shelikeit69.github.io/course-ops-agent-demo/). The site is static and deploys from the `main` branch root without a build step.

## What to try

1. Open **Coach's approvals**. One sample request conflicts with an existing session; propose another time before approving it.
2. Approve a free introduction. The demo places it in the weekly calendar, creates a sample meeting URL, a simulated confirmation email, and a reminder entry.
3. Open **Calendar** to view sessions by day and hour in Singapore time. Browse weeks, select a session for details, and request a new time. The original session remains until the new time is approved.
4. Open **Students**. Confirm payment, prepare a fee note, and mark a session complete. These are explicit Coach actions.
5. Open **Email preview** and **Activity log** to see the resulting drafts and decisions.

The **Add sample inquiry** control lets you create more fictional requests. **Reset demo** restores the initial state.

## Run locally

The app needs no dependencies. Serve this folder with any static web server, for example:

```sh
python -m http.server 8000
```

Then open `http://localhost:8000`. To run the workflow tests:

```sh
npm test
```

## Demo boundaries

- Browser `localStorage` stores the demo state on that device. There is no shared database or sign-in.
- There is no connection to real email, LinkedIn, Google Calendar, payment systems, or Zoom.
- `zoom.example.invalid` links are deliberate placeholders and cannot host a meeting.
- Customer emails and reminders are previews only; they are never sent.
- The website self-booking path is not represented because its real operating rules are unknown.
- The demo is for discussion, not operational use. Real integration, security, and business rules require a separate design after feedback.

## Privacy

Do not commit real customer records, correspondence, payment details, meeting links, tokens, or credentials. The committed sample data uses invented names and `example.com` addresses. If adapting this project, keep live configuration and customer data outside the public repository.

## License

MIT — see [LICENSE](LICENSE).
