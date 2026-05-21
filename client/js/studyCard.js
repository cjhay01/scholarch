// studyCard.js – guaranteed login button

function getUser() {
  // Only return user if token also exists
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
  window.location.href = 'index.html';
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

  if (user) {
    // Logged in – show user info
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
    if (mobileAuth) {
      mobileAuth.innerHTML = `<a href="#" id="mobileLogoutBtn" class="btn-nav-auth">Log out</a>`;
      document.getElementById('mobileLogoutBtn')?.addEventListener('click', clearAuthAndRedirect);
    }
  } else {
    // NOT logged in – show login buttons (with inline styles as fallback)
    if (authSection) {
      authSection.innerHTML = '<a href="./login_page.html" class="login-btn" style="display:block; background:#436DE9; color:white; text-align:center; padding:10px; border-radius:50px; text-decoration:none; font-weight:500;">Log in</a>';
    }
    if (topbarAuth) {
      topbarAuth.innerHTML = '<a href="./login_page.html" class="topbar-login-btn" style="background:#436DE9; color:white; padding:5px 12px; border-radius:50px; text-decoration:none; font-size:0.75rem;">Log in</a>';
    }
    if (mobileAuth) {
      mobileAuth.innerHTML = '<a href="./login_page.html" class="btn-nav-auth" style="background:#436DE9; color:white; border:none; display:block; text-align:center; padding:10px; border-radius:50px;">Log in</a>';
    }
  }
}

// Download buttons (unchanged)
const desktopDownload = document.getElementById('desktopDownloadBtn');
const mobileDownload = document.getElementById('mobileDownloadBtn');
function handleDownload() {
  alert('Download started (demo)\nFile: Smart_Attendance_Facial_Recognition.pdf');
}
if (desktopDownload) desktopDownload.addEventListener('click', handleDownload);
if (mobileDownload) mobileDownload.addEventListener('click', handleDownload);

// Hamburger menu (unchanged)
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

// Run on page load
document.addEventListener('DOMContentLoaded', renderAuthUI);

// Fallback: if after 0.5 seconds the login buttons still aren't visible, force them
setTimeout(() => {
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');
  if (authSection && authSection.innerHTML.trim() === '') {
    authSection.innerHTML = '<a href="./login_page.html" style="display:block; background:#436DE9; color:white; text-align:center; padding:10px; border-radius:50px; text-decoration:none;">Log in</a>';
  }
  if (topbarAuth && topbarAuth.innerHTML.trim() === '') {
    topbarAuth.innerHTML = '<a href="./login_page.html" style="background:#436DE9; color:white; padding:5px 12px; border-radius:50px; text-decoration:none;">Log in</a>';
  }
  if (mobileAuth && mobileAuth.innerHTML.trim() === '') {
    mobileAuth.innerHTML = '<a href="./login_page.html" style="background:#436DE9; color:white; display:block; text-align:center; padding:10px; border-radius:50px; text-decoration:none;">Log in</a>';
  }
}, 500);