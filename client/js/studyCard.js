// studyCard.js 

// ---------- Fetch proposal by ID ----------
async function loadProposal(proposalId) {
  const token = getToken();
  try {
    let url = `${API_BASE}/proposals/${proposalId}`;
    let headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      url = `${API_BASE}/proposals/public/${proposalId}`;
    }
    
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Proposal not found');
    const proposal = await response.json();
    currentProposal = proposal;
    renderProposal(proposal);
  } catch (err) {
    console.error(err);
    showToast('Could not load proposal details.', 'error');
    document.querySelector('.study-container').innerHTML = '<div class="empty-state"><p>Proposal not found or you do not have permission to view it.</p><a href="archive.html" class="btn btn-primary" style="margin-top:1rem;">Back to Archive</a></div>';
    document.querySelector('.mobile-content .study-card-detail').innerHTML = '<div class="empty-state"><p>Proposal not found.</p><a href="archive.html" class="btn btn-primary">Back to Archive</a></div>';
  }
}

// ---------- Render proposal data (desktop + mobile) ----------
function renderProposal(proposal) {
  const submittedDate = proposal.submissionDate ? new Date(proposal.submissionDate).toLocaleDateString() : 'Unknown';
  const approvedDate = proposal.approvalDate ? new Date(proposal.approvalDate).toLocaleDateString() : 'Not approved yet';
  const authorsStr = proposal.members ? proposal.members.map(m => m.name).join(', ') : 'No members listed';
  const adviserName = proposal.adviser ? (proposal.adviser.name || 'Not assigned') : 'Not assigned';
  const academicYear = proposal.academicYear || '2025-2026';
  const docId = proposal.documentId || `PLV-RS-${proposal._id.slice(-8)}`;

  // Desktop
  document.querySelector('.study-title').textContent = proposal.title;
  const desktopMetaBlocks = document.querySelectorAll('.study-header .meta-block');
  if (desktopMetaBlocks.length >= 3) {
    desktopMetaBlocks[0].innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${escapeHtml(authorsStr)}`;
    desktopMetaBlocks[1].innerHTML = `<svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg> Submitted: ${submittedDate}`;
    desktopMetaBlocks[2].innerHTML = `<svg viewBox="0 0 12 12" fill="none"><polygon points="6 1.5 7.5 4.5 10.5 5 8.5 7 9 10 6 8.5 3 10 3.5 7 1.5 5 4.5 4.5 6 1.5" stroke="currentColor" fill="none" stroke-width="1.2"/></svg> Approved: ${approvedDate}`;
  }
  document.getElementById('displayAbstract').textContent = proposal.abstract || 'No abstract provided.';

  const authorsList = document.querySelector('.authors-list');
  if (authorsList) {
    authorsList.innerHTML = proposal.members ? proposal.members.map(m => `<span class="author-chip">${escapeHtml(m.name)}</span>`).join('') : '<span class="author-chip">No members listed</span>';
  }
  const objectives = proposal.objectives || [];
  const methodology = proposal.methodology || [];
  const objectivesList = document.querySelector('.objectives-list');
  if (objectivesList) {
    objectivesList.innerHTML = objectives.length ? objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('') : '<li>No objectives provided.</li>';
  }
  const methodologyList = document.querySelector('.methodology-list');
  if (methodologyList) {
    methodologyList.innerHTML = methodology.length ? methodology.map(m => `<li>${escapeHtml(m)}</li>`).join('') : '<li>No methodology provided.</li>';
  }

  // Desktop sidebar info
  const infoRows = document.querySelectorAll('.info-card .info-row');
  if (infoRows.length >= 5) {
    infoRows[0].querySelector('.info-value').textContent = adviserName;
    infoRows[1].querySelector('.info-value').textContent = proposal.department || 'BSIT';
    infoRows[2].querySelector('.info-value').textContent = academicYear;
    infoRows[3].querySelector('.info-value').textContent = approvedDate !== 'Not approved yet' ? approvedDate : 'Pending';
    infoRows[4].querySelector('.info-value').textContent = docId;
  }

  // File download (desktop)
  const desktopDownloadBtn = document.getElementById('desktopDownloadBtn');
  if (proposal.file) {
    const fileUrl = `${window.location.origin}/uploads/proposals/${proposal.file}`;
    desktopDownloadBtn.onclick = () => window.open(fileUrl, '_blank');
    document.querySelector('.pdf-filename').textContent = proposal.file;
    document.querySelector('.pdf-size').textContent = 'PDF';
  } else {
    desktopDownloadBtn.onclick = () => alert('No document attached.');
    document.querySelector('.pdf-filename').textContent = 'No document attached';
  }

  // Mobile view
  document.querySelector('.mobile-content .study-title').textContent = proposal.title;
  const mobileMetaBlocks = document.querySelectorAll('.mobile-content .meta-block');
  if (mobileMetaBlocks.length >= 3) {
    mobileMetaBlocks[0].innerHTML = `<svg viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="currentColor" stroke-width="1.2"/><path d="M1.5 11c0-2.485 2.015-4 4.5-4s4.5 1.515 4.5 4" stroke="currentColor" stroke-width="1.2"/></svg> ${escapeHtml(authorsStr)}`;
    mobileMetaBlocks[1].innerHTML = `<svg viewBox="0 0 12 12" fill="none"><rect x="1" y="2.5" width="10" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M4 1v3M8 1v3" stroke="currentColor" stroke-width="1.2"/></svg> Submitted: ${submittedDate}`;
    mobileMetaBlocks[2].innerHTML = `<svg viewBox="0 0 12 12" fill="none"><polygon points="6 1.5 7.5 4.5 10.5 5 8.5 7 9 10 6 8.5 3 10 3.5 7 1.5 5 4.5 4.5 6 1.5" stroke="currentColor" fill="none" stroke-width="1.2"/></svg> Approved: ${approvedDate}`;
  }
  document.getElementById('mobileDisplayAbstract').textContent = proposal.abstract || 'No abstract provided.';
  const mobileAuthorsList = document.querySelector('.mobile-content .authors-list');
  if (mobileAuthorsList) {
    mobileAuthorsList.innerHTML = proposal.members ? proposal.members.map(m => `<span class="author-chip">${escapeHtml(m.name)}</span>`).join('') : '<span class="author-chip">No members listed</span>';
  }
  const mobileObjectivesList = document.querySelector('.mobile-content .objectives-list');
  if (mobileObjectivesList) {
    mobileObjectivesList.innerHTML = objectives.length ? objectives.map(obj => `<li>${escapeHtml(obj)}</li>`).join('') : '<li>No objectives provided.</li>';
  }
  const mobileMethodologyList = document.querySelector('.mobile-content .methodology-list');
  if (mobileMethodologyList) {
    mobileMethodologyList.innerHTML = methodology.length ? methodology.map(m => `<li>${escapeHtml(m)}</li>`).join('') : '<li>No methodology provided.</li>';
  }
  document.getElementById('mobileAdviser').textContent = adviserName;
  document.getElementById('mobileApprovedDate').textContent = approvedDate !== 'Not approved yet' ? approvedDate : 'Pending';
  document.getElementById('mobileDocId').textContent = docId;

  // Mobile file download
  const mobileDownloadBtn = document.getElementById('mobileDownloadBtn');
  if (proposal.file) {
    const fileUrl = `${window.location.origin}/uploads/proposals/${proposal.file}`;
    mobileDownloadBtn.onclick = () => window.open(fileUrl, '_blank');
    mobileDownloadBtn.querySelector('.filename').textContent = proposal.file;
  } else {
    mobileDownloadBtn.onclick = () => alert('No document attached.');
    mobileDownloadBtn.querySelector('.filename').textContent = 'No file';
  }
}

// ---------- Navigation helpers ----------
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

function updateSidebarLinks(role) {
  const dashboardLink = document.getElementById('dashboardLink');
  const profileLink = document.getElementById('profileLink');
  if (role === 'faculty') {
    dashboardLink.href = './faculty_dashboard.html';
    profileLink.href = './faculty_profile.html';
    const sidebarNav = document.querySelector('.sidebar-nav');
    let studentMgmtSection = sidebarNav.querySelector('.nav-section-label-student');
    if (!studentMgmtSection && sidebarNav) {
      const studentMgmtHtml = `
        <span class="nav-section-label nav-section-label-student">Student Management</span>
        <a href="./faculty_create.html" class="nav-item" id="createAccountsLink"><svg viewBox="0 0 16 16" fill="none"><path d="M2 3h12v10H2z" stroke="currentColor" stroke-width="1.3" fill="none"/><path d="M5 7h6M5 10h4" stroke="currentColor" stroke-width="1.2"/></svg>Create Student Accounts</a>
      `;
      const accountSection = sidebarNav.querySelector('.nav-section-label:last-of-type');
      if (accountSection) accountSection.insertAdjacentHTML('beforebegin', studentMgmtHtml);
      else sidebarNav.insertAdjacentHTML('beforeend', studentMgmtHtml);
    }
  } else {
    dashboardLink.href = './student_dashboard.html';
    profileLink.href = './student_profile.html';
    const studentMgmtSection = document.querySelector('.nav-section-label-student');
    if (studentMgmtSection) {
      studentMgmtSection.nextElementSibling?.remove();
      studentMgmtSection.remove();
    }
  }
}

function updateMobileNav(role) {
  const mobileDashboardLink = document.getElementById('mobileDashboardLink');
  const mobileProfileLink = document.getElementById('mobileProfileLink');
  const mobileNavUl = document.querySelector('.mobile-nav-links');
  if (role === 'faculty') {
    mobileDashboardLink.href = './faculty_dashboard.html';
    mobileProfileLink.href = './faculty_profile.html';
    if (!document.querySelector('.mobile-nav-links li a[href="./faculty_create.html"]')) {
      const createLi = document.createElement('li');
      createLi.innerHTML = '<a href="./faculty_create.html">Create Student Accounts</a>';
      mobileNavUl.appendChild(createLi);
    }
  } else {
    mobileDashboardLink.href = './student_dashboard.html';
    mobileProfileLink.href = './student_profile.html';
    const createLink = document.querySelector('.mobile-nav-links li a[href="./faculty_create.html"]');
    if (createLink) createLink.closest('li')?.remove();
  }
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

  // Optionally, make the sidebar logo link to index.html too
  const sidebarLogo = document.querySelector('.sidebar-logo');
  if (sidebarLogo) sidebarLogo.href = './index.html';
}

function renderAuthUI() {
  const user = getUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');

  if (user) {
    // User is logged in – show user info and role-based navigation
    const name = user.name || user.first_name + ' ' + user.last_name || 'User';
    const role = user.role || 'Student';
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
// ---------- Initialize ----------
document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  renderAuthUI();

  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');
  if (!proposalId) {
    showToast('No proposal ID provided.', 'error');
    document.querySelector('.study-container').innerHTML = '<div class="empty-state"><p>Invalid proposal link.</p><a href="archive.html" class="btn btn-primary">Back to Archive</a></div>';
    document.querySelector('.mobile-content .study-card-detail').innerHTML = '<div class="empty-state"><p>Invalid proposal link.</p><a href="archive.html" class="btn btn-primary">Back to Archive</a></div>';
    return;
  }
  loadProposal(proposalId);
});