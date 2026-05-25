// student_dashboard.js

// ---------- Global variables ----------
let currentStep = 1;
const TOTAL_STEPS = 2;
const MAX_MEMBERS = 6;
let members = [];
let uploadedFile = null;
let currentUser = null;
let allProposals = [];
let activeFilter = 'all';
let searchQuery = '';
let mobileFilter = 'all';
let mobileQuery = '';
let isResubmit = false;
let currentResubmitProposalId = null;
let classmates = [];


// ---------- Update all UI elements from currentUser ----------
function updateUserUI() {
  if (!currentUser) return;
  const firstName = currentUser.first_name || 'Student';
  const last_name = currentUser.last_name || '';

  const role = currentUser.role || 'Student';
  const section = currentUser.year_and_section || '';
  const initial = firstName.charAt(0).toUpperCase();
  // Desktop sidebar
  const sidebarName = document.querySelector('.sidebar-user-name');
  if (sidebarName) sidebarName.textContent = firstName;
  const sidebarRole = document.querySelector('.sidebar-user-role');
  if (sidebarRole) sidebarRole.textContent = role + (section ? ` · ${section}` : '');
  const avatarCircle = document.querySelector('.sidebar-footer .avatar-circle');
  if (avatarCircle) avatarCircle.textContent = initial;

  // Desktop topbar avatar
  const topbarAvatar = document.querySelector('.topbar-right .avatar-btn');
  if (topbarAvatar) topbarAvatar.textContent = initial;

  // Mobile topbar avatar (the one inside .mobile-avatar – but that's for greeting card)
  const mobileAvatar = document.querySelector('.mobile-avatar');
  if (mobileAvatar) mobileAvatar.textContent = initial;

  // Mobile nav logout button area is handled separately, no user info there
}

// ---------- Load current user and proposals ----------
async function loadCurrentUser() {
  try {
    const response = await fetchWithAuth('/users/me');
    const user = await response.json();
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    updateUserUI();   // Update sidebar, avatars, etc.
    return user;
  } catch (err) {
    console.error('Failed to load user:', err);
    const stored = getUserFromStorage();
    if (stored) {
      currentUser = stored;
      updateUserUI(); // still update from cached
      showToast('Using cached profile', 'warning');
      return stored;
    }
    throw err;
  }
}

async function loadProposals() {
  if (!currentUser) return;
  try {
    const response = await fetchWithAuth(`/proposals`);
    allProposals = await response.json();
  } catch (err) {
    console.error('Failed to load proposals:', err);
    allProposals = [];
  }
  renderDesktop();
  renderMobile();
  updateStats();
  updateWelcomeMessage();
}

// ---------- Fetch classmates from same section ----------
async function loadClassmates() {
  if (!currentUser || !currentUser.year_and_section) return;
  try {
    const response = await fetchWithAuth(`/users?section=${encodeURIComponent(currentUser.year_and_section)}&role=Student`);
    const users = await response.json();
    classmates = users.map(u => ({
      id: u._id,
      name: `${u.first_name} ${u.last_name}`
    }));
    const currentId = currentUser._id;
    if (!classmates.find(c => c.id === currentId)) {
      classmates.push({ id: currentId, name: `${currentUser.first_name} ${currentUser.last_name}` });
    }
  } catch (err) {
    console.error('Failed to load classmates:', err);
    classmates = [{ id: currentUser._id, name: `${currentUser.first_name} ${currentUser.last_name}` }];
  }
}

// ---------- Fetch assigned adviser ----------
async function loadAdviser() {
  const el = document.getElementById('assigned-adviser');
  const el2 = document.getElementById('review-adviser');
  if (!el) return;
  try {
    const response = await fetchWithAuth('/users/my-adviser');
    if (!response.ok) throw new Error('Adviser not found');
    const adviser = await response.json();
    el.textContent = `${adviser.first_name} ${adviser.last_name}`;
    el2.textContent = `${adviser.first_name} ${adviser.last_name}`;
  } catch (err) {
    console.error('Failed to load adviser:', err);
    el.textContent = 'Not assigned';
    el2.textContent = 'Not assigned';
  }
}

// ---------- Render desktop proposals (unchanged) ----------
function renderDesktop() {
  const grid = document.getElementById('proposals-grid');
  if (!grid) return;
  let filtered = allProposals.filter(p => {
    const statusMatch = activeFilter === 'all' || p.status === activeFilter;
    const searchMatch = !searchQuery || p.title.toLowerCase().includes(searchQuery) ||
      (p.abstract && p.abstract.toLowerCase().includes(searchQuery));
    return statusMatch && searchMatch;
  });
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="9" x2="18" y2="9" stroke="currentColor" stroke-width="1.3"/><line x1="8" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="1.3"/><line x1="8" y1="17" x2="14" y2="17" stroke="currentColor" stroke-width="1.3"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p></div>`;
    document.getElementById('proposal-count').innerText = '0 total';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const statusClass = p.status.toLowerCase().replace(' ', '-');
    const membersStr = p.members ? p.members.map(m => m.name).join(', ') : 'No members';
    return `
      <article class="proposal-card" data-status="${p.status}" data-id="${p._id}">
        <div class="card-stripe ${statusClass}"></div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${escapeHtml(p.title)}</h3>
            <span class="status-badge ${statusClass}">${p.status}</span>
          </div>
          <div class="card-meta">
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg>${escapeHtml(membersStr)}</span>
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg>Submitted ${new Date(p.submissionDate).toLocaleDateString()}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="card-date">${new Date(p.submissionDate).toLocaleDateString()}</span>
          <button class="card-action view-proposal" data-id="${p._id}">View →</button>
        </div>
      </article>
    `;
  }).join('');
  document.getElementById('proposal-count').innerText = `${filtered.length} total`;
  attachViewHandlers();
}

// ---------- Render mobile proposals (unchanged) ----------
function renderMobile() {
  const list = document.getElementById('mobile-proposals-list');
  if (!list) return;
  let filtered = allProposals.filter(p => {
    const statusMatch = mobileFilter === 'all' || p.status === mobileFilter;
    const searchMatch = !mobileQuery || p.title.toLowerCase().includes(mobileQuery) ||
      (p.abstract && p.abstract.toLowerCase().includes(mobileQuery));
    return statusMatch && searchMatch;
  });
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p></div>`;
    document.getElementById('mobile-proposal-count').innerText = '0 total';
    return;
  }
  list.innerHTML = filtered.map(p => {
    const statusClass = p.status.toLowerCase().replace(' ', '-');
    const membersStr = p.members ? p.members.map(m => m.name).join(', ') : 'No members';
    return `
      <article class="mobile-card" data-status="${p.status}" data-id="${p._id}">
        <div class="card-stripe ${statusClass}"></div>
        <div class="mobile-card-inner">
          <div class="mobile-card-top">
            <h3 class="mobile-card-title">${escapeHtml(p.title)}</h3>
            <span class="status-badge ${statusClass}">${p.status}</span>
          </div>
          <div class="mobile-card-meta">
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg>${escapeHtml(membersStr)}</span>
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg>Submitted ${new Date(p.submissionDate).toLocaleDateString()}</span>
          </div>
          <div class="mobile-card-footer">
            <span class="mobile-card-date">${new Date(p.submissionDate).toLocaleDateString()}</span>
            <button class="mobile-card-action view-proposal" data-id="${p._id}">View →</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
  document.getElementById('mobile-proposal-count').innerText = `${filtered.length} total`;
  attachViewHandlers();
}

function attachViewHandlers() {
  document.querySelectorAll('.view-proposal').forEach(btn => {
    btn.removeEventListener('click', viewHandler);
    btn.addEventListener('click', viewHandler);
  });
}

function viewHandler(e) {
  const id = e.currentTarget.getAttribute('data-id');
  const proposal = allProposals.find(p => p._id === id);
  if (proposal) openProposalViewModal(proposal);
}

function updateStats() {
  const stats = {
    all: allProposals.length,
    Submitted: allProposals.filter(p => p.status === 'Submitted').length,
    'Needs Revision': allProposals.filter(p => p.status === 'Needs Revision').length,
    Approved: allProposals.filter(p => p.status === 'Approved').length,
    Rejected: allProposals.filter(p => p.status === 'Rejected').length
  };
  document.querySelectorAll('.stat-card').forEach(card => {
    const filter = card.dataset.filter;
    const countSpan = card.querySelector('.stat-count');
    if (countSpan && stats[filter] !== undefined) countSpan.textContent = stats[filter];
  });
  document.querySelectorAll('.mobile-stat-pill').forEach(pill => {
    const filter = pill.dataset.filter;
    const countSpan = pill.querySelector('.mobile-pill-count');
    if (countSpan && stats[filter] !== undefined) countSpan.textContent = stats[filter];
  });
  document.getElementById('mobile-proposal-count').innerText = `${stats.all} total`;
  document.getElementById('proposal-count').innerText = `${stats.all} total`;
}

function updateWelcomeMessage() {
  if (!currentUser) return;
  const reviewCount = allProposals.filter(p => p.status === 'Submitted').length;
  const revisionCount = allProposals.filter(p => p.status === 'Needs Revision').length;
  const firstName = currentUser.first_name;
  document.getElementById('welcome-heading').innerHTML = `Welcome back, ${firstName} 👋`;
  document.getElementById('welcome-sub').innerHTML = `You have <strong>${reviewCount}</strong> proposal(s) awaiting adviser feedback, <strong>${revisionCount}</strong> revision requested.`;
  document.getElementById('mobile-greeting-name').innerText = firstName;
  document.getElementById('mobile-greeting-sub').innerHTML = `<strong>${reviewCount}</strong> awaiting feedback, <strong>${revisionCount}</strong> revision requested.`;
}

// ---------- Member dropdown helpers (unchanged) ----------
function getCurrentUserFullName() {
  return currentUser ? `${currentUser.first_name} ${currentUser.last_name}` : 'Student';
}
function getCurrentUserId() {
  return currentUser ? currentUser._id : '';
}

function initMembers() {
  const currentName = getCurrentUserFullName();
  const currentId = getCurrentUserId();
  members = [{ userId: currentId, name: currentName, isCurrentUser: true }];
}

function renderMembers() {
  const container = document.getElementById('members-list');
  if (!container) return;
  container.innerHTML = '';

  const allStudents = classmates.map(s => ({ id: s.id, name: s.name }));

  members.forEach((member, idx) => {
    const row = document.createElement('div');
    row.className = 'member-row';

    const select = document.createElement('select');
    select.className = 'member-select';
    if (member.isCurrentUser) {
      select.disabled = true;
      select.style.opacity = '0.6';
    }
    const currentUserId = getCurrentUserId();
    allStudents.forEach(student => {
      if (!member.isCurrentUser && student.id === currentUserId) return;
      const option = document.createElement('option');
      option.value = student.id;
      option.textContent = student.name;
      if (student.id === member.userId) option.selected = true;
      select.appendChild(option);
    });
    select.addEventListener('change', function () {
      const selectedId = this.value;
      const selectedName = allStudents.find(s => s.id === selectedId)?.name || '';
      members[idx] = { userId: selectedId, name: selectedName, isCurrentUser: false };
    });

    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-member';
    removeBtn.type = 'button';
    removeBtn.innerHTML = `<svg viewBox="0 0 14 14" fill="none"><line x1="2" y1="2" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="12" y1="2" x2="2" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
    if (member.isCurrentUser || members.length === 1) {
      removeBtn.disabled = true;
      removeBtn.style.opacity = '0.3';
    } else {
      removeBtn.addEventListener('click', () => {
        members.splice(idx, 1);
        renderMembers();
      });
    }

    const indexSpan = document.createElement('span');
    indexSpan.className = 'member-index';
    indexSpan.textContent = idx + 1;

    row.appendChild(indexSpan);
    row.appendChild(select);
    row.appendChild(removeBtn);
    container.appendChild(row);
  });

  const addBtn = document.getElementById('add-member-btn');
  const hint = document.getElementById('member-hint');
  const atMax = members.length >= MAX_MEMBERS;
  if (addBtn) addBtn.disabled = atMax;
  if (hint) hint.textContent = atMax ? `Maximum of ${MAX_MEMBERS} members reached.` : `Up to ${MAX_MEMBERS} members.`;
}

function addMember() {
  if (members.length >= MAX_MEMBERS) return;
  const selectedIds = members.map(m => m.userId);
  const available = classmates.filter(s => !selectedIds.includes(s.id) && s.id !== getCurrentUserId());
  if (available.length === 0) {
    showToast('No more classmates available to add.', 'warning');
    return;
  }
  const newMember = { userId: available[0].id, name: available[0].name, isCurrentUser: false };
  members.push(newMember);
  renderMembers();
}

// ---------- Form validation & review (unchanged) ----------
function validateStep1() {
  let valid = true;
  const titleInput = document.getElementById('proposal-title');
  const titleError = document.getElementById('title-error');
  if (!titleInput.value.trim()) {
    showError(titleInput, titleError);
    valid = false;
  } else {
    clearError(titleInput, titleError);
  }

  const abstractInput = document.getElementById('abstract');
  const abstractError = document.getElementById('abstract-error');
  if (!abstractInput || !abstractInput.value.trim()) {
    if (abstractError) showError(abstractInput, abstractError);
    valid = false;
  } else {
    if (abstractError) clearError(abstractInput, abstractError);
  }

  const otherMembers = members.filter(m => !m.isCurrentUser);
  if (otherMembers.length === 0) {
    const membersError = document.getElementById('members-error');
    if (membersError) {
      membersError.textContent = 'Please add at least one group member besides yourself.';
      membersError.classList.add('is-visible');
    }
    valid = false;
  } else {
    const membersError = document.getElementById('members-error');
    if (membersError) membersError.classList.remove('is-visible');
  }
  return valid;
}

function validateStep2() {
  const err = document.getElementById('upload-error');
  if (!uploadedFile) {
    if (err) err.classList.add('is-visible');
    return false;
  }
  if (err) err.classList.remove('is-visible');
  return true;
}

function clearError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.remove('is-error');
  if (errorEl) errorEl.classList.remove('is-visible');
}
function showError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.add('is-error');
  if (errorEl) errorEl.classList.add('is-visible');
}

function populateReview() {
  const title = document.getElementById('proposal-title').value.trim();
  const abstract = document.getElementById('abstract').value.trim();
  const memberNames = members.map(m => m.name).join(', ');
  document.getElementById('review-title').textContent = title || '—';
  document.getElementById('review-abstract').textContent = abstract || '—';
  document.getElementById('review-members').textContent = memberNames || '—';
}

// ---------- Modal navigation (unchanged) ----------
function goToStep(step) {
  document.getElementById(`step-panel-${currentStep}`).classList.remove('is-active');
  currentStep = step;
  document.getElementById(`step-panel-${step}`).classList.add('is-active');

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    if (dot) {
      dot.classList.remove('is-active', 'is-done');
      if (i < step) {
        dot.classList.add('is-done');
        dot.innerHTML = `<svg viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6"/></svg>`;
      } else if (i === step) {
        dot.classList.add('is-active');
        dot.textContent = i;
      } else {
        dot.textContent = i;
      }
    }
  }
  const connector = document.getElementById('connector-1');
  if (connector) connector.classList.toggle('is-filled', step > 1);
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.disabled = step === 1;
  const stepCounterSpan = document.getElementById('step-counter');
  if (stepCounterSpan) stepCounterSpan.textContent = `Step ${step} of ${TOTAL_STEPS}`;
  if (step === TOTAL_STEPS) {
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
      nextBtn.innerHTML = `<svg viewBox="0 0 14 14" fill="none" style="width:.875rem;height:.875rem;"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.5"/></svg> Submit`;
      nextBtn.className = 'btn-submit';
    }
    populateReview();
  } else {
    const nextBtn = document.getElementById('btn-next');
    if (nextBtn) {
      nextBtn.innerHTML = `Next <svg viewBox="0 0 14 14" fill="none" style="width:.875rem;height:.875rem;"><polyline points="5,2 10,7 5,12" stroke="currentColor" stroke-width="1.5"/></svg>`;
      nextBtn.className = 'btn-next';
    }
  }
}

function resetForm() {
  currentStep = 1;
  initMembers();
  uploadedFile = null;
  document.getElementById('success-state')?.classList.remove('is-active');
  document.getElementById('modal-footer').style.display = '';
  document.querySelector('.step-indicator').style.display = '';

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('is-active'));
  document.getElementById('step-panel-1').classList.add('is-active');

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const dot = document.getElementById(`step-dot-${i}`);
    if (dot) {
      dot.classList.remove('is-active', 'is-done');
      dot.textContent = i;
    }
  }
  const firstDot = document.getElementById('step-dot-1');
  if (firstDot) firstDot.classList.add('is-active');
  const connector = document.getElementById('connector-1');
  if (connector) connector.classList.remove('is-filled');

  document.getElementById('proposal-title').value = '';
  document.getElementById('abstract').value = '';
  const fileInput = document.getElementById('file-upload');
  if (fileInput) fileInput.value = '';
  const filePreview = document.getElementById('file-preview');
  if (filePreview) filePreview.classList.remove('is-visible');
  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) uploadZone.style.display = '';
  document.getElementById('file-name').textContent = '—';
  document.getElementById('file-size').textContent = '—';

  document.querySelectorAll('.field-error, .members-error, .upload-error').forEach(e => e.classList.remove('is-visible'));
  document.querySelectorAll('.is-error').forEach(e => e.classList.remove('is-error'));

  renderMembers();
  const backBtn = document.getElementById('btn-back');
  if (backBtn) backBtn.disabled = true;
  const nextBtn = document.getElementById('btn-next');
  if (nextBtn) {
    nextBtn.innerHTML = `Next <svg viewBox="0 0 14 14" fill="none" style="width:.875rem;height:.875rem;"><polyline points="5,2 10,7 5,12" stroke="currentColor" stroke-width="1.5"/></svg>`;
    nextBtn.className = 'btn-next';
  }
  const stepCounterSpan = document.getElementById('step-counter');
  if (stepCounterSpan) stepCounterSpan.textContent = 'Step 1 of 2';
}

function openModal() {
  resetForm();
  isResubmit = false;
  currentResubmitProposalId = null;
  document.getElementById('modal-overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('proposal-title')?.focus(), 100);
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('is-open');
  document.body.style.overflow = '';
}

// ---------- API calls ----------
async function createProposal(formData) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/proposals`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to create proposal');
  }
  return await response.json();
}

async function updateProposal(proposalId, formData) {
  const token = getToken();
  const response = await fetch(`${API_BASE}/proposals/${proposalId}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message || 'Failed to update proposal');
  }
  return await response.json();
}

async function handleSubmit() {
  if (!validateStep2()) return;

  const formData = new FormData();
  formData.append('title', document.getElementById('proposal-title').value.trim());
  formData.append('abstract', document.getElementById('abstract').value.trim());
  const memberIds = members.map(m => m.userId);
  formData.append('members', JSON.stringify(memberIds));
  if (uploadedFile) {
    formData.append('file', uploadedFile);
  }

  try {
    if (isResubmit && currentResubmitProposalId) {
      await updateProposal(currentResubmitProposalId, formData);
      showToast('Proposal resubmitted successfully!', 'success');
    } else {
      await createProposal(formData);
      showToast('Proposal submitted successfully!', 'success');
    }
    await loadCurrentUser();
    await loadProposals();
    closeModal();
  } catch (err) {
    console.error(err);
    showToast(err.message, 'error');
  }
}

// ---------- View proposal modal ----------
function openProposalViewModal(proposal) {
  document.getElementById('modal-title-text').textContent = proposal.title;
  document.getElementById('view-prop-title').textContent = proposal.title;
  const membersStr = proposal.members ? proposal.members.map(m => m.name).join(', ') : 'No members';
  document.getElementById('view-group').innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${escapeHtml(membersStr)}`;
  const adviserName = proposal.adviser ? proposal.adviser.name : 'Not assigned';
  document.getElementById('view-professor').innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${escapeHtml(adviserName)}`;
  document.getElementById('view-date').innerHTML = `<svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg> Submitted ${new Date(proposal.submissionDate).toLocaleDateString()}`;
  const statusClass = proposal.status.toLowerCase().replace(' ', '-');
  const badge = document.getElementById('view-badge');
  badge.className = `status-badge ${statusClass}`;
  badge.textContent = proposal.status;
  document.getElementById('view-doc-name').textContent = proposal.file ? proposal.file : 'No document attached';
  document.getElementById('view-doc-size').textContent = proposal.file ? proposal.file.split('.').pop().toUpperCase() : '';
  document.getElementById('view-abstract').textContent = proposal.abstract || 'No abstract provided.';
  const prevFeedbackDiv = document.getElementById('view-previous-feedback');
  if (/* proposal.status === 'Needs Revision' &&  */proposal.feedback && proposal.feedback.length) {
    const lastFeedback = proposal.feedback[proposal.feedback.length - 1];
    document.getElementById('view-feedback-text').textContent = lastFeedback.comment;
    prevFeedbackDiv.style.display = 'block';
  } else {
    prevFeedbackDiv.style.display = 'none';
  }
  document.getElementById('view-download-btn').onclick = () => {
    if (proposal.file) {
      window.open(`${window.location.origin}/uploads/proposals/${proposal.file}`, '_blank');
    } else {
      alert('No document attached.');
    }
  };

  const resubmitBtnDiv = document.querySelector('.resubmit-btn');
  if (proposal.status === 'Needs Revision') {
    resubmitBtnDiv.innerHTML = `<button class="btn btn-primary" id="resubmitFromViewBtn">Resubmit Proposal</button>`;
    document.getElementById('resubmitFromViewBtn').onclick = () => {
      closeViewModal();
      openResubmitModal(proposal);
    };
  } else {
    resubmitBtnDiv.innerHTML = '';
  }

  document.getElementById('proposal-view-modal').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeViewModal() {
  document.getElementById('proposal-view-modal').classList.remove('is-open');
  document.body.style.overflow = '';
}

function openResubmitModal(proposal) {
  isResubmit = true;
  currentResubmitProposalId = proposal._id;

  document.getElementById('proposal-title').value = proposal.title;
  document.getElementById('abstract').value = proposal.abstract || '';

  if (proposal.members && proposal.members.length) {
    const currentId = getCurrentUserId();
    members = proposal.members.map(m => ({
      userId: m.user_id,
      name: m.name,
      isCurrentUser: (m.user_id === currentId)
    }));
    const currentIndex = members.findIndex(m => m.isCurrentUser);
    if (currentIndex > 0) {
      const [current] = members.splice(currentIndex, 1);
      members.unshift(current);
    }
    renderMembers();
  } else {
    initMembers();
    renderMembers();
  }

  uploadedFile = null;
  const fileInput = document.getElementById('file-upload');
  if (fileInput) fileInput.value = '';
  const filePreview = document.getElementById('file-preview');
  if (filePreview) filePreview.classList.remove('is-visible');
  const uploadZone = document.getElementById('upload-zone');
  if (uploadZone) uploadZone.style.display = '';
  document.getElementById('file-name').textContent = '—';
  document.getElementById('file-size').textContent = '—';

  resetForm();
  document.getElementById('proposal-title').value = proposal.title;
  document.getElementById('abstract').value = proposal.abstract || '';
  document.getElementById('modal-overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

// ---------- File upload handling ----------
function handleFile(file) {
  ['upload-error', 'upload-type-error', 'upload-size-error'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('is-visible');
  });
  if (!file) return;
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (!allowedTypes.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
    document.getElementById('upload-type-error')?.classList.add('is-visible');
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    document.getElementById('upload-size-error')?.classList.add('is-visible');
    return;
  }
  uploadedFile = file;
  document.getElementById('file-name').textContent = file.name;
  document.getElementById('file-size').textContent = (file.size / 1024).toFixed(1) + ' KB · ' + file.name.split('.').pop().toUpperCase();
  document.getElementById('file-preview').classList.add('is-visible');
  document.getElementById('upload-zone').style.display = 'none';
  populateReview();
}

// ---------- Filtering ----------
function applyFilters() {
  renderDesktop();
}
function applyMobileFilters() {
  renderMobile();
}

// ---------- Logout ----------
function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.href = './index.html';
}

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', async () => {
  initHamburger();
  try {
    await loadCurrentUser();
    if (!currentUser) {
      window.location.href = 'login_page.html';
      return;
    }
    await loadClassmates();
    await loadAdviser();
    await loadProposals();

    initMembers();
    renderMembers();
    initHamburger();

    // Modal event listeners
    document.querySelectorAll('.open-modal-btn').forEach(btn => btn.addEventListener('click', openModal));
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.getElementById('btn-done')?.addEventListener('click', closeModal);
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('modal-overlay')) closeModal();
    });
    document.getElementById('btn-back')?.addEventListener('click', () => {
      if (currentStep > 1) goToStep(currentStep - 1);
    });
    document.getElementById('btn-next')?.addEventListener('click', () => {
      if (currentStep === 1 && validateStep1()) goToStep(2);
      else if (currentStep === 2 && validateStep2()) handleSubmit();
    });

    // File upload
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-upload');
    uploadZone?.addEventListener('click', (e) => {
      if (e.target !== fileInput) fileInput?.click();
    });
    uploadZone?.addEventListener('dragover', e => { e.preventDefault(); uploadZone.classList.add('drag-over'); });
    uploadZone?.addEventListener('dragleave', () => uploadZone.classList.remove('drag-over'));
    uploadZone?.addEventListener('drop', e => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });
    fileInput?.addEventListener('change', e => { if (e.target.files[0]) handleFile(e.target.files[0]); });
    document.getElementById('remove-file')?.addEventListener('click', () => {
      uploadedFile = null;
      fileInput.value = '';
      document.getElementById('file-preview')?.classList.remove('is-visible');
      document.getElementById('upload-zone').style.display = '';
      document.getElementById('file-name').textContent = '—';
      document.getElementById('file-size').textContent = '—';
    });

    // Add member button
    document.getElementById('add-member-btn')?.addEventListener('click', addMember);

    // Filtering (desktop)
    const statCards = document.querySelectorAll('.stat-card');
    const searchInput = document.getElementById('search-input');
    statCards.forEach(card => {
      card.addEventListener('click', () => {
        statCards.forEach(c => c.classList.remove('is-active'));
        card.classList.add('is-active');
        activeFilter = card.dataset.filter;
        applyFilters();
      });
    });
    searchInput?.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      applyFilters();
    });

    // Mobile filtering
    const mobilePills = document.querySelectorAll('.mobile-stat-pill');
    const mobileSearch = document.getElementById('mobile-search');
    mobilePills.forEach(pill => {
      pill.addEventListener('click', () => {
        mobilePills.forEach(p => p.classList.remove('is-active'));
        pill.classList.add('is-active');
        mobileFilter = pill.dataset.filter;
        applyMobileFilters();
      });
    });
    mobileSearch?.addEventListener('input', () => {
      mobileQuery = mobileSearch.value.trim().toLowerCase();
      applyMobileFilters();
    });

    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);

  } catch (err) {
    console.error('Initialization failed:', err);
    showToast('Failed to load dashboard. Please refresh.', 'error');
  }
});