// admin_manage_archive.js – dynamic admin archive management (with logout confirmation)

// ---------- Logout confirmation modal ----------
function showLogoutModal() {
  document.getElementById('logoutModal').classList.add('is-open');
}

function hideLogoutModal() {
  document.getElementById('logoutModal').classList.remove('is-open');
}

// ---------- Auth & role check ----------
function renderAuthUI() {
  const user = getUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');
  const mobileAvatar = document.getElementById('mobileAvatar');

  // Admin only
  if (!user || user.role !== 'admin') {
    window.location.href = './login_page.html';
    return;
  }

  const name = user.name || 'Admin';
  const role = user.role || 'Administrator';
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
    document.getElementById('desktopLogoutBtn')?.addEventListener('click', showLogoutModal);
  }

  if (topbarAuth) {
    topbarAuth.innerHTML = `
      <svg viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5A5.5 5.5 0 0 0 3.5 7v3.5L2 12h14l-1.5-1.5V7A5.5 5.5 0 0 0 9 1.5Z" stroke="currentColor" stroke-width="1.4"/>
        <path d="M7 12.5a2 2 0 0 0 4 0" stroke="currentColor"/>
      </svg>
      <button class="avatar-btn">${initial}</button>
    `;
  }

  if (mobileAuth) {
    mobileAuth.innerHTML = `<a href="#" id="mobileLogoutBtn" class="btn-nav-auth">Log out</a>`;
    document.getElementById('mobileLogoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      showLogoutModal();
    });
  }

  if (mobileAvatar) mobileAvatar.textContent = initial;
}

// ---------- Data fetching ----------
let proposals = [];       // raw data from API
let users = [];          // for member/adviser selection

async function fetchProposals() {
  const token = getToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  try {
    const res = await fetch(`${API_BASE}/proposals`, { headers });
    if (!res.ok) throw new Error('Failed to fetch proposals');
    const data = await res.json();
    proposals = data.map(p => ({
      ...p,
      id: p._id,
      authors: p.members ? p.members.map(m => m.name).join(', ') : 'Unknown',
      professor: p.adviser ? p.adviser.name : 'Not assigned',
      year: p.approvalDate ? new Date(p.approvalDate).getFullYear() : new Date(p.submissionDate).getFullYear(),
      date: p.approvalDate
        ? new Date(p.approvalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : new Date(p.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    }));
  } catch (err) {
    console.error(err);
    proposals = [];
  }
}

async function fetchUsers() {
  const token = getToken();
  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
  try {
    const res = await fetch(`${API_BASE}/users`, { headers });
    if (!res.ok) throw new Error('Failed to fetch users');
    users = await res.json();
  } catch (err) {
    console.error(err);
    users = [];
  }
}

// ---------- Rendering ----------
function buildUserSelectOptions(selectedIds = []) {
  return users.map(u => `
    <option value="${u._id}" ${selectedIds.includes(u._id) ? 'selected' : ''}>
      ${escapeHtml(u.name)} (${u.role})
    </option>
  `).join('');
}

function openStudyModal(editId = null) {
  const modal = document.getElementById('studyModal');
  const modalTitle = document.getElementById('modalTitle');
  const membersSelect = document.getElementById('studyMembers');
  const adviserSelect = document.getElementById('studyAdviser');

  if (membersSelect) membersSelect.innerHTML = buildUserSelectOptions();
  if (adviserSelect) adviserSelect.innerHTML = '<option value="">-- Select Adviser --</option>' + buildUserSelectOptions();

  if (editId) {
    const proposal = proposals.find(p => p._id === editId);
    if (proposal) {
      modalTitle.textContent = 'Edit Study (BSIT)';
      document.getElementById('studyTitle').value = proposal.title;
      const memberIds = proposal.members ? proposal.members.map(m => typeof m === 'object' ? m._id : m) : [];
      if (membersSelect) {
        [...membersSelect.options].forEach(opt => {
          opt.selected = memberIds.includes(opt.value);
        });
      }
      const adviserId = proposal.adviser && typeof proposal.adviser === 'object' ? proposal.adviser._id : proposal.adviser;
      if (adviserSelect) adviserSelect.value = adviserId || '';

      document.getElementById('studyYear').value = proposal.year || new Date().getFullYear();
      document.getElementById('studyDate').value = proposal.date || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      document.getElementById('studyAbstract').value = proposal.abstract || '';
      modal.dataset.editId = editId;
    }
  } else {
    modalTitle.textContent = 'Add New Study (BSIT)';
    document.getElementById('studyTitle').value = '';
    if (membersSelect) [...membersSelect.options].forEach(opt => opt.selected = false);
    if (adviserSelect) adviserSelect.value = '';
    document.getElementById('studyYear').value = new Date().getFullYear();
    document.getElementById('studyDate').value = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('studyAbstract').value = '';
    delete modal.dataset.editId;
  }

  modal.classList.add('is-open');
}

function closeStudyModal() {
  document.getElementById('studyModal').classList.remove('is-open');
}

async function saveStudy() {
  const title = document.getElementById('studyTitle').value.trim();
  const membersSelect = document.getElementById('studyMembers');
  const adviserSelect = document.getElementById('studyAdviser');
  const year = parseInt(document.getElementById('studyYear').value);
  const dateStr = document.getElementById('studyDate').value.trim();
  const abstract = document.getElementById('studyAbstract').value.trim();

  if (!title || !membersSelect || !adviserSelect || !year || !dateStr) {
    alert('Please fill all required fields.');
    return;
  }

  const selectedMemberIds = [...membersSelect.selectedOptions].map(opt => opt.value);
  const adviserId = adviserSelect.value;

  if (selectedMemberIds.length === 0 || !adviserId) {
    alert('Please select at least one member and an adviser.');
    return;
  }

  const body = {
    title,
    members: selectedMemberIds,
    adviser: adviserId,
    abstract,
    submissionDate: new Date(dateStr).toISOString(),
    approvalDate: new Date(dateStr).toISOString(),
    status: 'Approved'
  };

  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    let res;
    const editId = document.getElementById('studyModal').dataset.editId;
    if (editId) {
      res = await fetch(`${API_BASE}/proposals/${editId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(body)
      });
    } else {
      res = await fetch(`${API_BASE}/proposals`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      });
    }
    if (!res.ok) throw new Error('Failed to save study');
    closeStudyModal();
    await fetchProposals();
    renderLists();
  } catch (err) {
    console.error(err);
    alert('Error saving study. Check console.');
  }
}

// ---------- Delete ----------
let deleteTargetId = null;

function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').classList.add('is-open');
}

function cancelDelete() {
  deleteTargetId = null;
  document.getElementById('deleteModal').classList.remove('is-open');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/proposals/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Delete failed');
    deleteTargetId = null;
    document.getElementById('deleteModal').classList.remove('is-open');
    await fetchProposals();
    renderLists();
  } catch (err) {
    console.error(err);
    alert('Error deleting study.');
  }
}

// ---------- List rendering (client‑side filters) ----------
function getFilteredSortedStudies() {
  const searchInput = document.getElementById('desktopSearch')?.value.toLowerCase() || '';
  const yearFilter = document.getElementById('desktopYearFilter')?.value || '';
  const sort = document.getElementById('desktopSort')?.value || 'newest';

  let filtered = [...proposals];

  if (yearFilter) filtered = filtered.filter(s => s.year === parseInt(yearFilter));
  if (searchInput) {
    filtered = filtered.filter(s =>
      s.title.toLowerCase().includes(searchInput) ||
      s.authors.toLowerCase().includes(searchInput) ||
      s.professor.toLowerCase().includes(searchInput)
    );
  }

  if (sort === 'oldest') filtered.sort((a, b) => a.year - b.year);
  else if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  else filtered.sort((a, b) => b.year - a.year);

  return filtered;
}

function renderListContainer(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (data.length === 0) {
    container.innerHTML = '<div class="empty-state">No studies found.</div>';
    return;
  }
  container.innerHTML = data.map((s, idx) => `
    <div class="list-card" data-id="${s._id}">
      <div class="list-card-index">${String(idx+1).padStart(2,'0')}</div>
      <div class="list-card-body">
        <div class="list-card-top">
          <h3 class="list-card-title">${escapeHtml(s.title)}</h3>
        </div>
        <p class="list-card-abstract">${escapeHtml(s.abstract)}</p>
        <div class="list-card-meta">
          <span>${escapeHtml(s.authors)}</span>
          <span>${escapeHtml(s.professor)}</span>
          <span>${s.date} (${s.year})</span>
        </div>
      </div>
      <div class="list-card-actions">
        <button class="edit-study-btn" data-id="${s._id}">Edit</button>
        <button class="delete-study-btn" data-id="${s._id}">Delete</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.edit-study-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openStudyModal(btn.dataset.id); };
  });
  container.querySelectorAll('.delete-study-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openDeleteModal(btn.dataset.id); };
  });
}

function applyDesktopFilters() {
  const filtered = getFilteredSortedStudies();
  document.getElementById('desktopCount').innerHTML = `<strong>${filtered.length}</strong> result${filtered.length !== 1 ? 's' : ''}`;
  renderListContainer('desktopListView', filtered);
}

function applyMobileFilters() {
  const year = document.getElementById('mobileYearFilter')?.value || '';
  const sort = document.getElementById('mobileSort')?.value || 'newest';
  let filtered = [...proposals];
  if (year) filtered = filtered.filter(s => s.year === parseInt(year));
  if (sort === 'oldest') filtered.sort((a, b) => a.year - b.year);
  else if (sort === 'title') filtered.sort((a, b) => a.title.localeCompare(b.title));
  else filtered.sort((a, b) => b.year - a.year);

  document.getElementById('mobileCount').innerHTML = `<strong>${filtered.length}</strong> result${filtered.length !== 1 ? 's' : ''}`;
  renderListContainer('mobileListView', filtered);
}

function renderLists() {
  const container = document.getElementById('desktopArchiveContainer');
  const mobileContainer = document.getElementById('mobileArchiveContainer');
  if (!container) return;

  const years = [...new Set(proposals.map(s => s.year))].sort((a,b)=>b-a);
  const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');

  container.innerHTML = `
    <section class="archive-hero">
      <h1 class="hero-heading">Manage <em>Archived</em> Studies (BSIT)</h1>
      <p class="hero-sub">Add, edit, or remove research entries in the BSIT repository.</p>
      <div class="search-bar">
        <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="text" placeholder="Search by title, author, professor..." id="desktopSearch"></div>
        <button class="search-btn" id="desktopSearchBtn">Search</button>
      </div>
      <div class="hero-stats"><div class="stat"><strong>${proposals.length}</strong> total studies</div><div class="stat"><strong>${years.length}</strong> years</div></div>
    </section>
    <div class="filter-row">
      <span class="filter-label">Filter by:</span>
      <select class="select-filter" id="desktopYearFilter">
        <option value="">All Years</option>
        ${yearOptions}
      </select>
      <select class="select-filter" id="desktopSort">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="title">A–Z by Title</option>
      </select>
      <div class="spacer"></div>
      <button class="add-btn" id="addStudyBtnDesktop">+ New Study</button>
    </div>
    <div class="results-info"><span class="results-count" id="desktopCount"><strong>${proposals.length}</strong> results</span></div>
    <div class="list-view" id="desktopListView"></div>
  `;

  if (mobileContainer) {
    const mobileYears = [...new Set(proposals.map(s=>s.year))].sort((a,b)=>b-a);
    const mobileYearOptions = mobileYears.map(y=>`<option value="${y}">${y}</option>`).join('');
    mobileContainer.innerHTML = `
      <div class="filter-row">
        <select class="select-filter" id="mobileYearFilter"><option value="">All Years</option>${mobileYearOptions}</select>
        <select class="select-filter" id="mobileSort"><option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="title">A–Z</option></select>
        <button class="add-btn" id="addStudyBtnMobile">+ New</button>
      </div>
      <div class="results-info"><span class="results-count" id="mobileCount"><strong>${proposals.length}</strong> results</span></div>
      <div class="list-view" id="mobileListView"></div>
    `;
    attachMobileEvents();
  }
  attachDesktopEvents();
  applyDesktopFilters();
}

function attachDesktopEvents() {
  document.getElementById('desktopSearchBtn')?.addEventListener('click', () => applyDesktopFilters());
  document.getElementById('desktopSearch')?.addEventListener('keyup', (e) => { if(e.key==='Enter') applyDesktopFilters(); });
  document.getElementById('desktopYearFilter')?.addEventListener('change', () => applyDesktopFilters());
  document.getElementById('desktopSort')?.addEventListener('change', () => applyDesktopFilters());
  document.getElementById('addStudyBtnDesktop')?.addEventListener('click', () => openStudyModal());
}

function attachMobileEvents() {
  document.getElementById('mobileYearFilter')?.addEventListener('change', () => applyMobileFilters());
  document.getElementById('mobileSort')?.addEventListener('change', () => applyMobileFilters());
  document.getElementById('addStudyBtnMobile')?.addEventListener('click', () => openStudyModal());
}

// ---------- Modal HTML modifications ----------
function updateModalFields() {
  const modal = document.getElementById('studyModal');
  if (!modal) return;
  modal.querySelector('.modal').innerHTML = `
    <h3 id="modalTitle">Add New Study (BSIT)</h3>
    <div class="field"><label>Title</label><input type="text" id="studyTitle" placeholder="e.g., Smart Attendance System"></div>
    <div class="field"><label>Members (students)</label><select id="studyMembers" multiple style="height: auto; min-height: 120px;"></select></div>
    <div class="field"><label>Adviser</label><select id="studyAdviser"></select></div>
    <div class="field"><label>Year Published</label><input type="number" id="studyYear" placeholder="2026"></div>
    <div class="field"><label>Archive Date (MMM DD, YYYY)</label><input type="text" id="studyDate" placeholder="Apr 18, 2026"></div>
    <div class="field"><label>Abstract</label><textarea id="studyAbstract" placeholder="Brief description..."></textarea></div>
    <div class="modal-actions">
      <button class="btn-secondary" id="cancelStudyBtn">Cancel</button>
      <button class="btn-primary" id="saveStudyBtn">Save Study</button>
    </div>
  `;
  document.getElementById('saveStudyBtn').onclick = saveStudy;
  document.getElementById('cancelStudyBtn').onclick = closeStudyModal;
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  initHamburger();
  renderAuthUI();
  const user = getUser();
  if (!user || user.role !== 'admin') return;

  updateModalFields();

  await Promise.all([fetchUsers(), fetchProposals()]);
  renderLists();

  // Delete modal buttons
  document.getElementById('confirmDeleteBtn').onclick = confirmDelete;
  document.getElementById('cancelDeleteBtn').onclick = cancelDelete;

  // Logout modal buttons
  document.getElementById('confirmLogoutBtn').onclick = () => {
    hideLogoutModal();
    clearAuthAndRedirect();
  };
  document.getElementById('cancelLogoutBtn').onclick = hideLogoutModal;

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
  });
});
