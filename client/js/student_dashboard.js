const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
hamburger.addEventListener('click', () => {
    const isOpen = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!isOpen));
    mobileNav.setAttribute('aria-hidden', String(isOpen));
    if (!isOpen) { mobileNav.style.display = 'flex'; mobileNav.classList.add('is-open'); document.body.style.overflow = 'hidden'; } 
    else { mobileNav.classList.remove('is-open'); document.body.style.overflow = ''; mobileNav.addEventListener('transitionend', () => { if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none'; }, { once: true }); }
});
mobileNav.querySelectorAll('a').forEach(link => { link.addEventListener('click', () => { hamburger.setAttribute('aria-expanded', 'false'); mobileNav.setAttribute('aria-hidden', 'true'); mobileNav.classList.remove('is-open'); document.body.style.overflow = ''; mobileNav.addEventListener('transitionend', () => { if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none'; }, { once: true }); }); });

// ========== FILTERING (desktop & mobile - unchanged but included) ==========
const statCards = document.querySelectorAll('.stat-card');
const proposals = document.querySelectorAll('.proposal-card');
const countBadge = document.getElementById('proposal-count');
const searchInput = document.getElementById('search-input');
let activeFilter = 'all';
let searchQuery = '';
function applyFilters() {
    let visible = 0;
    proposals.forEach(card => { const status = card.dataset.status; const title = card.querySelector('.card-title').textContent.toLowerCase(); const show = (activeFilter === 'all' || status === activeFilter) && (!searchQuery || title.includes(searchQuery)); card.style.display = show ? '' : 'none'; if (show) visible++; });
    countBadge.textContent = `${visible} total`;
    const grid = document.getElementById('proposals-grid'); const existing = grid.querySelector('.empty-state');
    if (visible === 0 && !existing) { const empty = document.createElement('div'); empty.className = 'empty-state'; empty.innerHTML = `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p>`; grid.appendChild(empty); } 
    else if (visible > 0 && existing) { existing.remove(); }
}
statCards.forEach(card => { card.addEventListener('click', () => { statCards.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); }); card.classList.add('is-active'); card.setAttribute('aria-pressed', 'true'); activeFilter = card.dataset.filter; applyFilters(); }); });
searchInput.addEventListener('input', () => { searchQuery = searchInput.value.trim().toLowerCase(); applyFilters(); });

const mobilePills = document.querySelectorAll('.mobile-stat-pill');
const mobileCards = document.querySelectorAll('#mobile-proposals-list .mobile-card');
const mobileCount = document.getElementById('mobile-proposal-count');
const mobileSearch = document.getElementById('mobile-search');
let mobileFilter = 'all';
let mobileQuery = '';
function applyMobileFilters() {
    let visible = 0;
    mobileCards.forEach(card => { const status = card.dataset.status; const title = card.querySelector('.mobile-card-title').textContent.toLowerCase(); const show = (mobileFilter === 'all' || status === mobileFilter) && (!mobileQuery || title.includes(mobileQuery)); card.style.display = show ? '' : 'none'; if (show) visible++; });
    mobileCount.textContent = `${visible} total`;
    const list = document.getElementById('mobile-proposals-list'); const existing = list.querySelector('.mobile-empty');
    if (visible === 0 && !existing) { const empty = document.createElement('div'); empty.className = 'mobile-empty empty-state'; empty.innerHTML = `<svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p>`; list.appendChild(empty); }
    else if (visible > 0 && existing) { existing.remove(); }
}
mobilePills.forEach(pill => { pill.addEventListener('click', () => { mobilePills.forEach(p => p.classList.remove('is-active')); pill.classList.add('is-active'); mobileFilter = pill.dataset.filter; applyMobileFilters(); }); });
mobileSearch.addEventListener('input', () => { mobileQuery = mobileSearch.value.trim().toLowerCase(); applyMobileFilters(); });

// ========== MODAL STATE (updated: 2 steps, members only, static professor) ==========
let currentStep = 1;
const TOTAL_STEPS = 2;
const MAX_MEMBERS = 6;
let members = [''];
let uploadedFile = null;
const overlay = document.getElementById('modal-overlay');
const closeBtn = document.getElementById('close-modal');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');
const btnDone = document.getElementById('btn-done');
const stepCounter = document.getElementById('step-counter');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const successState = document.getElementById('success-state');

function openModal() { overlay.removeAttribute('aria-hidden'); overlay.classList.add('is-open'); document.body.style.overflow = 'hidden'; resetForm(); setTimeout(() => { const f = document.getElementById('proposal-title'); if (f) f.focus(); }, 320); }
function closeModal() { overlay.setAttribute('aria-hidden', 'true'); overlay.classList.remove('is-open'); document.body.style.overflow = ''; }
document.querySelectorAll('.open-modal-btn').forEach(btn => btn.addEventListener('click', openModal));
closeBtn.addEventListener('click', closeModal);
btnDone.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeModal(); });

function goToStep(step) {
    document.getElementById(`step-panel-${currentStep}`).classList.remove('is-active');
    currentStep = step;
    document.getElementById(`step-panel-${step}`).classList.add('is-active');
    for (let i = 1; i <= TOTAL_STEPS; i++) { 
    const dot = document.getElementById(`step-dot-${i}`); 
    const item = document.getElementById(`step-item-${i}`); 
    dot.classList.remove('is-active', 'is-done'); 
    item.classList.remove('is-active', 'is-done'); 
    if (i < step) { dot.classList.add('is-done'); item.classList.add('is-done'); dot.innerHTML = `<svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`; } 
    else if (i === step) { dot.classList.add('is-active'); item.classList.add('is-active'); dot.textContent = i; } 
    else { dot.textContent = i; } 
    }
    document.getElementById('connector-1').classList.toggle('is-filled', step > 1);
    btnBack.disabled = step === 1;
    stepCounter.textContent = `Step ${step} of ${TOTAL_STEPS}`;
    if (step === TOTAL_STEPS) { 
    btnNext.innerHTML = `<svg viewBox="0 0 14 14" fill="none" style="width:.875rem;height:.875rem;"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg> Submit`;
    btnNext.className = 'btn-submit'; btnNext.id = 'btn-next';
    populateReview();
    } else { 
    btnNext.innerHTML = `Next <svg viewBox="0 0 14 14" fill="none" style="width:.875rem;height:.875rem;"><polyline points="5,2 10,7 5,12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    btnNext.className = 'btn-next'; btnNext.id = 'btn-next';
    }
    modalBody.scrollTop = 0;
}
btnBack.addEventListener('click', () => { if (currentStep > 1) goToStep(currentStep - 1); });
btnNext.addEventListener('click', () => { if (validateCurrentStep()) { if (currentStep < TOTAL_STEPS) goToStep(currentStep + 1); else handleSubmit(); } });

function validateCurrentStep() {
    if (currentStep === 1) return validateStep1();
    if (currentStep === 2) return validateStep2();
    return true;
}
function validateStep1() {
    let valid = true;
    const titleInput = document.getElementById('proposal-title');
    const titleError = document.getElementById('title-error');
    if (!titleInput.value.trim()) { showError(titleInput, titleError); valid = false; } 
    else { clearError(titleInput, titleError); }
    const memberInputs = document.querySelectorAll('#members-list .member-input');
    const membersError = document.getElementById('members-error');
    const membersNamesErr = document.getElementById('members-names-error');
    membersError.classList.remove('is-visible'); membersNamesErr.classList.remove('is-visible');
    if (memberInputs.length === 0) { membersError.classList.add('is-visible'); valid = false; }
    else {
    let anyEmpty = false;
    memberInputs.forEach(inp => { if (!inp.value.trim()) { inp.classList.add('is-error'); anyEmpty = true; } else { inp.classList.remove('is-error'); } });
    if (anyEmpty) { membersNamesErr.classList.add('is-visible'); valid = false; }
    }
    if (!valid) { const firstErr = modalBody.querySelector('.is-error'); if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    return valid;
}
function validateStep2() {
    const err = document.getElementById('upload-error');
    if (!uploadedFile) { err.classList.add('is-visible'); return false; }
    err.classList.remove('is-visible');
    return true;
}
function clearError(inputEl, errorEl) { inputEl.classList.remove('is-error'); errorEl.classList.remove('is-visible'); }
function showError(inputEl, errorEl) { inputEl.classList.add('is-error'); errorEl.classList.add('is-visible'); }

document.getElementById('proposal-title').addEventListener('input', function() { this.classList.remove('is-error'); document.getElementById('title-error').classList.remove('is-visible'); });

// Members management
function renderMembers() {
    const list = document.getElementById('members-list'); list.innerHTML = '';
    members.forEach((name, idx) => { 
    const row = document.createElement('div'); row.className = 'member-row';
    row.innerHTML = `<span class="member-index">${idx + 1}</span><input type="text" class="member-input" placeholder="Full name" value="${escapeHtml(name)}" autocomplete="off" maxlength="80"><button class="btn-remove-member" type="button" aria-label="Remove member" ${members.length === 1 ? 'disabled style="opacity:0.3;cursor:not-allowed;"' : ''}><svg viewBox="0 0 14 14" fill="none"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button>`;
    row.querySelector('.member-input').addEventListener('input', function() { members[idx] = this.value; this.classList.remove('is-error'); document.getElementById('members-names-error').classList.remove('is-visible'); document.getElementById('members-error').classList.remove('is-visible'); });
    row.querySelector('.btn-remove-member').addEventListener('click', () => { if (members.length > 1) { members.splice(idx, 1); renderMembers(); } });
    list.appendChild(row);
    });
    const addBtn = document.getElementById('add-member-btn'); const hint = document.getElementById('member-hint');
    const atMax = members.length >= MAX_MEMBERS;
    addBtn.disabled = atMax;
    hint.textContent = atMax ? `Maximum of ${MAX_MEMBERS} members reached.` : `Up to ${MAX_MEMBERS} members.`;
}
document.getElementById('add-member-btn').addEventListener('click', () => { if (members.length < MAX_MEMBERS) { members.push(''); renderMembers(); const inputs = document.querySelectorAll('#members-list .member-input'); if (inputs.length) inputs[inputs.length - 1].focus(); } });

// File upload
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-upload');
const filePreview = document.getElementById('file-preview');
const removeFile = document.getElementById('remove-file');
function handleFile(file) {
    ['upload-error','upload-type-error','upload-size-error'].forEach(id => document.getElementById(id).classList.remove('is-visible'));
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) { document.getElementById('upload-type-error').classList.add('is-visible'); return; }
    if (file.size > 20 * 1024 * 1024) { document.getElementById('upload-size-error').classList.add('is-visible'); return; }
    uploadedFile = file;
    document.getElementById('file-name').textContent = file.name;
    document.getElementById('file-size').textContent = formatFileSize(file.size) + ' · PDF';
    filePreview.classList.add('is-visible');
    uploadZone.style.display = 'none';
    populateReview();
}
fileInput.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
uploadZone.addEventListener('drop', e => { e.preventDefault(); uploadZone.classList.remove('drag-over'); if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]); });
removeFile.addEventListener('click', () => { uploadedFile = null; fileInput.value = ''; filePreview.classList.remove('is-visible'); uploadZone.style.display = ''; document.getElementById('file-name').textContent = '—'; document.getElementById('file-size').textContent = '—'; });
function formatFileSize(bytes) { if (bytes < 1024) return bytes + ' B'; if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'; return (bytes / (1024 * 1024)).toFixed(2) + ' MB'; }

function populateReview() {
    const title = document.getElementById('proposal-title').value.trim();
    const memberNames = Array.from(document.querySelectorAll('#members-list .member-input')).map(i => i.value.trim()).filter(Boolean);
    document.getElementById('review-title').textContent = title || '—';
    document.getElementById('review-members').textContent = memberNames.length ? memberNames.join(', ') : '—';
}
function handleSubmit() {
    if (!validateStep2()) return;
    document.getElementById('step-panel-2').classList.remove('is-active');
    successState.classList.add('is-active');
    modalFooter.style.display = 'none';
    document.querySelector('.step-indicator').style.display = 'none';
}
function resetForm() {
    currentStep = 1;
    members = [''];
    uploadedFile = null;
    successState.classList.remove('is-active');
    modalFooter.style.display = '';
    document.querySelector('.step-indicator').style.display = '';
    document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('is-active'));
    document.getElementById('step-panel-1').classList.add('is-active');
    for (let i = 1; i <= TOTAL_STEPS; i++) { 
    const dot = document.getElementById(`step-dot-${i}`); 
    const item = document.getElementById(`step-item-${i}`); 
    dot.classList.remove('is-active', 'is-done'); 
    item.classList.remove('is-active', 'is-done'); 
    dot.textContent = i; 
    }
    document.getElementById('step-dot-1').classList.add('is-active');
    document.getElementById('step-item-1').classList.add('is-active');
    document.getElementById('connector-1').classList.remove('is-filled');
    document.getElementById('proposal-title').value = '';
    fileInput.value = '';
    filePreview.classList.remove('is-visible');
    uploadZone.style.display = '';
    document.getElementById('file-name').textContent = '—';
    document.getElementById('file-size').textContent = '—';
    document.querySelectorAll('.field-error, .members-error, .upload-error').forEach(e => e.classList.remove('is-visible'));
    document.querySelectorAll('.is-error').forEach(e => e.classList.remove('is-error'));
    renderMembers();
    btnBack.disabled = true;
    btnNext.innerHTML = `Next <svg viewBox="0 0 14 14" fill="none" style="width:.875rem;height:.875rem;"><polyline points="5,2 10,7 5,12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    btnNext.className = 'btn-next';
    stepCounter.textContent = 'Step 1 of 2';
}
function escapeHtml(str) { return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
renderMembers();


const proposalsData = [
    {
    id: 1,
    title: "Online Lost & Found Portal for Campus Use",
    status: "Needs Revision",
    group: "BSIT 2-11",
    professor: "Prof. Glicel Reyes",
    date: "Apr 10, 2026",
    abstract: "A web-based lost and found platform where students and staff can report lost items and found items, with photo uploads and a claim process.",
    fileName: "Lost_Found_Portal.pdf",
    fileSize: "1.8 MB",
    feedback: "Please revise the methodology section – you need to include a detailed explanation of the notification system (email/SMS) and add user acceptance test results. Also, the screenshot for the admin panel is missing."
    },
    {
    id: 2,
        title: "Online Lost & Found Portal for Campus Use",
    status: "Submitted",
    group: "BSIT 2-11",
    professor: "Prof. Glicel Reyes",
    date: "Apr 16, 2026",
    abstract: "A web-based lost and found platform where students and staff can report lost items and found items, with photo uploads and a claim process.",
    fileName: "Lost_Found_Portal_v2.pdf",
    fileSize: "1.9 MB",
    feedback: ""
    },
    {
    id: 3,
    title: "General Lost & Found Portal for Campus Use",
    status: "Rejected",
    group: "BSIT 2-11",
    professor: "Prof. Glicel Reyes",
    date: "Apr 2, 2026",
    abstract: "A web-based lost and found platform where students and staff can report lost items and found items, with photo uploads and a claim process.",
    fileName: "General_Lost_Found_Portal.pdf",
    fileSize: "537 KB",
    feedback: "The title is a bit too broad and doesn't reflect the campus-specific focus. Please update the title to be more specific to our university. Additionally, the abstract needs to be expanded to include the key features of your platform and how it addresses user needs. Lastly, make sure to upload the PDF file of your proposal."
    }
];

// View modal elements
const viewModal = document.getElementById('proposal-view-modal');
const closeViewModalButtons = document.querySelectorAll('#close-view-modal, #close-view-modal-footer');
const viewPropTitle = document.getElementById('view-prop-title');
const viewGroup = document.getElementById('view-group');
const viewProfessor = document.getElementById('view-professor');
const viewDate = document.getElementById('view-date');
const viewBadge = document.getElementById('view-badge');
const viewDocName = document.getElementById('view-doc-name');
const viewDocSize = document.getElementById('view-doc-size');
const viewAbstract = document.getElementById('view-abstract');
const viewPreviousFeedbackDiv = document.getElementById('view-previous-feedback');
const viewFeedbackText = document.getElementById('view-feedback-text');
const viewDownloadBtn = document.getElementById('view-download-btn');

function openProposalViewModal(proposal) {
    // Set title
    viewPropTitle.textContent = proposal.title;
    viewGroup.innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${proposal.group}`;
    viewProfessor.innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${proposal.professor}`;
    viewDate.innerHTML = `<svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg> Submitted ${proposal.date}`;

    // Status badge
    const statusClass = proposal.status.toLowerCase().replace(' ', '-');
    viewBadge.className = `status-badge ${statusClass}`;
    viewBadge.textContent = proposal.status === 'Needs Revision' ? 'Needs Revision' : proposal.status;

    // Document info
    viewDocName.textContent = proposal.fileName;
    viewDocSize.textContent = proposal.fileSize + ' · PDF';

    // Abstract
    viewAbstract.textContent = proposal.abstract;

    // Previous feedback
    if (proposal.status === 'Needs Revision' && proposal.feedback) {
    viewFeedbackText.textContent = proposal.feedback;
    viewPreviousFeedbackDiv.style.display = 'block';
    } else {
    viewPreviousFeedbackDiv.style.display = 'none';
    }

    // Download button event
    viewDownloadBtn.onclick = () => alert(`Downloading: ${proposal.fileName}\n(integration with real file download would go here)`);

    // Show modal
    viewModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
}

function closeViewModal() {
    viewModal.classList.remove('is-open');
    document.body.style.overflow = '';
}

closeViewModalButtons.forEach(btn => {
    btn.addEventListener('click', closeViewModal);
});
viewModal.addEventListener('click', (e) => {
    if (e.target === viewModal) closeViewModal();
});
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && viewModal.classList.contains('is-open')) closeViewModal();
});

// Attach click handlers to all "View" buttons (desktop and mobile)
function attachViewHandlers() {
    const viewButtons = document.querySelectorAll('.card-action, .mobile-card-action');
    viewButtons.forEach((btn, idx) => {
    // Remove existing listeners to avoid duplication
    btn.removeEventListener('click', handleViewClick);
    btn.addEventListener('click', handleViewClick);
    });
}

function handleViewClick(e) {
    e.stopPropagation();
    // Find the parent card
    const card = this.closest('.proposal-card, .mobile-card');
    if (!card) return;
    const status = card.dataset.status;
    // Match by title and status
    const titleElem = card.querySelector('.card-title, .mobile-card-title');
    const title = titleElem ? titleElem.textContent.trim() : '';
    const proposal = proposalsData.find(p => p.title === title && p.status === status);
    if (proposal) {
    openProposalViewModal(proposal);
    } else {
    // Fallback if not found in data (should not happen)
    alert('Proposal details not found.');
    }
}

// Call after initial render and whenever dynamic cards are added (not needed here)
attachViewHandlers();

// If you have dynamic filtering that regenerates cards, you may need to re‑attach handlers.
// For simplicity, we can observe the DOM or call attachViewHandlers after filter updates.
// But since your filters only hide/show, the existing buttons remain.
// For safety, call again after filter functions (you can add inside applyFilters and applyMobileFilters).
// I'll add a line inside your existing applyFilters and applyMobileFilters:
// (You'll need to add `attachViewHandlers();` inside those functions in your original code.)
// But to avoid modifying your existing functions, I'll override them here.
// ========== PATCH YOUR EXISTING FILTER FUNCTIONS TO RE-ATTACH HANDLERS ==========
// Store original functions
const originalApplyFilters = window.applyFilters;
const originalApplyMobileFilters = window.applyMobileFilters;
if (typeof originalApplyFilters === 'function') {
    window.applyFilters = function() {
    originalApplyFilters();
    attachViewHandlers();
    };
}
if (typeof originalApplyMobileFilters === 'function') {
    window.applyMobileFilters = function() {
    originalApplyMobileFilters();
    attachViewHandlers();
    };
}
// Also run after initial load

const logoutBtn = document.getElementById('logoutBtn');
logoutBtn.addEventListener('click', () => {
    // Here you would typically clear authentication tokens or session data
    // For this example, we'll just redirect to a login page
    window.location.href = 'index.html'; // Change to your actual login page
});

attachViewHandlers();
