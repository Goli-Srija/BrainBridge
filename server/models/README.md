# Models

BrainBridge deliberately uses plain SQL with the `pg` library instead of an ORM, so it is easy to explain.
The data model is defined in `database/schema.sql` (34 tables). Queries live next to the logic that uses them:

- `controllers/*.js` — request-level queries (e.g. listing problems, saving a resume)
- `services/*.js` — reusable logic (streaks, readiness score, roadmap generation, activity logging)

See `docs/ARCHITECTURE.md` §4 for the entity-relationship summary.
