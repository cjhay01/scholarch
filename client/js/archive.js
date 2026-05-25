// archive.js – dynamic proposals from API, role‑based navigation
// modified: unauthenticated users see only "Browse Archive"

// ---------- Fetch proposals (only approved/completed) ----------
async function fetchProposals() {
  const token = getToken();
  try {
    let url = `${API_BASE}/proposals?status=Approved&status=Completed`;
    let headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      url = `${API_BASE}/proposals/public`;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch studies');
    const data = await response.json();
    return data;
  } catch (err) {
    console.error(err);
    showToast('Could not load archive. Please try again later.', 'error');
    return [];
  }
}

// ---------- Hide Dashboard & Profile (unauthenticated users) ----------
function hideDashboardProfileLinks() {
  // Sidebar – hide Dashboard and Profile links
  const dashboardLink = document.getElementById('dashboardLink');
  const profileLink = document.getElementById('profileLink');
  if (dashboardLink) dashboardLink.style.display = 'none';
  if (profileLink) profileLink.style.display = 'none';

  // Also hide any faculty-only "Create Student Accounts" link if present
  const createAccountsLink = document.getElementById('createAccountsLink');
  if (createAccountsLink) createAccountsLink.parentElement.style.display = 'none';
  const studentMgmtSection = document.querySelector('.nav-section-label-student');
  if (studentMgmtSection) {
    studentMgmtSection.style.display = 'none';
    if (studentMgmtSection.nextElementSibling) {
      studentMgmtSection.nextElementSibling.style.display = 'none';
    }
  }

  // Mobile nav – hide Dashboard and Profile (hide their <li>)
  const mobileDashboardLink = document.getElementById('mobileDashboardLink');
  const mobileProfileLink = document.getElementById('mobileProfileLink');
  if (mobileDashboardLink) mobileDashboardLink.parentElement.style.display = 'none';
  if (mobileProfileLink) mobileProfileLink.parentElement.style.display = 'none';

  // Hide any faculty create link in mobile nav
  const mobileCreateLink = document.querySelector('.mobile-nav-links a[href="./faculty_create.html"]');
  if (mobileCreateLink) mobileCreateLink.closest('li').style.display = 'none';
}

// ---------- Role‑based navigation (desktop sidebar) ----------
function updateSidebarLinks(role) {
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (!sidebarNav) return;

  // Keep the "Overview" section
  let overviewSection = sidebarNav.querySelector('.nav-section-label');
  if (!overviewSection || overviewSection.textContent.trim() !== 'Overview') {
    sidebarNav.innerHTML = `
      <span class="nav-section-label">Overview</span>
      <a href="#" class="nav-item" id="dashboardLink"><svg viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>Dashboard</a>
      <span class="nav-section-label">Research</span>
      <a href="#" class="nav-item is-active" id="archiveLink"><svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4"/><line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Browse Archive</a>
      <span class="nav-section-label">Account</span>
      <a href="#" class="nav-item" id="profileLink"><svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5.5" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M2 14c0-3 2.7-4.5 6-4.5s6 1.5 6 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>Profile</a>
    `;
    overviewSection = sidebarNav.querySelector('.nav-section-label');
  }

  const dashboardLink = document.getElementById('dashboardLink');
  const profileLink = document.getElementById('profileLink');

  if (role === 'faculty') {
    dashboardLink.href = './faculty_dashboard.html';
    profileLink.href = './faculty_profile.html';
    // Add "Student Management" section if not already present
    let studentMgmtSection = sidebarNav.querySelector('.nav-section-label-student');
    if (!studentMgmtSection) {
      const studentMgmtHtml = `
        <span class="nav-section-label nav-section-label-student">Student Management</span>
        <a href="./faculty_create.html" class="nav-item" id="createAccountsLink"><svg viewBox="0 0 16 16" fill="none"><path d="M2 3h12v10H2z" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 7h6M5 10h4" stroke="currentColor" stroke-width="1.2"/></svg>Create Student Accounts</a>
      `;
      const accountSection = sidebarNav.querySelector('.nav-section-label:nth-of-type(2)');
      if (accountSection) {
        accountSection.insertAdjacentHTML('beforebegin', studentMgmtHtml);
      } else {
        sidebarNav.insertAdjacentHTML('beforeend', studentMgmtHtml);
      }
    }
  } else {
    dashboardLink.href = './student_dashboard.html';
    profileLink.href = './student_profile.html';
    const studentMgmtSection = sidebarNav.querySelector('.nav-section-label-student');
    if (studentMgmtSection) {
      studentMgmtSection.nextElementSibling?.remove();
      studentMgmtSection.remove();
    }
  }
}

// ---------- Update mobile navigation based on role ----------
function updateMobileNav(role) {
  const mobileNavUl = document.querySelector('.mobile-nav-links');
  if (!mobileNavUl) return;

  mobileNavUl.innerHTML = '';

  const dashboardFile = (role === 'faculty') ? './faculty_dashboard.html' : './student_dashboard.html';
  const profileFile = (role === 'faculty') ? './faculty_profile.html' : './student_profile.html';

  let links = `
    <li><a href="${dashboardFile}">Dashboard</a></li>
    <li><a href="./archive.html" class="mobile-nav-active">Browse Archive</a></li>
    <li><a href="${profileFile}">Profile</a></li>
  `;
  if (role === 'faculty') {
    links += `<li><a href="./faculty_create.html">Create Student Accounts</a></li>`;
  }
  mobileNavUl.innerHTML = links;
}

function showPublicNavigation() {
  // Desktop sidebar – replace entire nav
  const sidebarNav = document.querySelector('.sidebar-nav');
  if (sidebarNav) {
    sidebarNav.innerHTML = `
      <span class="nav-section-label">Navigation</span>
      <a href="./index.html" class="nav-item" id="homeLink">
        <svg viewBox="0 0 16 16" fill="none">
          <path d="M2 6l6-4 6 4v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6z" stroke="currentColor" stroke-width="1.4"/>
        </svg>
        Home
      </a>
      <a href="./archive.html" class="nav-item is-active" id="archiveLink">
        <svg viewBox="0 0 16 16" fill="none">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.4"/>
          <line x1="11" y1="11" x2="15" y2="15" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
        </svg>
        Browse Archive
      </a>
    `;
  }

  // Mobile nav – replace all links
  const mobileNavUl = document.querySelector('.mobile-nav-links');
  if (mobileNavUl) {
    mobileNavUl.innerHTML = `
      <li><a href="./index.html">Home</a></li>
      <li><a href="./archive.html" class="mobile-nav-active">Browse Archive</a></li>
    `;
  }
}

// ---------- Login state UI (with role‑based navigation) ----------
function renderAuthUI() {
  const user = getUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');

  if (user) {
    const name = user.name || user.first_name + ' ' + user.last_name || 'User';
    const role = user.role || 'Student';
    const initial = name.charAt(0).toUpperCase();

    // Desktop sidebar
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

    // Desktop topbar
    if (topbarAuth) {
      topbarAuth.innerHTML = `
        <button class="btn-notif">
          <svg viewBox="0 0 18 18" fill="none">
            <path d="M9 1.5A5.5 5.5 0 0 0 3.5 7v3.5L2 12h14l-1.5-1.5V7A5.5 5.5 0 0 0 9 1.5Z" stroke="currentColor" stroke-width="1.4"/>
            <path d="M7 12.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          <span class="notif-badge"></span>
        </button>
        <button class="avatar-btn">${initial}</button>
      `;
    }

    // Mobile nav
    if (mobileAuth) {
      mobileAuth.innerHTML = `<a href="#" id="mobileLogoutBtn" class="btn-nav-auth">Log out</a>`;
      document.getElementById('mobileLogoutBtn')?.addEventListener('click', clearAuthAndRedirect);
    }

    // Update navigation links based on role
    const roleLower = (user.role || 'student').toLowerCase();
    updateSidebarLinks(roleLower);
    updateMobileNav(roleLower);
   } else {
    // NOT logged in – show login buttons and public navigation (Home + Archive only)
    if (authSection) {
      authSection.innerHTML = '<a href="./login_page.html" class="btn-primary" style="width:100%; text-align:center;">Log in</a>';
    }
    if (topbarAuth) {
      topbarAuth.innerHTML = '<a href="./login_page.html" class="btn-login">Log in</a>';
    }
    if (mobileAuth) {
      mobileAuth.innerHTML = '<a href="./login_page.html" class="btn-nav-auth">Log in</a>';
    }

    showPublicNavigation();  // <- replaces the old two lines
  }
}

// ---------- Archive display logic (dynamic proposals) ----------
let studies = [];
let desktopView = 'list';
let desktopFiltered = [];
let mobileFiltered = [];

function icon(name) {
  const icons = {
    user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
    calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`
  };
  return icons[name] || '';
}

function renderGrid(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><p>No archived studies found.</p></div>';
    return;
  }
  container.innerHTML = data.map(s => `
    <div class="study-card">
      <h3 class="card-title">${escapeHtml(s.title)}</h3>
      <p class="card-abstract">${escapeHtml(s.abstract)}</p>
      <div class="card-meta">
        <div class="card-meta-row">${icon('user')} ${escapeHtml(s.authors ? s.authors.join(', ') : 'Unknown')}</div>
        <div class="card-meta-row">${icon('calendar')} ${escapeHtml(s.date || new Date(s.submissionDate).toLocaleDateString())}</div>
      </div>
      <div class="card-footer">
        <span class="card-date">${s.year || new Date(s.submissionDate).getFullYear()}</span>
        <a href="studyCard.html?id=${s._id}" class="card-view-link">View ${icon('arrow')}</a>
      </div>
    </div>
  `).join('');
}

function renderList(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  if (!data.length) {
    container.innerHTML = '<div class="empty-state"><p>No archived studies found.</p></div>';
    return;
  }
  container.innerHTML = data.map((s, i) => `
    <div class="list-card">
      <div class="list-card-index">${String(i + 1).padStart(2, '0')}</div>
      <div class="list-card-body">
        <div class="list-card-top">
          <h3 class="list-card-title">${escapeHtml(s.title)}</h3>
        </div>
        <p class="list-card-abstract">${escapeHtml(s.abstract)}</p>
        <div class="list-card-meta">
          <div class="list-meta-item">${icon('user')} ${escapeHtml(s.authors ? s.authors.join(', ') : 'Unknown')}</div>
          <div class="list-meta-item">${icon('calendar')} ${escapeHtml(s.date || new Date(s.submissionDate).toLocaleDateString())}</div>
        </div>
      </div>
      <div class="list-card-actions">
        <a href="studyCard.html?id=${s._id}" class="btn-view">View</a>
      </div>
    </div>
  `).join('');
}

function updateDesktop() {
  const root = document.getElementById('desktop-root');
  if (!root) return;

  const years = [...new Set(studies.map(s => s.year || new Date(s.submissionDate).getFullYear()))].sort((a, b) => b - a);
  const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');

  root.innerHTML = `
    <section class="archive-hero">
      <div class="hero-eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Research Archive — PLV Repository</div>
      <h1 class="hero-heading">Explore <em>approved</em> research<br>from PLV students.</h1>
      <p class="hero-sub">Browse and search the complete archive of approved capstone and thesis proposals.</p>
      <div class="search-bar">
        <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="text" placeholder="Search…" id="desktopSearch"></div>
        <button class="search-btn">Search</button>
      </div>
      <div class="hero-stats"><div class="stat"><strong>${studies.length}</strong> approved studies</div><div class="stat"><strong>${years.length}</strong> years</div></div>
    </section>
    <div class="filter-row">
      <span class="filter-label">Filter:</span>
      <select class="select-filter" id="desktopYear">
        <option value="">All Years</option>
        ${yearOptions}
      </select>
      <select class="select-filter" id="desktopSort">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="title">A–Z by Title</option>
      </select>
      <div class="spacer"></div>
      <div class="view-toggle">
        <button class="view-btn" data-view="grid">☰</button>
        <button class="view-btn active" data-view="list">≡</button>
      </div>
    </div>
    <div class="results-info"><span class="results-count" id="desktopCount"><strong>${desktopFiltered.length}</strong> results</span></div>
    <div class="grid-view hidden" id="desktopGridView"></div>
    <div class="list-view" id="desktopListView"></div>
  `;
  attachDesktopEvents();
  applyDesktopFilters();
}

function attachDesktopEvents() {
  document.getElementById('desktopYear')?.addEventListener('change', () => applyDesktopFilters());
  document.getElementById('desktopSort')?.addEventListener('change', () => applyDesktopFilters());
  document.getElementById('desktopSearch')?.addEventListener('input', () => applyDesktopFilters());
  document.querySelectorAll('#desktop-root .view-btn').forEach(btn => {
    btn.onclick = () => {
      desktopView = btn.dataset.view;
      document.querySelectorAll('#desktop-root .view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyDesktopFilters();
    };
  });
}

function applyDesktopFilters() {
  const search = document.getElementById('desktopSearch')?.value.toLowerCase() || '';
  const year = document.getElementById('desktopYear')?.value || '';
  const sort = document.getElementById('desktopSort')?.value || 'newest';

  desktopFiltered = studies.filter(s => {
    const studyYear = s.year || new Date(s.submissionDate).getFullYear();
    const matchYear = !year || studyYear === parseInt(year);
    const matchSearch = !search || s.title.toLowerCase().includes(search) ||
      (s.authors && s.authors.some(a => a.toLowerCase().includes(search))) ||
      (s.abstract && s.abstract.toLowerCase().includes(search));
    return matchYear && matchSearch;
  });

  const getTime = (s) => new Date(s.submissionDate).getTime();
  if (sort === 'oldest') desktopFiltered.sort((a, b) => getTime(a) - getTime(b));
  else if (sort === 'title') desktopFiltered.sort((a, b) => a.title.localeCompare(b.title));
  else desktopFiltered.sort((a, b) => getTime(b) - getTime(a));

  const countSpan = document.getElementById('desktopCount');
  if (countSpan) countSpan.innerHTML = `<strong>${desktopFiltered.length}</strong> result${desktopFiltered.length !== 1 ? 's' : ''}`;

  if (desktopView === 'grid') {
    document.getElementById('desktopGridView')?.classList.remove('hidden');
    document.getElementById('desktopListView')?.classList.add('hidden');
    renderGrid('desktopGridView', desktopFiltered);
  } else {
    document.getElementById('desktopListView')?.classList.remove('hidden');
    document.getElementById('desktopGridView')?.classList.add('hidden');
    renderList('desktopListView', desktopFiltered);
  }
}

function updateMobile() {
  const root = document.getElementById('mobile-root');
  if (!root) return;

  const years = [...new Set(studies.map(s => s.year || new Date(s.submissionDate).getFullYear()))].sort((a, b) => b - a);
  const yearOptions = years.map(y => `<option value="${y}">${y}</option>`).join('');

  root.innerHTML = `
    <section class="archive-hero">
      <div class="hero-eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Research Archive — PLV Repository</div>
      <h1 class="hero-heading">Explore <em>approved</em> research<br>from PLV students.</h1>
      <p class="hero-sub">Browse and search the complete archive of approved capstone and thesis proposals.</p>
      <div class="search-bar">
        <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="text" placeholder="Search…" id="mobileSearch"></div>
        <button class="search-btn">Search</button>
      </div>
      <div class="hero-stats"><div class="stat"><strong>${studies.length}</strong> approved studies</div><div class="stat"><strong>${years.length}</strong> years</div></div>
    </section>
    <div class="filter-row">
      <span class="filter-label">Filter:</span>
      <select class="select-filter" id="mobileYear">
        <option value="">All Years</option>
        ${yearOptions}
      </select>
      <select class="select-filter" id="mobileSort">
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="title">A–Z by Title</option>
      </select>
      <div class="spacer"></div>
    </div>
    <div class="results-info"><span class="results-count" id="mobileCount"><strong>${mobileFiltered.length}</strong> results</span></div>
    <div class="grid-view" id="mobileGridView"></div>
  `;
  attachMobileEvents();
  applyMobileFilters();
}

function attachMobileEvents() {
  document.getElementById('mobileYear')?.addEventListener('change', () => applyMobileFilters());
  document.getElementById('mobileSort')?.addEventListener('change', () => applyMobileFilters());
  document.getElementById('mobileSearch')?.addEventListener('input', () => applyMobileFilters());
}

function applyMobileFilters() {
  const search = document.getElementById('mobileSearch')?.value.toLowerCase() || '';
  const year = document.getElementById('mobileYear')?.value || '';
  const sort = document.getElementById('mobileSort')?.value || 'newest';

  mobileFiltered = studies.filter(s => {
    const studyYear = s.year || new Date(s.submissionDate).getFullYear();
    const matchYear = !year || studyYear === parseInt(year);
    const matchSearch = !search || s.title.toLowerCase().includes(search) ||
      (s.authors && s.authors.some(a => a.toLowerCase().includes(search))) ||
      (s.abstract && s.abstract.toLowerCase().includes(search));
    return matchYear && matchSearch;
  });

  const getTime = (s) => new Date(s.submissionDate).getTime();
  if (sort === 'oldest') mobileFiltered.sort((a, b) => getTime(a) - getTime(b));
  else if (sort === 'title') mobileFiltered.sort((a, b) => a.title.localeCompare(b.title));
  else mobileFiltered.sort((a, b) => getTime(b) - getTime(a));

  const countSpan = document.getElementById('mobileCount');
  if (countSpan) countSpan.innerHTML = `<strong>${mobileFiltered.length}</strong> result${mobileFiltered.length !== 1 ? 's' : ''}`;
  renderGrid('mobileGridView', mobileFiltered);
}

// ---------- Load data and initialize ----------
async function initArchive() {
  initHamburger('hamburger', 'mobile-nav'); 
  renderAuthUI(); 

  const proposals = await fetchProposals();
  // Transform proposal data to match expected fields
  studies = proposals.map(p => ({
    _id: p._id,
    title: p.title,
    authors: p.members ? p.members.map(m => m.name) : [],
    abstract: p.abstract,
    submissionDate: p.submissionDate,
    year: p.approvalDate ? new Date(p.approvalDate).getFullYear() : new Date(p.submissionDate).getFullYear(),
    date: p.approvalDate ? new Date(p.approvalDate).toLocaleDateString() : new Date(p.submissionDate).toLocaleDateString()
  }));
  desktopFiltered = [...studies];
  mobileFiltered = [...studies];
  updateDesktop();
  updateMobile();
}

initArchive();  