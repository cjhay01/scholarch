// archive.js – with login state handling

function getUser() {
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function renderAuthUI() {
  const user = getUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');

  if (user) {
    // Logged in: show user info and logout button
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
  } else {
    // Not logged in: show login button
    if (authSection) {
      authSection.innerHTML = `<a href="./login_page.html" class="btn-primary" style="width:100%; text-align:center;">Log in</a>`;
    }
    if (topbarAuth) {
      topbarAuth.innerHTML = `<a href="./login_page.html" class="btn-login">Log in</a>`;
    }
    if (mobileAuth) {
      mobileAuth.innerHTML = `<a href="./login_page.html" class="btn-nav-auth">Log in</a>`;
    }
  }
}

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.location.href = './index.html';
}

// ---------- All existing archive logic (studies, filters, hamburger) remains unchanged ----------
const studies = [
  { id: 1, title: "E-Clearance System for PLV Students", authors: "Santos, Reyes, Cruz", department: "BSIT", year: 2026, date: "Apr 18, 2026", abstract: "A digital clearance management system that streamlines the student clearance process at Pamantasan ng Lungsod ng Valenzuela, replacing manual workflows." },
  { id: 2, title: "Smart Parking Management System for PLV Campus", authors: "Dela Cruz, Aquino, Mañago", department: "BSIT", year: 2026, date: "Apr 15, 2026", abstract: "IoT-integrated parking management using sensors and a mobile interface to locate available slots." },
  { id: 3, title: "Campus Navigation App for PLV", authors: "Villanueva, Bautista, Lim", department: "BSIT", year: 2026, date: "Apr 10, 2026", abstract: "Indoor navigation for PLV campus helping students and visitors find offices and classrooms." },
  { id: 4, title: "Scholarship Portal for PLV Students", authors: "Fernandez, Gomez, Rivera", department: "BSIT", year: 2026, date: "Apr 8, 2026", abstract: "Centralized platform for scholarship applications and grantee monitoring." },
  { id: 5, title: "Automated Library Catalog and Reservation System", authors: "Talento, Masangkay, Ocampo", department: "BSCS", year: 2025, date: "Nov 22, 2025", abstract: "Library system to search, reserve, and track physical book loans." },
  { id: 6, title: "PLV Faculty Workload Monitoring System", authors: "Padilla, Uson, Balagtas", department: "BSCE", year: 2025, date: "Oct 14, 2025", abstract: "Admin tool to monitor faculty workload distribution." },
  { id: 7, title: "Online Enrollment and Advising Platform", authors: "Soriano, Macapagal, Castillo", department: "BSCS", year: 2025, date: "Sep 5, 2025", abstract: "Web-based enrollment and academic advising." },
  { id: 8, title: "Health Records Management System for PLV Clinic", authors: "Mendez, Alegre, Fonacier", department: "BSCE", year: 2025, date: "Aug 19, 2025", abstract: "Secure electronic health records for the school clinic." },
  { id: 9, title: "Using Facial Recognition for Student Attendance", authors: "Ramos, Dela Peña, Yap", department: "BSIT", year: 2026, date: "Apr 28, 2026", abstract: "ML-based facial recognition attendance system." },
  { id: 10, title: "Inventory and Asset Tracking for PLV Laboratories", authors: "Cabrera, Espino, Tolentino", department: "BSCE", year: 2024, date: "Dec 3, 2024", abstract: "QR-code enabled lab equipment inventory." },
  { id: 11, title: "Mobile Learning Application for PLV BSIT Students", authors: "Dimaculangan, Sison, Abaya", department: "BSIT", year: 2024, date: "Nov 9, 2024", abstract: "React Native learning platform for BSIT curriculum." },
  { id: 12, title: "Digital Canteen Ordering System for PLV", authors: "Esteban, Pangilinan, Narciso", department: "BSCS", year: 2024, date: "Oct 21, 2024", abstract: "Mobile/web-based food ordering to reduce queuing." }
];

let desktopView = 'list';
let desktopFiltered = [...studies];
let mobileFiltered = [...studies];

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
  container.innerHTML = data.map(s => `
    <div class="study-card">
      <h3 class="card-title">${escapeHtml(s.title)}</h3>
      <p class="card-abstract">${escapeHtml(s.abstract)}</p>
      <div class="card-meta">
        <div class="card-meta-row">${icon('user')} ${escapeHtml(s.authors)}</div>
        <div class="card-meta-row">${icon('calendar')} Archived ${escapeHtml(s.date)}</div>
      </div>
      <div class="card-footer">
        <span class="card-date">${s.year}</span>
        <a href="studyCard.html?id=${s.id}" class="card-view-link">View ${icon('arrow')}</a>
      </div>
    </div>
  `).join('');
}

function renderList(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = data.map((s, i) => `
    <div class="list-card">
      <div class="list-card-index">${String(i + 1).padStart(2, '0')}</div>
      <div class="list-card-body">
        <div class="list-card-top">
          <h3 class="list-card-title">${escapeHtml(s.title)}</h3>
        </div>
        <p class="list-card-abstract">${escapeHtml(s.abstract)}</p>
        <div class="list-card-meta">
          <div class="list-meta-item">${icon('user')} ${escapeHtml(s.authors)}</div>
          <div class="list-meta-item">${icon('calendar')} ${escapeHtml(s.date)}</div>
        </div>
      </div>
      <div class="list-card-actions">
        <a href="studyCard.html?id=${s.id}" class="btn-view">View</a>
      </div>
    </div>
  `).join('');
}

function updateDesktop() {
  const root = document.getElementById('desktop-root');
  if (!root) return;
  root.innerHTML = `
    <section class="archive-hero">
      <div class="hero-eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Research Archive — PLV Repository</div>
      <h1 class="hero-heading">Explore <em>approved</em> research<br>from PLV students.</h1>
      <p class="hero-sub">Browse and search the complete archive of approved capstone and thesis proposals for WS101.</p>
      <div class="search-bar">
        <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="text" placeholder="Search…" id="desktopSearch"></div>
        <button class="search-btn">Search</button>
      </div>
      <div class="hero-stats"><div class="stat"><strong>142</strong> approved studies</div><div class="stat"><strong>6</strong> </div><div class="stat"><strong>2022–2026</strong></div></div>
    </section>
    <div class="filter-row">
      <span class="filter-label">Filter:</span>
      <select class="select-filter" id="desktopYear">
        <option value="">All Years</option>
        <option value="2026">2026</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
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
    const matchYear = !year || s.year === parseInt(year);
    const matchSearch = !search || s.title.toLowerCase().includes(search) || s.authors.toLowerCase().includes(search) || s.abstract.toLowerCase().includes(search);
    return matchYear && matchSearch;
  });
  
  if (sort === 'oldest') desktopFiltered.sort((a, b) => a.year - b.year);
  else if (sort === 'title') desktopFiltered.sort((a, b) => a.title.localeCompare(b.title));
  else desktopFiltered.sort((a, b) => b.year - a.year);
  
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
  root.innerHTML = `
    <section class="archive-hero">
      <div class="hero-eyebrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg> Research Archive — PLV Repository</div>
      <h1 class="hero-heading">Explore <em>approved</em> research<br>from PLV students.</h1>
      <p class="hero-sub">Browse and search the complete archive of approved capstone and thesis proposals for WS101.</p>
      <div class="search-bar">
        <div class="search-wrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input class="search-input" type="text" placeholder="Search…" id="mobileSearch"></div>
        <button class="search-btn">Search</button>
      </div>
      <div class="hero-stats"><div class="stat"><strong>142</strong> approved studies</div><div class="stat"><strong>6</strong> </div><div class="stat"><strong>2022–2026</strong></div></div>
    </section>
    <div class="filter-row">
      <span class="filter-label">Filter:</span>
      <select class="select-filter" id="mobileYear">
        <option value="">All Years</option>
        <option value="2026">2026</option>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
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
    const matchYear = !year || s.year === parseInt(year);
    const matchSearch = !search || s.title.toLowerCase().includes(search) || s.authors.toLowerCase().includes(search) || s.abstract.toLowerCase().includes(search);
    return matchYear && matchSearch;
  });
  
  if (sort === 'oldest') mobileFiltered.sort((a, b) => a.year - b.year);
  else if (sort === 'title') mobileFiltered.sort((a, b) => a.title.localeCompare(b.title));
  else mobileFiltered.sort((a, b) => b.year - a.year);
  
  const countSpan = document.getElementById('mobileCount');
  if (countSpan) countSpan.innerHTML = `<strong>${mobileFiltered.length}</strong> result${mobileFiltered.length !== 1 ? 's' : ''}`;
  renderGrid('mobileGridView', mobileFiltered);
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

// Hamburger menu
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobile-nav');
if (hamburger && mobileNav) {
  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('is-open');
    if (!isOpen) {
      mobileNav.style.display = 'flex';
      mobileNav.classList.add('is-open');
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
  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('is-open');
      hamburger.classList.remove('open');
      document.body.style.overflow = '';
      mobileNav.addEventListener('transitionend', () => {
        if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none';
      }, { once: true });
    });
  });
}

renderAuthUI();
updateDesktop();
updateMobile();