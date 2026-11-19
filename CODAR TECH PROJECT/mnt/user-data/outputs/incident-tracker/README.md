# Incident & Drill Report Tracker

Logs fire drills and live incidents — date, location, response time,
personnel, severity, and outcome — with a dashboard summary including
average response time.

## How to run it

```
npm install
npm start
```

Then open: http://localhost:3001

(Runs on port 3001 so it can be run alongside the Fire Component Tracker,
which uses port 3000.)

## Structure

```
incident-tracker/
├── server.js         # Express server + REST API
├── incidents.json    # Stored incident data (pre-seeded with example rows)
├── package.json
└── public/
    ├── index.html
    ├── style.css
    └── script.js
```

## API routes

- `GET /api/incidents` — all reports (optional `?type=` and `?severity=` filters)
- `GET /api/incidents/summary` — dashboard counts + average response time
- `POST /api/incidents` — add a report
- `PUT /api/incidents/:id` — update a report
- `DELETE /api/incidents/:id` — remove a report

## Ideas to extend

- Chart response times over time (line chart)
- Add attachments (photos of the scene, drill checklist)
- Tag involved equipment (link to the Fire Component Tracker)
- Export monthly reports
