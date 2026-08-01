const body = document.body;
const config = window.INVITELAB_SITE || {};
const envelope = document.getElementById('envelopeScreen');
const openButton = document.getElementById('sealTrigger');
const replayButton = document.getElementById('replayEnvelope');
const hero = document.getElementById('hero');
const countdownTarget = config.countdownTarget ? new Date(config.countdownTarget) : null;
const topbar = document.querySelector('.topbar');
const menuToggle = document.getElementById('menuToggle');
const primaryNav = document.getElementById('primaryNav');

const sectionSelectors = {
  story: ['#story'], rsvp: ['#rsvp'], venueParking: ['#venue'], programme: ['#timeline'], menu: ['#timeline .timeline-item:nth-child(4)'],
  dressCode: ['#dress-code'], stayTravel: ['#stay', '#travel'], faq: ['#faq'],
};
function applySectionChoices() {
  const sections = config.sections || {};
  Object.entries(sectionSelectors).forEach(([key, selectors]) => {
    if (sections[key] !== false) return;
    selectors.forEach((selector) => document.querySelector(selector)?.setAttribute('hidden', ''));
    primaryNav?.querySelectorAll('a').forEach((link) => {
      if (selectors.includes(link.getAttribute('href'))) link.remove();
    });
  });
}
applySectionChoices();

function revealVisibleSections() {
  document.querySelectorAll('[data-reveal]').forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.94) node.classList.add('is-visible');
  });
}
function closeMenu({ restoreFocus = false } = {}) {
  topbar?.classList.remove('menu-open');
  body.classList.remove('menu-open');
  menuToggle?.setAttribute('aria-expanded', 'false');
  menuToggle?.setAttribute('aria-label', config.labels?.openMenu || 'Open navigation menu');
  if (restoreFocus) menuToggle?.focus();
}
function toggleMenu() {
  const willOpen = !topbar?.classList.contains('menu-open');
  topbar?.classList.toggle('menu-open', willOpen);
  body.classList.toggle('menu-open', willOpen);
  menuToggle?.setAttribute('aria-expanded', String(willOpen));
  menuToggle?.setAttribute('aria-label', willOpen ? (config.labels?.closeMenu || 'Close navigation menu') : (config.labels?.openMenu || 'Open navigation menu'));
}
menuToggle?.addEventListener('click', toggleMenu);
primaryNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => closeMenu()));
window.addEventListener('resize', () => { if (window.innerWidth > 1180) closeMenu(); });

function openEnvelope() {
  envelope?.classList.add('hidden');
  body.classList.remove('locked');
  body.classList.add('invitation-open');
  window.setTimeout(() => {
    envelope?.setAttribute('aria-hidden', 'true');
    revealVisibleSections();
    try { hero?.focus({ preventScroll: true }); } catch { hero?.focus(); }
  }, 720);
}
openButton?.addEventListener('click', openEnvelope);
openButton?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openEnvelope(); }
});
replayButton?.addEventListener('click', (event) => {
  event.preventDefault();
  closeMenu();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  envelope?.removeAttribute('aria-hidden');
  envelope?.classList.remove('hidden');
  body.classList.add('locked');
  body.classList.remove('invitation-open');
  window.setTimeout(() => openButton?.focus(), 100);
});

function renderCountdown() {
  const diff = countdownTarget instanceof Date && Number.isFinite(countdownTarget.getTime()) ? countdownTarget - new Date() : 0;
  const values = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  if (diff > 0) {
    values.days = Math.floor(diff / 86400000);
    values.hours = Math.floor((diff / 3600000) % 24);
    values.minutes = Math.floor((diff / 60000) % 60);
    values.seconds = Math.floor((diff / 1000) % 60);
  }
  Object.entries(values).forEach(([key, value]) => {
    const element = document.querySelector(`[data-time="${key}"]`);
    if (element) element.textContent = String(value).padStart(2, '0');
  });
}
renderCountdown();
window.setInterval(renderCountdown, 1000);

const revealNodes = document.querySelectorAll('[data-reveal]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (reducedMotion || !('IntersectionObserver' in window)) revealNodes.forEach((node) => node.classList.add('is-visible'));
else {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
  revealNodes.forEach((node) => revealObserver.observe(node));
}

document.querySelectorAll('.faq-q').forEach((button) => {
  const item = button.closest('.faq-item');
  button.setAttribute('aria-expanded', item?.classList.contains('open') ? 'true' : 'false');
  button.addEventListener('click', () => {
    item?.classList.toggle('open');
    button.setAttribute('aria-expanded', item?.classList.contains('open') ? 'true' : 'false');
  });
});

const openRsvpButton = document.getElementById('openRsvp');
const rsvpModal = document.getElementById('rsvpModal');
const closeRsvpButton = document.getElementById('closeRsvp');
const rsvpForm = document.getElementById('rsvpForm');
const rsvpStatus = document.getElementById('rsvpStatus');
const rsvpDialog = rsvpModal?.querySelector('.rsvp-dialog');
let lastFocusedBeforeRsvp = null;
function focusableInModal() {
  return [...(rsvpDialog?.querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])') || [])].filter((node) => node.offsetParent !== null);
}
function openRsvpModal() {
  if (!rsvpModal) return;
  closeMenu();
  lastFocusedBeforeRsvp = document.activeElement;
  rsvpModal.hidden = false;
  rsvpModal.setAttribute('aria-hidden', 'false');
  body.classList.add('rsvp-open');
  if (window.location.hash !== '#rsvp') history.replaceState(null, '', '#rsvp');
  window.setTimeout(() => document.getElementById('guestName')?.focus(), 80);
}
function closeRsvpModal() {
  if (!rsvpModal) return;
  rsvpModal.hidden = true;
  rsvpModal.setAttribute('aria-hidden', 'true');
  body.classList.remove('rsvp-open');
  if (window.location.hash === '#rsvp') history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  lastFocusedBeforeRsvp?.focus?.();
}
openRsvpButton?.addEventListener('click', (event) => { event.preventDefault(); openRsvpModal(); });
closeRsvpButton?.addEventListener('click', closeRsvpModal);
rsvpModal?.querySelectorAll('[data-close-rsvp]').forEach((node) => node.addEventListener('click', closeRsvpModal));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (rsvpModal && !rsvpModal.hidden) closeRsvpModal();
    else if (topbar?.classList.contains('menu-open')) closeMenu({ restoreFocus: true });
  }
  if (event.key === 'Tab' && rsvpModal && !rsvpModal.hidden) {
    const nodes = focusableInModal();
    if (!nodes.length) return;
    const first = nodes[0]; const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
});
rsvpForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!rsvpForm.reportValidity()) return;
  const data = new FormData(rsvpForm);
  const name = String(data.get('guestName') || '').trim();
  const submit = rsvpForm.querySelector('button[type="submit"]');
  submit?.setAttribute('disabled', 'disabled');
  rsvpStatus.textContent = '';
  try {
    const response = await fetch(config.rsvpSubmitUrl || '', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.fromEntries(data.entries())),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.success) throw new Error('RSVP_FAILED');
    rsvpStatus.textContent = (config.labels?.rsvpThanks || 'Thank you') + (name ? `, ${name}` : '') + '.';
  } catch {
    submit?.removeAttribute('disabled');
    rsvpStatus.textContent = config.labels?.rsvpError || 'We could not send your response. Please try again.';
  }
});
window.addEventListener('hashchange', () => { if (window.location.hash === '#rsvp') openRsvpModal(); });
if (window.location.hash === '#rsvp') window.setTimeout(openRsvpModal, 120);
