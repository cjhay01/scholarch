// admin_manage_archive.js – login state + archive management

function getUser() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.location.href = 'landing_page.html';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

function renderAuthUI() {
  const user = getUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');
  const mobileAvatar = document.getElementById('mobileAvatar');

  if (user) {
    const name = user.name || user.first_name + ' ' + user.last_name || 'Admin';
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
      document.getElementById('desktopLogoutBtn')?.addEventListener('click', clearAuthAndRedirect);
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
      document.getElementById('mobileLogoutBtn')?.addEventListener('click', clearAuthAndRedirect);
    }

    if (mobileAvatar) mobileAvatar.textContent = initial;
  } else {
    if (authSection) {
      authSection.innerHTML = '<a href="./login_page.html" class="login-btn">🔐 Log in as Admin</a>';
    }
    if (topbarAuth) {
      topbarAuth.innerHTML = '<a href="./login_page.html" class="topbar-login-btn">Log in</a>';
    }
    if (mobileAuth) {
      mobileAuth.innerHTML = '<a href="./login_page.html" class="btn-nav-auth">Log in</a>';
    }
  }
}

// ---------- Archive management logic ----------
let studies = [
  { id: 1, title: "E-Clearance System for PLV Students", authors: "Santos, Reyes, Cruz", professor: "Prof. R. Mendoza", year: 2026, date: "Apr 18, 2026", abstract: "A digital clearance management system that streamlines student clearance." },
  { id: 2, title: "Smart Parking Management System for PLV Campus", authors: "Dela Cruz, Aquino, Mañago", professor: "Prof. G. Reyes", year: 2026, date: "Apr 15, 2026", abstract: "IoT-integrated parking management using sensors." },
  { id: 3, title: "Campus Navigation App for PLV", authors: "Villanueva, Bautista, Lim", professor: "Prof. R. Mendoza", year: 2026, date: "Apr 10, 2026", abstract: "Indoor navigation for PLV campus." },
  { id: 4, title: "Scholarship Portal for PLV Students", authors: "Fernandez, Gomez, Rivera", professor: "Prof. A. Cruz", year: 2026, date: "Apr 8, 2026", abstract: "Centralized platform for scholarship applications." },
  { id: 5, title: "Automated Library Catalog and Reservation System", authors: "Talento, Masangkay, Ocampo", professor: "Prof. M. Lopez", year: 2025, date: "Nov 22, 2025", abstract: "Library system to search, reserve, and track physical book loans." },
  { id: 6, title: "PLV Faculty Workload Monitoring System", authors: "Padilla, Uson, Balagtas", professor: "Prof. J. Santos", year: 2025, date: "Oct 14, 2025", abstract: "Admin tool to monitor faculty workload." }
];
let nextId = 7;
let currentEditId = null;
let deleteTargetId = null;

function renderLists() {
  const container = document.getElementById('desktopArchiveContainer');
  const mobileContainer = document.getElementById('mobileArchiveContainer');
  if (!container) return;

  const years = [...new Set(studies.map(s => s.year))].sort((a,b)=>b-a);
  const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');

  const html = `
    <section class="archive-hero">
      <h1 class="hero-heading">Manage <em>Archived</em> Studies (BSIT)</h1>
      <p class="hero-sub">Add, edit, or remove research entries in the BSIT repository.</p>
      <div class="search-bar">
        <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="text" placeholder="Search by title, author, professor..." id="desktopSearch"></div>
        <button class="search-btn" id="desktopSearchBtn">Search</button>
      </div>
      <div class="hero-stats"><div class="stat"><strong>${studies.length}</strong> total studies</div><div class="stat"><strong>${years.length}</strong> years</div></div>
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
    <div class="results-info"><span class="results-count" id="desktopCount"><strong>${studies.length}</strong> results</span></div>
    <div class="list-view" id="desktopListView"></div>
  `;
  container.innerHTML = html;

  if (mobileContainer) {
    const mobileYears = [...new Set(studies.map(s=>s.year))].sort((a,b)=>b-a);
    const mobileYearOptions = mobileYears.map(y=>`<option value="${y}">${y}</option>`).join('');
    mobileContainer.innerHTML = `
      <div class="filter-row">
        <select class="select-filter" id="mobileYearFilter"><option value="">All Years</option>${mobileYearOptions}</select>
        <select class="select-filter" id="mobileSort"><option value="newest">Newest First</option><option value="oldest">Oldest First</option><option value="title">A–Z</option></select>
        <button class="add-btn" id="addStudyBtnMobile">+ New</button>
      </div>
      <div class="results-info"><span class="results-count" id="mobileCount"><strong>${studies.length}</strong> results</span></div>
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

function getFilteredSortedStudies() {
  const search = document.getElementById('desktopSearch')?.value.toLowerCase() || '';
  const year = document.getElementById('desktopYearFilter')?.value || '';
  const sort = document.getElementById('desktopSort')?.value || 'newest';
  let filtered = studies.filter(s => {
    const matchYear = !year || s.year === parseInt(year);
    const matchSearch = !search || s.title.toLowerCase().includes(search) || s.authors.toLowerCase().includes(search) || s.professor.toLowerCase().includes(search);
    return matchYear && matchSearch;
  });
  if (sort === 'oldest') filtered.sort((a,b) => a.year - b.year);
  else if (sort === 'title') filtered.sort((a,b) => a.title.localeCompare(b.title));
  else filtered.sort((a,b) => b.year - a.year);
  return filtered;
}

function renderListContainer(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = data.map((s, idx) => `
    <div class="list-card" data-id="${s.id}">
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
        <button class="edit-study-btn" data-id="${s.id}">Edit</button>
        <button class="delete-study-btn" data-id="${s.id}">Delete</button>
      </div>
    </div>
  `).join('');
  container.querySelectorAll('.edit-study-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openStudyModal(parseInt(btn.dataset.id)); };
  });
  container.querySelectorAll('.delete-study-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openDeleteModal(parseInt(btn.dataset.id)); };
  });
}

function applyDesktopFilters() {
  const filtered = getFilteredSortedStudies();
  const countSpan = document.getElementById('desktopCount');
  if (countSpan) countSpan.innerHTML = `<strong>${filtered.length}</strong> result${filtered.length !== 1 ? 's' : ''}`;
  renderListContainer('desktopListView', filtered);
}

function applyMobileFilters() {
  const year = document.getElementById('mobileYearFilter')?.value || '';
  const sort = document.getElementById('mobileSort')?.value || 'newest';
  let filtered = studies.filter(s => {
    const matchYear = !year || s.year === parseInt(year);
    return matchYear;
  });
  if (sort === 'oldest') filtered.sort((a,b) => a.year - b.year);
  else if (sort === 'title') filtered.sort((a,b) => a.title.localeCompare(b.title));
  else filtered.sort((a,b) => b.year - a.year);
  const countSpan = document.getElementById('mobileCount');
  if (countSpan) countSpan.innerHTML = `<strong>${filtered.length}</strong> result${filtered.length !== 1 ? 's' : ''}`;
  renderListContainer('mobileListView', filtered);
}

function openStudyModal(editId = null) {
  currentEditId = editId;
  const modal = document.getElementById('studyModal');
  const modalTitle = document.getElementById('modalTitle');
  if (editId) {
    const study = studies.find(s => s.id === editId);
    if (study) {
      modalTitle.innerText = 'Edit Study (BSIT)';
      document.getElementById('studyTitle').value = study.title;
      document.getElementById('studyAuthors').value = study.authors;
      document.getElementById('studyProfessor').value = study.professor;
      document.getElementById('studyYear').value = study.year;
      document.getElementById('studyDate').value = study.date;
      document.getElementById('studyAbstract').value = study.abstract;
    }
  } else {
    modalTitle.innerText = 'Add New Study (BSIT)';
    document.getElementById('studyTitle').value = '';
    document.getElementById('studyAuthors').value = '';
    document.getElementById('studyProfessor').value = '';
    document.getElementById('studyYear').value = new Date().getFullYear();
    document.getElementById('studyDate').value = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    document.getElementById('studyAbstract').value = '';
  }
  modal.classList.add('is-open');
}

function saveStudy() {
  const title = document.getElementById('studyTitle').value.trim();
  const authors = document.getElementById('studyAuthors').value.trim();
  const professor = document.getElementById('studyProfessor').value.trim();
  const year = parseInt(document.getElementById('studyYear').value);
  const date = document.getElementById('studyDate').value.trim();
  const abstract = document.getElementById('studyAbstract').value.trim();
  if (!title || !authors || !professor || !year || !date) {
    alert('Please fill all required fields.');
    return;
  }
  if (currentEditId) {
    const index = studies.findIndex(s => s.id === currentEditId);
    if (index !== -1) {
      studies[index] = { ...studies[index], title, authors, professor, year, date, abstract };
    }
  } else {
    studies.push({ id: nextId++, title, authors, professor, year, date, abstract });
  }
  closeStudyModal();
  renderLists();
}

function closeStudyModal() {
  document.getElementById('studyModal').classList.remove('is-open');
  currentEditId = null;
}

function openDeleteModal(id) {
  deleteTargetId = id;
  document.getElementById('deleteModal').classList.add('is-open');
}

function confirmDelete() {
  if (deleteTargetId) {
    studies = studies.filter(s => s.id !== deleteTargetId);
    deleteTargetId = null;
    renderLists();
  }
  document.getElementById('deleteModal').classList.remove('is-open');
}

function cancelDelete() {
  deleteTargetId = null;
  document.getElementById('deleteModal').classList.remove('is-open');
}

// Hamburger menu
const hamburger = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobileNav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('is-open');
    if (!isOpen) {
      mobileNav.style.display = 'flex';
      setTimeout(() => mobileNav.classList.add('is-open'), 10);
      hamburger.classList.add('open');
      document.body.style.overflow = 'hidden';
    } else {
      mobileNav.classList.remove('is-open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
      mobileNav.addEventListener('transitionend', () => {
        if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none';
      }, { once: true });
    }
  });
}

// Modal buttons
document.getElementById('saveStudyBtn').onclick = saveStudy;
document.getElementById('cancelStudyBtn').onclick = closeStudyModal;
document.getElementById('confirmDeleteBtn').onclick = confirmDelete;
document.getElementById('cancelDeleteBtn').onclick = cancelDelete;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderAuthUI();
  renderLists();
});