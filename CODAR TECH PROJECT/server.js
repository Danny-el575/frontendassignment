// server.js
// Backend for the Fire System Component Tracker.
// Tracks fire safety components (panels, detectors, generators, etc.)
// across rooms/locations, their install dates, inspections, and status.

const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'components.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return data ? JSON.parse(data) : [];
}

function writeData(components) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(components, null, 2));
}

// GET all components (optionally filter by status via ?status=)
app.get('/api/components', (req, res) => {
  const { status } = req.query;
  let components = readData();
  if (status) {
    components = components.filter(c => c.status === status);
  }
  res.json(components);
});

// GET dashboard summary counts
app.get('/api/components/summary', (req, res) => {
  const components = readData();
  const summary = {
    total: components.length,
    operational: components.filter(c => c.status === 'Operational').length,
    needsMaintenance: components.filter(c => c.status === 'Needs Maintenance').length,
    faulty: components.filter(c => c.status === 'Faulty').length
  };
  res.json(summary);
});

// POST a new component
app.post('/api/components', (req, res) => {
  const { location, type, installDate, lastInspection, status, notes } = req.body;

  if (!location || !type) {
    return res.status(400).json({ error: 'Location and type are required' });
  }

  const components = readData();
  const newComponent = {
    id: Date.now(),
    location: location.trim(),
    type: type.trim(),
    installDate: installDate || '',
    lastInspection: lastInspection || '',
    status: status || 'Operational',
    notes: notes || ''
  };

  components.push(newComponent);
  writeData(components);
  res.status(201).json(newComponent);
});

// PUT update a component
app.put('/api/components/:id', (req, res) => {
  const id = Number(req.params.id);
  const components = readData();
  const component = components.find(c => c.id === id);

  if (!component) {
    return res.status(404).json({ error: 'Component not found' });
  }

  const fields = ['location', 'type', 'installDate', 'lastInspection', 'status', 'notes'];
  fields.forEach(field => {
    if (typeof req.body[field] === 'string') {
      component[field] = req.body[field];
    }
  });

  writeData(components);
  res.json(component);
});

// DELETE a component
app.delete('/api/components/:id', (req, res) => {
  const id = Number(req.params.id);
  let components = readData();
  const exists = components.some(c => c.id === id);

  if (!exists) {
    return res.status(404).json({ error: 'Component not found' });
  }

  components = components.filter(c => c.id !== id);
  writeData(components);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Fire Component Tracker running at http://localhost:${PORT}`);
});
