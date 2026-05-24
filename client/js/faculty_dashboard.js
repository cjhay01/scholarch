// faculty_dashboard.js 
let currentUser = null;
let allProposals = [];
let activeFilter = 'all';
let searchQuery = '';
let currentModalProposal = null;
let proposalModal, historyModal, closeModalBtn, addFeedbackOnlyBtn, rejectBtn, revisionBtn, approveBtn, viewHistoryBtn, closeHistoryModalBtn;

// ---------- Load current user from API (refresh localStorage) ----------
async function loadCurrentUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 401) {
      clearAuthAndRedirect();
      return null;
    }
    if (!response.ok) throw new Error('Failed to fetch user');
    const user = await response.json();
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  } catch (err) {
    console.error('Failed to load user from API:', err);
    // Fallback to stored user
    const stored = getUser();
    if (stored) {
      currentUser = stored;
      showToast('Using cached profile', 'warning');
      return stored;
    }
    return null;
  }
}

// Map backend status to frontend class
function mapStatusClass(status) {
  const map = {
    'To Be Reviewed': 'review',
    'Needs Revision': 'revision',
    'Approved': 'approved',
    'Rejected': 'rejected',
    'Submitted': 'review',
    'Completed': 'approved'
  };
  return map[status] || 'review';
}

function mapStatusLabel(status) {
  const map = {
    'To Be Reviewed': 'To Be Reviewed',
    'Needs Revision': 'Revision Requested',
    'Approved': 'Approved',
    'Rejected': 'Rejected',
    'Submitted': 'Submitted'
  };
  return map[status] || status;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString();
}

// ---------- Render desktop proposals grid ----------
function renderDesktop() {
  const grid = document.getElementById('proposalsGrid');
  if (!grid) return;
  let filtered = allProposals.filter(p => {
    const statusMatch = activeFilter === 'all' || mapStatusClass(p.status) === activeFilter;
    const searchMatch = !searchQuery || p.title.toLowerCase().includes(searchQuery) ||
      (p.members && p.members.some(m => (m.first_name + ' ' + m.last_name).toLowerCase().includes(searchQuery))) ||
      (p.abstract && p.abstract.toLowerCase().includes(searchQuery));
    return statusMatch && searchMatch;
  });
  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state"><svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/><line x1="8" y1="9" x2="18" y2="9" stroke="currentColor" stroke-width="1.3"/><line x1="8" y1="13" x2="18" y2="13" stroke="currentColor" stroke-width="1.3"/><line x1="8" y1="17" x2="14" y2="17" stroke="currentColor" stroke-width="1.3"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p></div>`;
    document.getElementById('desktopCountTotal').innerText = '0 total';
    return;
  }
  grid.innerHTML = filtered.map(p => {
    const statusClass = mapStatusClass(p.status);
    const statusLabel = mapStatusLabel(p.status);
    const membersStr = p.members ? p.members.map(m => m.first_name + ' ' + m.last_name).join(', ') : 'No members';
    return `
      <article class="proposal-card" data-id="${p._id}" data-status="${statusClass}">
        <div class="card-stripe ${statusClass}"></div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${escapeHtml(p.title)}</h3>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="card-meta">
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg>${escapeHtml(membersStr)}</span>
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg>Submitted ${formatDate(p.submissionDate)}</span>
          </div>
        </div>
        <div class="card-footer">
          <span class="card-date">${formatDate(p.submissionDate)}</span>
          <button class="card-action view-proposal" data-id="${p._id}">View →</button>
        </div>
      </article>
    `;
  }).join('');
  document.getElementById('desktopCountTotal').innerText = `${filtered.length} total`;
  attachViewHandlers();
}

// ---------- Render mobile proposals list ----------
function renderMobile() {
  const list = document.getElementById('mobileProposalsList');
  if (!list) return;
  let filtered = allProposals.filter(p => {
    const statusMatch = activeFilter === 'all' || mapStatusClass(p.status) === activeFilter;
    const searchMatch = !searchQuery || p.title.toLowerCase().includes(searchQuery) ||
      (p.members && p.members.some(m => (m.first_name + ' ' + m.last_name).toLowerCase().includes(searchQuery))) ||
      (p.abstract && p.abstract.toLowerCase().includes(searchQuery));
    return statusMatch && searchMatch;
  });
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><svg viewBox="0 0 32 32" fill="none"><rect x="4" y="3" width="18" height="24" rx="2" stroke="currentColor" stroke-width="1.5"/></svg><p class="empty-heading">No proposals found</p><p>Try adjusting your filter or search.</p></div>`;
    document.getElementById('mobileCountTotal').innerText = '0 total';
    return;
  }
  list.innerHTML = filtered.map(p => {
    const statusClass = mapStatusClass(p.status);
    const statusLabel = mapStatusLabel(p.status);
    const membersStr = p.members ? p.members.map(m => m.first_name + ' ' + m.last_name).join(', ') : 'No members';
    return `
      <article class="mobile-card" data-id="${p._id}" data-status="${statusClass}">
        <div class="card-stripe ${statusClass}"></div>
        <div class="mobile-card-inner">
          <div class="mobile-card-top">
            <h3 class="mobile-card-title">${escapeHtml(p.title)}</h3>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="mobile-card-meta">
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg>${escapeHtml(membersStr)}</span>
            <span class="meta-row"><svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg>Submitted ${formatDate(p.submissionDate)}</span>
          </div>
          <div class="mobile-card-footer">
            <span class="mobile-card-date">${formatDate(p.submissionDate)}</span>
            <button class="mobile-card-action view-proposal" data-id="${p._id}">View →</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
  document.getElementById('mobileCountTotal').innerText = `${filtered.length} total`;
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
  if (proposal) openProposalModal(proposal);
}

function updateStats() {
  const stats = {
    all: allProposals.length,
    review: allProposals.filter(p => p.status === 'To Be Reviewed' || p.status === 'Submitted').length,
    revision: allProposals.filter(p => p.status === 'Needs Revision').length,
    approved: allProposals.filter(p => p.status === 'Approved' || p.status === 'Completed').length,
    rejected: allProposals.filter(p => p.status === 'Rejected').length
  };
  document.getElementById('statAll').innerText = stats.all;
  document.getElementById('statReview').innerText = stats.review;
  document.getElementById('statRevision').innerText = stats.revision;
  document.getElementById('statApproved').innerText = stats.approved;
  document.getElementById('statRejected').innerText = stats.rejected;
  // mobile counts
  document.getElementById('mobileCountAll').innerText = stats.all;
  document.getElementById('mobileCountReview').innerText = stats.review;
  document.getElementById('mobileCountRevision').innerText = stats.revision;
  document.getElementById('mobileCountApproved').innerText = stats.approved;
  document.getElementById('mobileCountRejected').innerText = stats.rejected;

  // Update welcome messages with the computed stats
  if (currentUser) {
    document.getElementById('welcomeHeading').innerText = `Welcome back, ${currentUser.name || 'Faculty'} 👋`;
    document.getElementById('welcomeSub').innerHTML = `You have <strong>${stats.review}</strong> proposals awaiting your review, <strong>${stats.revision}</strong> revision requested.`;
    document.getElementById('mobileGreetingName').innerText = currentUser.name || 'Faculty';
    document.getElementById('mobileGreetingSub').innerHTML = `<strong>${stats.review}</strong> awaiting review, <strong>${stats.revision}</strong> revision requested.`;
  }
}

async function loadProposals() {
  const token = getToken();
  if (!token) {
    showToast('Not authenticated. Please log in.', 'error');
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/proposals`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 401) {
      clearAuthAndRedirect();
      return;
    }
    if (!response.ok) throw new Error('Failed to fetch proposals');
    const data = await response.json();
    allProposals = data;
    renderDesktop();
    renderMobile();
    updateStats(); // this also updates the welcome message
  } catch (err) {
    console.error(err);
    showToast('Failed to load proposals', 'error');
  }
}



function openProposalModal(proposal) {
  currentModalProposal = proposal;
  document.getElementById('modalTitle').innerText = proposal.title;
  document.getElementById('modalPropTitle').innerText = proposal.title;
  const membersStr = proposal.members ? proposal.members.map(m => m.first_name + ' ' + m.last_name).join(', ') : 'No members';
  document.getElementById('modalGroup').innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${escapeHtml(membersStr)}`;
  document.getElementById('modalDate').innerHTML = `<svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg> Submitted ${formatDate(proposal.submissionDate)}`;
  const statusClass = mapStatusClass(proposal.status);
  const statusLabel = mapStatusLabel(proposal.status);
  const badge = document.getElementById('modalBadge');
  badge.className = `status-badge ${statusClass}`;
  badge.textContent = statusLabel;
  document.getElementById('modalAbstract').innerText = proposal.abstract || 'No abstract provided.';

  // File download
  if (proposal.file) {
    document.getElementById('modalFileLabel').innerText = proposal.file;
    document.getElementById('modalFileSub').innerText = 'Click to download';
    const downloadBtn = document.getElementById('modalDownloadBtn');
    downloadBtn.style.display = 'flex';
    downloadBtn.onclick = () => {
      window.open(`${API_BASE}/uploads/${proposal.file}`, '_blank');
    };
  } else {
    document.getElementById('modalFileLabel').innerText = 'No document attached';
    document.getElementById('modalFileSub').innerText = '';
    document.getElementById('modalDownloadBtn').style.display = 'none';
  }

  // Previous feedback (only if status is Needs Revision)
  const prevContainer = document.getElementById('previousFeedbackContainer');
  if (proposal.status === 'Needs Revision' && proposal.feedback && proposal.feedback.length) {
    const lastFeedback = proposal.feedback[proposal.feedback.length - 1];
    document.getElementById('previousFeedbackText').innerText = lastFeedback.comment;
    prevContainer.style.display = 'block';
  } else {
    prevContainer.style.display = 'none';
  }

  document.getElementById('newFeedbackText').value = '';

  addFeedbackOnlyBtn.onclick = () => addFeedbackOnly(proposal._id);
  rejectBtn.onclick = () => changeProposalStatus(proposal._id, 'Rejected');
  revisionBtn.onclick = () => changeProposalStatus(proposal._id, 'Needs Revision');
  approveBtn.onclick = () => changeProposalStatus(proposal._id, 'Approved');
  viewHistoryBtn.onclick = () => openFeedbackHistoryModal(proposal);

  proposalModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  proposalModal.classList.remove('is-open');
  document.body.style.overflow = '';
}

async function addFeedbackOnly(proposalId) {
  const comment = document.getElementById('newFeedbackText').value.trim();
  if (!comment) {
    showToast('Please enter feedback before submitting.', 'error');
    return;
  }
  const token = getToken();
  try {
    const response = await fetch(`${API_BASE}/proposals/${proposalId}/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ comment })
    });
    if (response.status === 401) {
      clearAuthAndRedirect();
      return;
    }
    if (!response.ok) throw new Error('Failed to add feedback');
    showToast('Feedback added successfully', 'success');
    closeModal();
    await loadProposals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function changeProposalStatus(proposalId, newStatus) {
  const comment = document.getElementById('newFeedbackText').value.trim();
  const token = getToken();
  try {
    if (comment) {
      const feedbackRes = await fetch(`${API_BASE}/proposals/${proposalId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ comment })
      });
      if (feedbackRes.status === 401) {
        clearAuthAndRedirect();
        return;
      }
      if (!feedbackRes.ok) throw new Error('Failed to add feedback');
    }
    const statusRes = await fetch(`${API_BASE}/proposals/${proposalId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    if (statusRes.status === 401) {
      clearAuthAndRedirect();
      return;
    }
    if (!statusRes.ok) throw new Error('Failed to update status');
    showToast(`Status changed to ${newStatus}`, 'success');
    closeModal();
    await loadProposals();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openFeedbackHistoryModal(proposal) {
  document.getElementById('historyModalTitle').innerText = `Feedback History: ${proposal.title}`;
  const container = document.getElementById('feedbackList');
  if (!proposal.feedback || proposal.feedback.length === 0) {
    container.innerHTML = '<p class="empty-state">No feedback yet.</p>';
  } else {
    container.innerHTML = proposal.feedback.map(f => `
      <div class="previous-feedback" style="margin-bottom: 0.75rem;">
        <div class="previous-feedback-label">${f.reviewer ? f.reviewer.first_name + ' ' + f.reviewer.last_name : 'Reviewer'} · ${new Date(f.createdAt).toLocaleString()}</div>
        <div class="previous-feedback-text">${escapeHtml(f.comment)}</div>
      </div>
    `).join('');
  }
  historyModal.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

function closeHistoryModal() {
  historyModal.classList.remove('is-open');
  document.body.style.overflow = '';
}

// ---------- Login state UI ----------
async function renderAuthUI() {
  currentUser = await loadCurrentUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');
  const mobileAvatar = document.getElementById('mobileAvatar');

  if (currentUser) {
    const name = currentUser.name || currentUser.first_name + ' ' + currentUser.last_name || 'Faculty';
    const role = currentUser.role || 'Faculty';
    const initial = name.charAt(0).toUpperCase();

    if (authSection) {
      authSection.innerHTML = `
        <div class="avatar-circle">${initial}</div>
        <div class="sidebar-user-info">
          <div class="sidebar-user-name">${escapeHtml(name)}</div>
          <div class="sidebar-user-role">${escapeHtml(role)}</div>
        </div>
        <button class="btn-icon" id="desktopLogoutBtn">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M10 2h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <line x1="7" y1="8" x2="14" y2="8" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <polyline points="11,5 14,8 11,11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      `;
      document.getElementById('desktopLogoutBtn')?.addEventListener('click', clearAuthAndRedirect);
    }

    if (topbarAuth) {
      topbarAuth.innerHTML = `
        <button class="btn-notif"><svg viewBox="0 0 18 18" fill="none"><path d="M9 1.5A5.5 5.5 0 0 0 3.5 7v3.5L2 12h14l-1.5-1.5V7A5.5 5.5 0 0 0 9 1.5Z" stroke="currentColor" stroke-width="1.4"/><path d="M7 12.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg><span class="notif-badge"></span></button>
        <button class="avatar-btn">${initial}</button>
      `;
    }

    if (mobileAuth) {
      mobileAuth.innerHTML = `<a href="#" id="mobileLogoutBtn" class="btn-nav-auth">Log out</a>`;
      document.getElementById('mobileLogoutBtn')?.addEventListener('click', clearAuthAndRedirect);
    }

    if (mobileAvatar) mobileAvatar.textContent = initial;
  } else {
    if (authSection) {
      authSection.innerHTML = '<a href="./login_page.html" class="login-btn">Log in</a>';
    }
    if (topbarAuth) {
      topbarAuth.innerHTML = '<a href="./login_page.html" class="topbar-login-btn">Log in</a>';
    }
    if (mobileAuth) {
      mobileAuth.innerHTML = '<a href="./login_page.html" class="btn-nav-auth">Log in</a>';
    }
  }
}

// ---------- Filtering and search ----------
function initFilters() {
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('is-active'));
      card.classList.add('is-active');
      activeFilter = card.getAttribute('data-filter');
      renderDesktop();
      renderMobile();
    });
  });
  const desktopSearch = document.getElementById('desktopSearch');
  if (desktopSearch) {
    desktopSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderDesktop();
      renderMobile();
    });
  }
  document.querySelectorAll('.mobile-stat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.mobile-stat-pill').forEach(p => p.classList.remove('is-active'));
      pill.classList.add('is-active');
      activeFilter = pill.getAttribute('data-filter');
      renderDesktop();
      renderMobile();
    });
  });
  const mobileSearch = document.getElementById('mobileSearch');
  if (mobileSearch) {
    mobileSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value.toLowerCase();
      renderDesktop();
      renderMobile();
    });
  }
}
// ---------- Modal close handlers ----------

// ---------- Initialize ----------
document.addEventListener('DOMContentLoaded', async () => {
  // ---------- Modal logic ----------
  proposalModal = document.getElementById('proposalModal');
  closeModalBtn = document.getElementById('closeModalBtn');
  addFeedbackOnlyBtn = document.getElementById('addFeedbackOnlyBtn');
  rejectBtn = document.getElementById('rejectBtn');
  revisionBtn = document.getElementById('revisionBtn');
  approveBtn = document.getElementById('approveBtn');
  viewHistoryBtn = document.getElementById('viewHistoryBtn');
  historyModal = document.getElementById('historyModal');
  closeHistoryModalBtn = document.getElementById('closeHistoryModalBtn');
  closeModalBtn.addEventListener('click', closeModal);
  proposalModal.addEventListener('click', (e) => { if (e.target === proposalModal) closeModal(); });
  closeHistoryModalBtn.addEventListener('click', closeHistoryModal);
  historyModal.addEventListener('click', (e) => { if (e.target === historyModal) closeHistoryModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeHistoryModal();
    }
  });
  initHamburger();
  await renderAuthUI();
  if (!currentUser) {
    document.getElementById('proposalsGrid').innerHTML = '<div class="empty-state"><p>Please log in to view proposals.</p></div>';
    document.getElementById('mobileProposalsList').innerHTML = '<div class="empty-state"><p>Please log in to view proposals.</p></div>';
    return;
  }
  await loadProposals();
  initFilters();
});