// script.js
// Talks to the Fire Component Tracker API and updates the page.

const form = document.getElementById('component-form');
const list = document.getElementById('component-list');
const summaryEl = document.getElementById('summary');
const statusFilter = document.getElementById('status-filter');

document.addEventListener('DOMContentLoaded', () => {
  loadSummary();
  loadComponents();
});

statusFilter.addEventListener('change', loadComponents);

async function loadSummary() {
  const res = await fetch('/api/components/summary');
  const s = await res.json();
  summaryEl.innerHTML = `
    <div class="badge-total">Total: ${s.total}</div>
    <div class="badge-operational">Operational: ${s.operational}</div>
    <div class="badge-maintenance">Needs Maintenance: ${s.needsMaintenance}</div>
    <div class="badge-faulty">Faulty: ${s.faulty}</div>
  `;
}

async function loadComponents() {
  const status = statusFilter.value;
  const url = status ? `/api/components?status=${encodeURIComponent(status)}` : '/api/components';
  const res = await fetch(url);
  const components = await res.json();
  list.innerHTML = '';
  components.forEach(renderRow);
}

function renderRow(c) {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${escapeHtml(c.location)}</td>
    <td>${escapeHtml(c.type)}</td>
    <td>${c.installDate || '-'}</td>
    <td>${c.lastInspection || '-'}</td>
    <td class="status-${c.status.replace(' ', '-')}">${c.status}</td>
    <td>${escapeHtml(c.notes || '')}</td>
    <td><button class="delete-btn" data-id="${c.id}">✕</button></td>
  `;
  tr.querySelector('.delete-btn').addEventListener('click', () => deleteComponent(c.id));
  list.appendChild(tr);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const payload = {
    location: document.getElementById('location').value.trim(),
    type: document.getElementById('type').value.trim(),
    installDate: document.getElementById('installDate').value,
    lastInspection: document.getElementById('lastInspection').value,
    status: document.getElementById('status').value,
    notes: document.getElementById('notes').value.trim()
  };

  if (!payload.location || !payload.type) return;

  await fetch('/api/components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  form.reset();
  loadSummary();
  loadComponents();
});

async function deleteComponent(id) {
  await fetch(`/api/components/${id}`, { method: 'DELETE' });
  loadSummary();
  loadComponents();
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
