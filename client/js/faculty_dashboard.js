const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
hamburger.addEventListener('click', () => {
const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
hamburger.setAttribute('aria-expanded', String(!isOpen));
mobileNav.setAttribute('aria-hidden', String(isOpen));
if (!isOpen) {
    mobileNav.style.display = 'flex';
    mobileNav.classList.add('is-open');
    document.body.style.overflow = 'hidden';
} else {
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
    mobileNav.addEventListener('transitionend', () => {
    if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none';
    }, { once: true });
}
});
mobileNav.querySelectorAll('a').forEach(link => {
link.addEventListener('click', () => {
    hamburger.setAttribute('aria-expanded', 'false');
    mobileNav.setAttribute('aria-hidden', 'true');
    mobileNav.classList.remove('is-open');
    document.body.style.overflow = '';
    mobileNav.addEventListener('transitionend', () => {
    if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none';
    }, { once: true });
});
});

/* ── DESKTOP FILTER & SEARCH ── */
const statCards   = document.querySelectorAll('.stat-card');
const proposals   = document.querySelectorAll('.proposal-card');
const countBadge  = document.getElementById('proposal-count');
const searchInput = document.getElementById('search-input');
let activeFilter  = 'all';
let searchQuery   = '';

function applyFilters() {
let visible = 0;
proposals.forEach(card => {
    const status = card.dataset.status;
    const title  = card.querySelector('.card-title').textContent.toLowerCase();
    const show   = (activeFilter === 'all' || status === activeFilter) && (!searchQuery || title.includes(searchQuery));
    card.style.display = show ? '' : 'none';
    if (show) visible++;
});
countBadge.textContent = `${visible} total`;
const grid    = document.getElementById('proposals-grid');
const existing = grid.querySelector('.empty-state');
if (visible === 0 && !existing) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.innerHTML = `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="9" x2="18" y2="9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="8" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="8" y1="17" x2="14" y2="17" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p>`;
    grid.appendChild(empty);
} else if (visible > 0 && existing) { existing.remove(); }
}

statCards.forEach(card => {
card.addEventListener('click', () => {
    statCards.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
    card.classList.add('is-active'); card.setAttribute('aria-pressed', 'true');
    activeFilter = card.dataset.filter; applyFilters();
});
card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); } });
});
searchInput.addEventListener('input', () => { searchQuery = searchInput.value.trim().toLowerCase(); applyFilters(); });

/* ── MOBILE FILTER & SEARCH ── */
const mobilePills  = document.querySelectorAll('.mobile-stat-pill');
const mobileCards  = document.querySelectorAll('#mobile-proposals .mobile-card');
const mobileCount  = document.getElementById('mobile-count');
const mobileSearch = document.getElementById('mobile-search');
let mobileFilter   = 'all';
let mobileQuery    = '';

function applyMobileFilters() {
let visible = 0;
mobileCards.forEach(card => {
    const status = card.dataset.status;
    const title  = card.querySelector('.mobile-card-title').textContent.toLowerCase();
    const show   = (mobileFilter === 'all' || status === mobileFilter) && (!mobileQuery || title.includes(mobileQuery));
    card.style.display = show ? '' : 'none';
    if (show) visible++;
});
mobileCount.textContent = `${visible} total`;
const list    = document.getElementById('mobile-proposals');
const existing = list.querySelector('.mobile-empty');
if (visible === 0 && !existing) {
    const empty = document.createElement('div');
    empty.className = 'mobile-empty empty-state';
    empty.innerHTML = `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p>`;
    list.appendChild(empty);
} else if (visible > 0 && existing) { existing.remove(); }
}

mobilePills.forEach(pill => {
pill.addEventListener('click', () => {
    mobilePills.forEach(p => p.classList.remove('is-active'));
    pill.classList.add('is-active'); mobileFilter = pill.dataset.filter; applyMobileFilters();
});
});
mobileSearch.addEventListener('input', () => { mobileQuery = mobileSearch.value.trim().toLowerCase(); applyMobileFilters(); });

/* ── MODAL (with revision previous feedback) ── */
const overlay = document.getElementById('modal-overlay');
let currentDocFile = null;
let currentStatus = '';
let currentTitle = '';
let currentGroup = '';
let currentDate = '';
let currentAbstract = '';
let currentFeedbackPrev = '';

function openModal(title, group, status, date, abstract, previousFeedback = '') {
currentProposalStatus = status;
currentStatus = status;
currentTitle = title;
currentGroup = group;
currentDate = date;
currentAbstract = abstract;
currentFeedbackPrev = previousFeedback;

document.getElementById('modal-prop-title').textContent = title;
document.getElementById('modal-group-text').textContent = group;
document.getElementById('modal-date-text').textContent = 'Submitted ' + date;

const badgeEl = document.getElementById('modal-badge');
const map = {
    review:   ['review',   'To Be Reviewed'],
    revision: ['revision', 'Revision Requested'],
    approved: ['approved', 'Approved'],
    rejected: ['rejected', 'Rejected']
};
const [cls, label] = map[status] || ['review', status];
badgeEl.className = 'status-badge ' + cls;
badgeEl.textContent = label;

document.getElementById('modal-abstract').textContent = abstract;
document.getElementById('modal-feedback').value = '';
resetDoc();

// Show previous feedback container only for revision status
const prevContainer = document.getElementById('previous-feedback-container');
if (status === 'revision' && previousFeedback) {
    prevContainer.style.display = 'block';
    document.getElementById('previous-feedback-text').textContent = previousFeedback;
} else {
    prevContainer.style.display = 'none';
}

// For revision, approved, rejected → only "Change Status" button
const footer = document.getElementById('modal-footer');
if (status === 'revision' || status === 'approved' || status === 'rejected') {
    footer.innerHTML = `<button class="btn btn-change-status" onclick="openStatusModal()">Change Status</button>`;
} else {
    footer.innerHTML = `<button class="btn btn-cancel" onclick="closeModal()">Cancel</button><button class="btn btn-reject" onclick="submitAction('Rejected')">Reject</button><button class="btn btn-revise" onclick="submitAction('Revision Requested')">Request Revision</button><button class="btn btn-approve" onclick="submitAction('Approved')">Approve</button>`;
}
overlay.classList.add('is-open');
document.body.style.overflow = 'hidden';
}

function resetDoc() {
currentDocFile = null;
const ph = document.getElementById('doc-placeholder');
const input = document.getElementById('doc-file-input');
ph.classList.remove('has-file');
if (input) input.value = '';
document.getElementById('doc-label').textContent = 'No document attached';
document.getElementById('doc-sub').textContent = 'PDF, DOC, or DOCX';
document.getElementById('doc-hint').textContent = 'Click to upload a file';
document.getElementById('doc-hint').style.display = '';
}

function removeDoc(e) { e.stopPropagation(); resetDoc(); }

const docInput = document.getElementById('doc-file-input');
if (docInput) {
docInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    currentDocFile = file;
    const ph = document.getElementById('doc-placeholder');
    ph.classList.add('has-file');
    document.getElementById('doc-label').textContent = file.name;
    const kb = file.size < 1024*1024 ? (file.size/1024).toFixed(1)+' KB' : (file.size/(1024*1024)).toFixed(2)+' MB';
    document.getElementById('doc-sub').textContent = kb + ' · ' + file.name.split('.').pop().toUpperCase();
    document.getElementById('doc-hint').style.display = 'none';
});
}



function closeModal() {
overlay.classList.remove('is-open');
document.body.style.overflow = '';
}

overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal(); });

function submitAction(action) {
alert('Action: ' + action + '\n\nIn a live system this would update the proposal status and notify the student.');
closeModal();
}

/* ── New user‑friendly status change modal ── */
const statusModalOverlay = document.getElementById('status-modal-overlay');
const statusButtonsContainer = document.getElementById('status-buttons-container');
const currentStatusHint = document.getElementById('current-status-hint');
const closeStatusModalBtn = document.getElementById('close-status-modal');
let currentProposalStatus = '';

function openStatusModal() {
const allStatuses = [
{ value: 'revision', label: 'Request Revision', class: 'revision' },
{ value: 'approved', label: 'Approved', class: 'approved' },
{ value: 'rejected', label: 'Rejected', class: 'rejected' }
];
const availableStatuses = allStatuses.filter(s => s.value !== currentProposalStatus);
const currentLabel = allStatuses.find(s => s.value === currentProposalStatus)?.label || currentProposalStatus;
currentStatusHint.textContent = `Current status: ${currentLabel}`;
statusButtonsContainer.innerHTML = availableStatuses.map(s => `
<button class="status-btn ${s.class}" data-status="${s.value}">${s.label}</button>
`).join('');
statusButtonsContainer.querySelectorAll('.status-btn').forEach(btn => {
btn.addEventListener('click', () => {
    const newStatus = btn.getAttribute('data-status');
    changeStatus(newStatus);
});
});
statusModalOverlay.classList.add('is-open');
}

function closeStatusModal() {
statusModalOverlay.classList.remove('is-open');
}

function changeStatus(newStatus) {
const displayMap = {
revision: 'Revision Requested',
approved: 'Approved',
rejected: 'Rejected'
};
alert(`Status changed to: ${displayMap[newStatus]}\n\nIn a live system this would update the proposal "${currentTitle}" and notify the student.`);
closeStatusModal();
closeModal();
}

closeStatusModalBtn.addEventListener('click', closeStatusModal);
statusModalOverlay.addEventListener('click', e => { if (e.target === statusModalOverlay) closeStatusModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && statusModalOverlay.classList.contains('is-open')) closeStatusModal(); });