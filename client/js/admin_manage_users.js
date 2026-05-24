// admin_manage_users.js – login state + user management

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

// ---------- User management logic (original) ----------
let users = {
  faculty: [
    { id: "F001", firstName: "Glicel", lastName: "Reyes", email: "glicel.reyes@plv.edu.ph", contact: "09123456789", role: "faculty", password: "faculty123" },
    { id: "F002", firstName: "Ramon", lastName: "Mendoza", email: "ramon.mendoza@plv.edu.ph", contact: "09234567890", role: "faculty", password: "faculty123" },
    { id: "F003", firstName: "Maria", lastName: "Cruz", email: "maria.cruz@plv.edu.ph", contact: "09345678901", role: "faculty", password: "faculty123" },
    { id: "F004", firstName: "Jose", lastName: "Santos", email: "jose.santos@plv.edu.ph", contact: "09456789012", role: "faculty", password: "faculty123" }
  ],
  students: {
    "BSIT 2-11": [
      { id: "23-1234", firstName: "Juan", lastName: "Dela Cruz", email: "juan.delacruz@plv.edu.ph", contact: "09123456789", role: "student", section: "BSIT 2-11", password: "delacruz1234" },
      { id: "23-1235", firstName: "Maria", lastName: "Santos", email: "maria.santos@plv.edu.ph", contact: "09234567890", role: "student", section: "BSIT 2-11", password: "santos1235" },
      { id: "23-1236", firstName: "Pedro", lastName: "Reyes", email: "pedro.reyes@plv.edu.ph", contact: "09345678901", role: "student", section: "BSIT 2-11", password: "reyes1236" }
    ],
    "BSIT 2-1": [
      { id: "23-2001", firstName: "John", lastName: "Cruz", email: "john.cruz@plv.edu.ph", contact: "09345678901", role: "student", section: "BSIT 2-1", password: "cruz2001" },
      { id: "23-2002", firstName: "Jane", lastName: "Garcia", email: "jane.garcia@plv.edu.ph", contact: "09456789012", role: "student", section: "BSIT 2-1", password: "garcia2002" }
    ],
    "BSIT 2-2": [
      { id: "23-2101", firstName: "Mark", lastName: "Fernandez", email: "mark.fernandez@plv.edu.ph", contact: "09567890123", role: "student", section: "BSIT 2-2", password: "fernandez2101" },
      { id: "23-2102", firstName: "Liza", lastName: "Lopez", email: "liza.lopez@plv.edu.ph", contact: "09678901234", role: "student", section: "BSIT 2-2", password: "lopez2102" }
    ],
    "BSIT 2-3": [
      { id: "23-2201", firstName: "Kevin", lastName: "Martinez", email: "kevin.martinez@plv.edu.ph", contact: "09789012345", role: "student", section: "BSIT 2-3", password: "martinez2201" }
    ]
  }
};

let currentEditUser = null;
let currentDeleteUser = null;

function renderUI() {
  const container = document.getElementById('mainContent');
  const mobileContainer = document.getElementById('mobileUsersContainer');
  if (!container) return;

  let facultyHtml = `<div class="section-title"><span>Faculty</span><button class="add-btn" id="addFacultyBtnDesktop">+ Add Faculty</button></div>`;
  facultyHtml += `<div class="user-list" id="facultyList">`;
  users.faculty.forEach(f => {
    facultyHtml += `
      <div class="user-list-item" data-id="${f.id}" data-role="faculty">
        <div class="user-info">
          <div class="user-name-line"><span class="user-fullname">${escapeHtml(f.firstName)} ${escapeHtml(f.lastName)}</span><span class="user-badge">Faculty</span></div>
          <div class="user-details"><span>Email: ${escapeHtml(f.email)}</span> <span>Contact: ${escapeHtml(f.contact)}</span></div>
        </div>
        <div class="user-actions"><button class="edit-btn" data-id="${f.id}" data-role="faculty">Edit</button><button class="delete-btn" data-id="${f.id}" data-role="faculty">Delete</button></div>
      </div>`;
  });
  facultyHtml += `</div>`;

  facultyHtml += `<div class="section-title"><span>Students</span></div>`;
  for (const [section, studentList] of Object.entries(users.students)) {
    facultyHtml += `<div class="student-group"><div class="group-title">${escapeHtml(section)}</div><div class="user-list">`;
    studentList.forEach(s => {
      facultyHtml += `
        <div class="user-list-item" data-id="${s.id}" data-role="student" data-section="${section}">
          <div class="user-info">
            <div class="user-name-line"><span class="user-fullname">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</span><span class="user-badge">Student</span></div>
            <div class="user-details"><span>Email: ${escapeHtml(s.email)}</span> <span>Contact: ${escapeHtml(s.contact)}</span></div>
          </div>
          <div class="user-actions"><button class="edit-btn" data-id="${s.id}" data-role="student" data-section="${section}">Edit</button><button class="delete-btn" data-id="${s.id}" data-role="student" data-section="${section}">Delete</button></div>
        </div>`;
    });
    facultyHtml += `</div></div>`;
  }
  container.innerHTML = facultyHtml;

  if (mobileContainer) {
    let mobileHtml = `<div class="section-title"><span>Faculty</span><button class="add-btn" id="addFacultyBtnMobile">+ Add Faculty</button></div><div class="user-list">`;
    users.faculty.forEach(f => {
      mobileHtml += `<div class="user-list-item"><div class="user-info"><div class="user-name-line"><span class="user-fullname">${escapeHtml(f.firstName)} ${escapeHtml(f.lastName)}</span><span class="user-badge">Faculty</span></div><div class="user-details">Email: ${escapeHtml(f.email)}<br>Contact: ${escapeHtml(f.contact)}</div></div><div class="user-actions"><button class="edit-btn" data-id="${f.id}" data-role="faculty">Edit</button><button class="delete-btn" data-id="${f.id}" data-role="faculty">Delete</button></div></div>`;
    });
    mobileHtml += `</div><div class="section-title"><span>Students</span></div>`;
    for (const [section, studentList] of Object.entries(users.students)) {
      mobileHtml += `<div class="group-title">${escapeHtml(section)}</div><div class="user-list">`;
      studentList.forEach(s => {
        mobileHtml += `<div class="user-list-item"><div class="user-info"><div class="user-name-line"><span class="user-fullname">${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</span><span class="user-badge">Student</span></div><div class="user-details">Email: ${escapeHtml(s.email)}<br>Contact: ${escapeHtml(s.contact)}</div></div><div class="user-actions"><button class="edit-btn" data-id="${s.id}" data-role="student" data-section="${section}">Edit</button><button class="delete-btn" data-id="${s.id}" data-role="student" data-section="${section}">Delete</button></div></div>`;
      });
      mobileHtml += `</div>`;
    }
    mobileContainer.innerHTML = mobileHtml;
    attachMobileEvents();
  }
  attachEvents();
}

function attachEvents() {
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.removeEventListener('click', editHandler);
    btn.addEventListener('click', editHandler);
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.removeEventListener('click', deleteHandler);
    btn.addEventListener('click', deleteHandler);
  });
  const addFacultyDesktop = document.getElementById('addFacultyBtnDesktop');
  if (addFacultyDesktop) addFacultyDesktop.onclick = () => openAddFacultyModal();
}

function attachMobileEvents() {
  document.querySelectorAll('#mobileUsersContainer .edit-btn').forEach(btn => {
    btn.removeEventListener('click', editHandler);
    btn.addEventListener('click', editHandler);
  });
  document.querySelectorAll('#mobileUsersContainer .delete-btn').forEach(btn => {
    btn.removeEventListener('click', deleteHandler);
    btn.addEventListener('click', deleteHandler);
  });
  const addFacultyMobile = document.getElementById('addFacultyBtnMobile');
  if (addFacultyMobile) addFacultyMobile.onclick = () => openAddFacultyModal();
}

function editHandler(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const id = btn.getAttribute('data-id');
  const role = btn.getAttribute('data-role');
  let user = null;
  if (role === 'faculty') {
    user = users.faculty.find(f => f.id === id);
  } else {
    const section = btn.getAttribute('data-section');
    user = users.students[section]?.find(s => s.id === id);
  }
  if (user) {
    currentEditUser = { ...user, role, section: btn.getAttribute('data-section') };
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editFirstName').value = user.firstName;
    document.getElementById('editLastName').value = user.lastName;
    document.getElementById('editEmail').value = user.email;
    document.getElementById('editContact').value = user.contact;
    document.getElementById('editPassword').value = '';
    document.getElementById('editModal').classList.add('is-open');
  }
}

function deleteHandler(e) {
  e.stopPropagation();
  const btn = e.currentTarget;
  const id = btn.getAttribute('data-id');
  const role = btn.getAttribute('data-role');
  const section = btn.getAttribute('data-section');
  currentDeleteUser = { id, role, section };
  document.getElementById('deleteConfirmModal').classList.add('is-open');
}

function openAddFacultyModal() {
  document.getElementById('facultyId').value = '';
  document.getElementById('facultyFirstName').value = '';
  document.getElementById('facultyLastName').value = '';
  document.getElementById('facultyEmail').value = '';
  document.getElementById('facultyContact').value = '';
  document.getElementById('facultyPassword').value = '';
  document.getElementById('addFacultyModal').classList.add('is-open');
}

document.getElementById('saveEditBtn').onclick = () => {
  if (!currentEditUser) return;
  const newFirstName = document.getElementById('editFirstName').value.trim();
  const newLastName = document.getElementById('editLastName').value.trim();
  const newEmail = document.getElementById('editEmail').value.trim();
  const newContact = document.getElementById('editContact').value.trim();
  const newPassword = document.getElementById('editPassword').value.trim();
  if (!newFirstName || !newLastName || !newEmail || !newContact) {
    alert('All fields except password are required.');
    return;
  }
  if (currentEditUser.role === 'faculty') {
    const faculty = users.faculty.find(f => f.id === currentEditUser.id);
    if (faculty) {
      faculty.firstName = newFirstName;
      faculty.lastName = newLastName;
      faculty.email = newEmail;
      faculty.contact = newContact;
      if (newPassword) faculty.password = newPassword;
    }
  } else {
    const section = currentEditUser.section;
    const student = users.students[section]?.find(s => s.id === currentEditUser.id);
    if (student) {
      student.firstName = newFirstName;
      student.lastName = newLastName;
      student.email = newEmail;
      student.contact = newContact;
      if (newPassword) student.password = newPassword;
    }
  }
  renderUI();
  document.getElementById('editModal').classList.remove('is-open');
  currentEditUser = null;
};

document.getElementById('confirmDeleteBtn').onclick = () => {
  if (!currentDeleteUser) return;
  if (currentDeleteUser.role === 'faculty') {
    users.faculty = users.faculty.filter(f => f.id !== currentDeleteUser.id);
  } else {
    const section = currentDeleteUser.section;
    if (users.students[section]) {
      users.students[section] = users.students[section].filter(s => s.id !== currentDeleteUser.id);
      if (users.students[section].length === 0) delete users.students[section];
    }
  }
  renderUI();
  document.getElementById('deleteConfirmModal').classList.remove('is-open');
  currentDeleteUser = null;
};

document.getElementById('saveFacultyBtn').onclick = () => {
  const id = document.getElementById('facultyId').value.trim();
  const firstName = document.getElementById('facultyFirstName').value.trim();
  const lastName = document.getElementById('facultyLastName').value.trim();
  const email = document.getElementById('facultyEmail').value.trim();
  const contact = document.getElementById('facultyContact').value.trim();
  const password = document.getElementById('facultyPassword').value.trim() || 'faculty123';
  if (!id || !firstName || !lastName || !email || !contact) {
    alert('Please fill all fields.');
    return;
  }
  if (users.faculty.some(f => f.id === id)) {
    alert('Faculty ID already exists.');
    return;
  }
  users.faculty.push({ id, firstName, lastName, email, contact, role: 'faculty', password });
  renderUI();
  document.getElementById('addFacultyModal').classList.remove('is-open');
};

document.getElementById('cancelEditBtn').onclick = () => document.getElementById('editModal').classList.remove('is-open');
document.getElementById('cancelDeleteBtn').onclick = () => document.getElementById('deleteConfirmModal').classList.remove('is-open');
document.getElementById('cancelFacultyBtn').onclick = () => document.getElementById('addFacultyModal').classList.remove('is-open');

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('is-open'); });
});

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

document.addEventListener('DOMContentLoaded', () => {
  renderAuthUI();
  renderUI();
});