// script.js
// Talks to the Incident Tracker API and updates the page.

const form = document.getElementById('incident-form');
const list = document.getElementById('incident-list');
const summaryEl = document.getElementById('summary');
const typeFilter = document.getElementById('type-filter');
const severityFilter = document.getElementById('severity-filter');

document.addEventListener('DOMContentLoaded', () => {
  loadSummary();
  loadIncidents();
});

typeFilter.addEventListener('change', loadIncidents);
severityFilter.addEventListener('change', loadIncidents);

async function loadSummary() {
  const res = await fetch('/api/incidents/summary');
  const s = await res.json();
  summaryEl.innerHTML = `
    <div>Total: ${s.total}</div>
    <div>Drills: ${s.drills}</div>
    <div>Live Incidents: ${s.liveIncidents}</div>
    <div>Avg Response Time: ${s.avgResponseTime !== null ? s.avgResponseTime + ' min' : '-'}</div>
    <div>Minor: ${s.minor}</div>
    <div>Moderate: ${s.moderate}</div>
    <div>Major: ${s.major}</div>
  `;
}

async function loadIncidents() {
  const params = new URLSearchParams();
  if (typeFilter.value) params.set('type', typeFilter.value);
  if (severityFilter.value) params.set('severity', severityFilter.value);
  const url = '/api/incidents' + (params.toString() ? `?${params}` : '');

  const res = await fetch(url);
  const incidents = await res.json();
  list.innerHTML = '';
  incidents.forEach(renderRow);
}

function renderRow(i) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${i.date}</td>
    <td>${escapeHtml(i.type)}</td>
    <td>${escapeHtml(i.location)}</td>
    <td>${i.responseTime ? i.responseTime + ' min' : '-'}</td>
    <td>${escapeHtml(i.personnel || '')}</td>
    <td class="severity-${i.severity}">${i.severity}</td>
    <td>${escapeHtml(i.outcome || '')}</td>
    <td><button class="delete-btn" data-id="${i.id}">✕</button></td>
  `;
  tr.querySelector('.delete-btn').addEventListener('click', () => deleteIncident(i.id));
  list.appendChild(tr);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    date: document.getElementById('date').value,
    type: document.getElementById('type').value,
    location: document.getElementById('location').value.trim(),
    responseTime: document.getElementById('responseTime').value,
    personnel: document.getElementById('personnel').value.trim(),
    severity: document.getElementById('severity').value,
    outcome: document.getElementById('outcome').value.trim()
  };

  if (!payload.date || !payload.location) return;

  await fetch('/api/incidents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  form.reset();
  loadSummary();
  loadIncidents();
});

async function deleteIncident(id) {
  await fetch(`/api/incidents/${id}`, { method: 'DELETE' });
  loadSummary();
  loadIncidents();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
