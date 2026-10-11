// ---------- Filter ----------
const chips = document.querySelectorAll('.chip');
const cards = document.querySelectorAll('.card');
const empty = document.getElementById('empty');

chips.forEach(chip => chip.addEventListener('click', () => {
  const f = chip.dataset.filter;
  chips.forEach(c => {
    const on = c === chip;
    c.classList.toggle('active', on);
    c.setAttribute('aria-pressed', on);
  });
  let shown = 0;
  cards.forEach(card => {
    const match = f === 'all' || card.dataset.category === f;
    card.hidden = !match;
    if (match) shown++;
  });
  empty.hidden = shown > 0;
}));

// ---------- Registration modal ----------
const modal = document.getElementById('modal');
const form = document.getElementById('reg-form');
const success = document.getElementById('success');
const eventLabel = document.getElementById('modal-event');
let currentEvent = '';
let lastTrigger = null;

// Registrations are kept in the browser so the card state survives a reload.
const load = () => { try { return JSON.parse(localStorage.getItem('registrations')) || []; } catch { return []; } };
const save = list => { try { localStorage.setItem('registrations', JSON.stringify(list)); } catch {} };

function markRegistered(card) {
  const btn = card.querySelector('.register');
  btn.textContent = 'Registered';
  btn.disabled = true;
}
cards.forEach(card => {
  if (load().some(r => r.event === card.dataset.title)) markRegistered(card);
});

document.querySelectorAll('.register').forEach(btn => btn.addEventListener('click', () => {
  const card = btn.closest('.card');
  currentEvent = card.dataset.title;
  lastTrigger = btn;
  eventLabel.textContent = currentEvent;
  form.reset();
  clearErrors();
  form.hidden = false;
  success.hidden = true;
  modal.showModal();
  document.getElementById('name').focus();
}));

const closeModal = () => { modal.close(); lastTrigger && lastTrigger.focus(); };
document.getElementById('close').addEventListener('click', closeModal);
document.getElementById('done').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); }); // click on backdrop

// ---------- Validation ----------
const rules = {
  name:  v => v.trim().length >= 2 ? '' : 'Enter your full name.',
  roll:  v => v.trim().length >= 3 ? '' : 'Enter your roll number.',
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Enter a valid email, like name@example.com.',
  phone: v => /^\d{10}$/.test(v.trim()) ? '' : 'Enter a 10-digit phone number.',
  year:  v => v ? '' : 'Select your year of study.'
};

function setError(field, msg) {
  const input = form.elements[field];
  form.querySelector(`[data-for="${field}"]`).textContent = msg;
  input.setAttribute('aria-invalid', msg ? 'true' : 'false');
}
function clearErrors() { Object.keys(rules).forEach(f => setError(f, '')); }

Object.keys(rules).forEach(f =>
  form.elements[f].addEventListener('blur', e => setError(f, rules[f](e.target.value))));

form.addEventListener('submit', e => {
  e.preventDefault();
  let firstBad = null;
  Object.keys(rules).forEach(f => {
    const msg = rules[f](form.elements[f].value);
    setError(f, msg);
    if (msg && !firstBad) firstBad = form.elements[f];
  });
  if (firstBad) { firstBad.focus(); return; }

  const list = load();
  list.push({
    event: currentEvent,
    name: form.elements.name.value.trim(),
    roll: form.elements.roll.value.trim(),
    email: form.elements.email.value.trim(),
    phone: form.elements.phone.value.trim(),
    year: form.elements.year.value,
    at: new Date().toISOString()
  });
  save(list);

  document.getElementById('success-msg').textContent =
    `Thanks, ${form.elements.name.value.trim().split(' ')[0]}. Your seat for ${currentEvent} is confirmed. A confirmation will go to ${form.elements.email.value.trim()}.`;
  form.hidden = true;
  success.hidden = false;
  markRegistered(document.querySelector(`.card[data-title="${currentEvent}"]`));
  document.getElementById('done').focus();
});
