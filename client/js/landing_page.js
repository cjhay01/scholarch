
const hamburger = document.getElementById('hamburgerBtn');
const mobileNav = document.getElementById('mobile-nav');

function checkLoginStatus() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
    const user = JSON.parse(userStr);
    document.getElementById('loginBtn').style.display = 'none';
    const userMenu = document.getElementById('userMenu');
    userMenu.style.display = 'flex';
    userMenu.style.alignItems = 'center';
      document.getElementById('userName').textContent =
     `Welcome, ${escapeHtml(user.name.split(' ')[0])}`;


    document.getElementById('logoutBtn').onclick = (e) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        window.location.href = './index.html';
    };


    } else {
    document.getElementById('loginBtn').style.display = 'inline-block';
    document.getElementById('userMenu').style.display = 'none';
    }
}
document.addEventListener('DOMContentLoaded', checkLoginStatus);

function toggleMenu() {
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
    mobileNav.addEventListener('transitionend', function onEnd() {
    if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none';
    mobileNav.removeEventListener('transitionend', onEnd);
    });
}
}

hamburger.addEventListener('click', toggleMenu);

mobileNav.querySelectorAll('a').forEach(link => {
link.addEventListener('click', () => {
    mobileNav.classList.remove('is-open');
    hamburger.classList.remove('open');
    document.body.style.overflow = '';
    mobileNav.addEventListener('transitionend', function onEnd() {
    if (!mobileNav.classList.contains('is-open')) mobileNav.style.display = 'none';
    mobileNav.removeEventListener('transitionend', onEnd);
    });
});
});