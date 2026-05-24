// admin_dashboard.js – login state, charts, hamburger

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
          <path d="M7 12.5a2 2 0 0 0 4 0" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
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

// Charts
function createCharts() {
  const ctxDesktopUser = document.getElementById('desktopUserChart')?.getContext('2d');
  if (ctxDesktopUser) {
    new Chart(ctxDesktopUser, {
      type: 'bar',
      data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'New Users', data: [5, 8, 12, 9, 15, 18], backgroundColor: 'rgba(67, 109, 233, 0.7)', borderRadius: 8, barPercentage: 0.65 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { font: { size: 11 } } } }, scales: { y: { grid: { color: '#eef2f6' }, ticks: { stepSize: 5 } }, x: { grid: { display: false } } } }
    });
  }
  const ctxDesktopSub = document.getElementById('desktopSubmissionsChart')?.getContext('2d');
  if (ctxDesktopSub) {
    new Chart(ctxDesktopSub, {
      type: 'doughnut',
      data: { labels: ['Thesis', 'Research Proposal', 'Capstone'], datasets: [{ data: [52, 42, 30], backgroundColor: ['#436DE9', '#f0e400', '#d97706'], borderWidth: 0, hoverOffset: 8 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, usePointStyle: true } } }, cutout: '60%' }
    });
  }

  const ctxMobileUser = document.getElementById('mobileUserChart')?.getContext('2d');
  if (ctxMobileUser) {
    new Chart(ctxMobileUser, {
      type: 'bar',
      data: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], datasets: [{ label: 'New Users', data: [5, 8, 12, 9, 15, 18], backgroundColor: 'rgba(67, 109, 233, 0.7)', borderRadius: 6, barPercentage: 0.7 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top', labels: { font: { size: 10 } } } }, scales: { y: { ticks: { stepSize: 5 } }, x: { ticks: { font: { size: 10 } } } } }
    });
  }
  const ctxMobileSub = document.getElementById('mobileSubmissionsChart')?.getContext('2d');
  if (ctxMobileSub) {
    new Chart(ctxMobileSub, {
      type: 'doughnut',
      data: { labels: ['Thesis', 'Proposal', 'Capstone'], datasets: [{ data: [52, 42, 30], backgroundColor: ['#436DE9', '#f0e400', '#d97706'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 }, usePointStyle: true } } }, cutout: '55%' }
    });
  }
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  renderAuthUI();
  createCharts();

  // Fallback for charts if canvas elements are not ready
  setTimeout(() => {
    if (!document.getElementById('desktopUserChart')?.__chart__) createCharts();
  }, 100);
});