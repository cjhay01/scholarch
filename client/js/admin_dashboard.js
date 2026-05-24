// admin_dashboard.js 

// ---------- Logout confirmation modal ----------
function showLogoutModal() {
  document.getElementById('logoutModal').classList.add('is-open');
}

function hideLogoutModal() {
  document.getElementById('logoutModal').classList.remove('is-open');
}

// ------------------- Auth & role check -------------------
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

  // Update welcome banner with admin name
  const welcomeHeading = document.querySelector('.welcome-heading');
  if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${escapeHtml(name)} 👋`;

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
        <path d="M7 12.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
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

// ------------------- Data fetching -------------------
async function fetchUserCount() {
  try {
    const res = await fetch('/api/userCount', {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
    if (!res.ok) throw new Error('Failed to fetch user count');
    return await res.json();   // { current, previous }
  } catch (err) {
    console.error(err);
    return { current: 0, previous: 0 };
  }
}

async function fetchStudyCount() {
  try {
    const res = await fetch('/api/studyCount', {
     headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    if (!res.ok) throw new Error('Failed to fetch study count');
    return await res.json();   // { current, previous }
  } catch (err) {
    console.error(err);
    return { current: 0, previous: 0 };
  }
}

async function fetchUserGrowth() {
  try {
    const res = await fetch('/api/userGrowth', {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
    if (!res.ok) throw new Error('Failed to fetch user growth');
    return await res.json();   // [{ month, newUsers }]
  } catch (err) {
    console.error(err);
    return [];
  }
}

// ------------------- Charts -------------------
let desktopUserChart, desktopSubmissionsChart;
let mobileUserChart, mobileSubmissionsChart;

function createCharts(userGrowthData) {
  const months = userGrowthData.map(d => d.month) || ['Jan','Feb','Mar','Apr','May','Jun'];
  const newUsers = userGrowthData.map(d => d.newUsers) || [5,8,12,9,15,18];

  // Desktop bar chart
  const ctxDesktopUser = document.getElementById('desktopUserChart')?.getContext('2d');
  if (ctxDesktopUser) {
    if (desktopUserChart) desktopUserChart.destroy();
    desktopUserChart = new Chart(ctxDesktopUser, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'New Users',
          data: newUsers,
          backgroundColor: 'rgba(67, 109, 233, 0.7)',
          borderRadius: 8,
          barPercentage: 0.65
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } },
        scales: {
          y: { grid: { color: '#eef2f6' }, ticks: { stepSize: 5 } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  // Desktop doughnut (hardcoded: 100% Research Proposal)
  const ctxDesktopSub = document.getElementById('desktopSubmissionsChart')?.getContext('2d');
  if (ctxDesktopSub) {
    if (desktopSubmissionsChart) desktopSubmissionsChart.destroy();
    desktopSubmissionsChart = new Chart(ctxDesktopSub, {
      type: 'doughnut',
      data: {
        labels: ['Research Proposal'],
        datasets: [{
          data: [100],
          backgroundColor: ['#436DE9'],
          borderWidth: 0,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } },
        cutout: '60%'
      }
    });
  }

  // Mobile bar chart
  const ctxMobileUser = document.getElementById('mobileUserChart')?.getContext('2d');
  if (ctxMobileUser) {
    if (mobileUserChart) mobileUserChart.destroy();
    mobileUserChart = new Chart(ctxMobileUser, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [{
          label: 'New Users',
          data: newUsers,
          backgroundColor: 'rgba(67, 109, 233, 0.7)',
          borderRadius: 6,
          barPercentage: 0.7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } },
        scales: {
          y: { ticks: { stepSize: 5 } },
          x: { ticks: { font: { size: 10 } } }
        }
      }
    });
  }

  // Mobile doughnut (hardcoded)
  const ctxMobileSub = document.getElementById('mobileSubmissionsChart')?.getContext('2d');
  if (ctxMobileSub) {
    if (mobileSubmissionsChart) mobileSubmissionsChart.destroy();
    mobileSubmissionsChart = new Chart(ctxMobileSub, {
      type: 'doughnut',
      data: {
        labels: ['Research Proposal'],
        datasets: [{
          data: [100],
          backgroundColor: ['#436DE9'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } },
        cutout: '55%'
      }
    });
  }
}

// ------------------- Update UI with data -------------------
function updateStats(userCount, studyCount) {
  document.getElementById('desktopTotalUsers').textContent = userCount.current || 0;
  document.getElementById('desktopArchivedStudies').textContent = studyCount.current || 0;

  document.getElementById('mobileTotalUsers').textContent = userCount.current || 0;
  document.getElementById('mobileArchivedStudies').textContent = studyCount.current || 0;

  function calcPercent(current, previous) {
    if (!previous || previous === 0) return null;
    return (((current - previous) / previous) * 100).toFixed(0);
  }

  const userPercent = calcPercent(userCount.current, userCount.previous);
  const studyPercent = calcPercent(studyCount.current, studyCount.previous);

  const desktopUserTrend = document.querySelector('.stat-card:nth-child(1) .stat-trend');
  const desktopStudyTrend = document.querySelector('.stat-card:nth-child(2) .stat-trend');
  if (desktopUserTrend) {
    desktopUserTrend.innerHTML = userPercent !== null
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> ${userPercent > 0 ? '+' : ''}${userPercent}%`
      : '';
  }
  if (desktopStudyTrend) {
    desktopStudyTrend.innerHTML = studyPercent !== null
      ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg> ${studyPercent > 0 ? '+' : ''}${studyPercent}%`
      : '';
  }

  const mobileUserTrend = document.querySelector('.mobile-stat-card:nth-child(1) .mobile-stat-right');
  const mobileStudyTrend = document.querySelector('.mobile-stat-card:nth-child(2) .mobile-stat-right');
  if (mobileUserTrend) {
    mobileUserTrend.textContent = userPercent !== null ? `${userPercent > 0 ? '+' : ''}${userPercent}%` : '';
  }
  if (mobileStudyTrend) {
    mobileStudyTrend.textContent = studyPercent !== null ? `${studyPercent > 0 ? '+' : ''}${studyPercent}%` : '';
  }
}

// ------------------- Init -------------------
async function initDashboard() {
  renderAuthUI();

  const user = getUser();
  if (!user || user.role !== 'admin') return;

  const [userCount, studyCount, userGrowth] = await Promise.all([
    fetchUserCount(),
    fetchStudyCount(),
    fetchUserGrowth()
  ]);

  updateStats(userCount, studyCount);
  createCharts(userGrowth);
}

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initDashboard();

  // Logout modal handlers
  document.getElementById('confirmLogoutBtn')?.addEventListener('click', () => {
    hideLogoutModal();
    clearAuthAndRedirect();
  });
  document.getElementById('cancelLogoutBtn')?.addEventListener('click', hideLogoutModal);

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
  });
});