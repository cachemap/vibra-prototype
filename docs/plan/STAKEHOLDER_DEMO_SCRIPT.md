# Vibra Stakeholder Demo Script

Use this script for a clean local or Vercel prototype walkthrough. Start at `/projects` and use the global `Reset demo` control before each run.

## Walkthrough

1. Open `/projects` and reset the demo data.
2. Browse `Mobile App Systems`, then open `Checkout Feedback System`.
3. Switch between the `iPhone 16 Pro`, `Pixel 9`, and disabled `iPad Kiosk` devices.
4. Open the Events tab and select `Pay Now` to show interactions, scheduled audio/haptic rows, and timeline playback.
5. Add a new event interaction or playback to show validation, asset picking, and immediate timeline updates.
6. Open the Assets tab, browse the default library, import another library, and upload an audio or AHAP haptic fixture.
7. Return to Events and schedule an imported or uploaded asset on an interaction.
8. Open the Matrix tab, select a playing event and incoming event, then set a resolution behavior.
9. Generate a project share link, an event share link, and a matrix-entry share link.
10. Open `/share/project-checkout`, `/share/event-pay-now`, and `/share/matrix-pay-now-card-declined` as seeded share-preview examples.
11. Use `Reset demo` again to restore the canonical story for the next walkthrough.

## Prototype Limitations

- IndexedDB is the only persistence layer. Data is local to the browser profile and intentionally resettable.
- Sharing links are local prototype records; they do not publish to a backend or native mobile app.
- Browser audio preview works after user action, but native haptic playback is represented visually.
- Uploaded files are stored in IndexedDB for the prototype and are not synced across browsers.
- Authentication, roles, export packaging, revocation, and collaboration workflows are intentionally deferred.

## QA Screenshot References

Current QA captures live in `docs/plan/visual-audit-captures/` and cover `/projects`, project Events, project Assets, project Matrix, `/libraries` list/tile views, and seeded project/event/matrix share previews across the audited desktop and mobile breakpoints.
