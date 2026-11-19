// server.js
// Backend for the Incident/Drill Report Tracker.
// Logs fire drills and live incidents: date, location, response time,
// personnel, severity, and outcome — with a dashboard summary.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001; // different port so both trackers can run at once
const DATA_FILE = path.join(__dirname, 'incidents.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return data ? JSON.parse(data) : [];
}

function writeData(incidents) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(incidents, null, 2));
}

// GET all incidents (optional filters: ?type= & ?severity=)
app.get('/api/incidents', (req, res) => {
  const { type, severity } = req.query;
  let incidents = readData();
  if (type) incidents = incidents.filter(i => i.type === type);
  if (severity) incidents = incidents.filter(i => i.severity === severity);
  // most recent first
  incidents.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(incidents);
});

// GET dashboard summary
app.get('/api/incidents/summary', (req, res) => {
  const incidents = readData();
  const total = incidents.length;
  const drills = incidents.filter(i => i.type === 'Drill').length;
  const liveIncidents = incidents.filter(i => i.type === 'Live Incident').length;

  const responseTimes = incidents
    .map(i => Number(i.responseTime))
    .filter(n => !isNaN(n) && n > 0);
  const avgResponseTime = responseTimes.length
    ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(1)
    : null;

  res.json({
    total,
    drills,
    liveIncidents,
    avgResponseTime,
    minor: incidents.filter(i => i.severity === 'Minor').length,
    moderate: incidents.filter(i => i.severity === 'Moderate').length,
    major: incidents.filter(i => i.severity === 'Major').length
  });
});

// POST a new incident
app.post('/api/incidents', (req, res) => {
  const { date, type, location, responseTime, personnel, severity, outcome } = req.body;

  if (!date || !type || !location) {
    return res.status(400).json({ error: 'Date, type, and location are required' });
  }

  const incidents = readData();
  const newIncident = {
    id: Date.now(),
    date,
    type,
    location: location.trim(),
    responseTime: responseTime || '',
    personnel: personnel || '',
    severity: severity || 'Minor',
    outcome: outcome || ''
  };

  incidents.push(newIncident);
  writeData(incidents);
  res.status(201).json(newIncident);
});

// PUT update an incident
app.put('/api/incidents/:id', (req, res) => {
  const id = Number(req.params.id);
  const incidents = readData();
  const incident = incidents.find(i => i.id === id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const fields = ['date', 'type', 'location', 'responseTime', 'personnel', 'severity', 'outcome'];
  fields.forEach(field => {
    if (req.body[field] !== undefined) {
      incident[field] = req.body[field];
    }
  });

  writeData(incidents);
  res.json(incident);
});

// DELETE an incident
app.delete('/api/incidents/:id', (req, res) => {
  const id = Number(req.params.id);
  let incidents = readData();
  const exists = incidents.some(i => i.id === id);

  if (!exists) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  incidents = incidents.filter(i => i.id !== id);
  writeData(incidents);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Incident Tracker running at http://localhost:${PORT}`);
});
