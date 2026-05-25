const API_BASE = window.location.origin + '/api';

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getUser() {
  const token = getToken();
  if (!token) return null;
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
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

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '20px';
  toast.style.right = '20px';
  toast.style.backgroundColor = type === 'success' ? '#16a34a' : (type === 'error' ? '#dc2626' : '#436DE9');
  toast.style.color = 'white';
  toast.style.padding = '0.75rem 1.25rem';
  toast.style.borderRadius = 'var(--radius-full)';
  toast.style.fontSize = '0.875rem';
  toast.style.zIndex = '9999';
  toast.style.boxShadow = 'var(--shadow-md)';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function clearAuthAndRedirect() {
localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');

  localStorage.removeItem('faculty_create_pending_students');
  localStorage.removeItem('faculty_create_credential_history');

  window.location.href = './login_page.html';
}

function initHamburger(hamburgerSelector = 'hamburgerBtn', navSelector = 'mobileNav') {
  const hamburger = document.getElementById(hamburgerSelector);
  const mobileNav = document.getElementById(navSelector);
  if (!hamburger || !mobileNav) return;
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

async function fetchWithAuth(url, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`
  };
  return fetch(`${API_BASE}${url}`, { ...options, headers });
}