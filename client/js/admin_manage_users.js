// admin_manage_users.js – dynamic user management (admin only)
// ---------- Auth & role check ----------
function renderAuthUI() {
  const user = getUser();

  // Must be logged in AND be an admin
  if (!user || user.role !== 'admin') {
    window.location.href = './login_page.html';
    return;
  }

  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');
  const mobileAvatar = document.getElementById('mobileAvatar');

  const name = user.name || 'Admin';
  const role = user.role || 'Administrator';

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
    // Attach logout modal trigger
    document.getElementById('desktopLogoutBtn')?.addEventListener('click', showLogoutModal);
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
    document.getElementById('mobileLogoutBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      showLogoutModal();
    });
  }

  if (mobileAvatar) mobileAvatar.textContent = initial;
}

// ---------- Logout confirmation modal ----------
function showLogoutModal() {
  document.getElementById('logoutModal').classList.add('is-open');
}

function hideLogoutModal() {
  document.getElementById('logoutModal').classList.remove('is-open');
}

// ---------- Data fetching ----------
let allUsers = [];

async function fetchUsers() {
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/users`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    allUsers = await res.json();
  } catch (err) {
    console.error(err);
    allUsers = [];
  }
}

// ---------- Rendering ----------
function renderUserLists() {
  const container = document.getElementById('mainContent');
  const mobileContainer = document.getElementById('mobileUsersContainer');
  if (!container) return;

  const facultyList = allUsers.filter(u => u.role === 'faculty');
  const students = allUsers.filter(u => u.role === 'student');

  // Group students by year_and_section
  const groupedStudents = {};
  students.forEach(s => {
    const sec = s.year_and_section || 'Unassigned';
    if (!groupedStudents[sec]) groupedStudents[sec] = [];
    groupedStudents[sec].push(s);
  });

  // ---- Desktop view ----
  let html = '';

  // Faculty section
  html += `<div class="section-title"><span>Faculty</span><button class="add-btn" id="addFacultyBtnDesktop">+ Add Faculty</button></div>`;
  html += `<div class="user-list" id="facultyList">`;
  facultyList.forEach(f => {
    html += userCardHTML(f, 'faculty');
  });
  if (facultyList.length === 0) html += '<div class="empty-state">No faculty members found.</div>';
  html += `</div>`;

  // Students section
  html += `<div class="section-title"><span>Students</span></div>`;
  for (const [section, studentList] of Object.entries(groupedStudents)) {
    html += `<div class="student-group"><div class="group-title">${escapeHtml(section)}</div><div class="user-list">`;
    studentList.forEach(s => {
      html += userCardHTML(s, 'student');
    });
    html += `</div></div>`;
  }
  if (Object.keys(groupedStudents).length === 0) {
    html += '<div class="empty-state">No students found.</div>';
  }

  container.innerHTML = html;

  // ---- Mobile view ----
  if (mobileContainer) {
    let mobileHtml = '';
    mobileHtml += `<div class="section-title"><span>Faculty</span><button class="add-btn" id="addFacultyBtnMobile">+ Add Faculty</button></div><div class="user-list">`;
    facultyList.forEach(f => {
      mobileHtml += userCardHTML(f, 'faculty');
    });
    if (facultyList.length === 0) mobileHtml += '<div class="empty-state">No faculty members found.</div>';
    mobileHtml += `</div><div class="section-title"><span>Students</span></div>`;
    for (const [section, studentList] of Object.entries(groupedStudents)) {
      mobileHtml += `<div class="group-title">${escapeHtml(section)}</div><div class="user-list">`;
      studentList.forEach(s => {
        mobileHtml += userCardHTML(s, 'student');
      });
      mobileHtml += `</div>`;
    }
    if (Object.keys(groupedStudents).length === 0) {
      mobileHtml += '<div class="empty-state">No students found.</div>';
    }
    mobileContainer.innerHTML = mobileHtml;
    attachMobileEvents();
  }

  attachDesktopEvents();
}

function userCardHTML(user, role) {
  const firstName = user.first_name || 'Unknown';
  const lastName = user.last_name || 'Unknown';
  const badge = role === 'faculty' ? 'Faculty' : 'Student';
  return `
    <div class="user-list-item" data-id="${user._id}" data-role="${role}" data-section="${escapeHtml(user.year_and_section || '')}">
      <div class="user-info">
        <div class="user-name-line">
          <span class="user-fullname">${escapeHtml(firstName)} ${escapeHtml(lastName)}</span>
          <span class="user-badge">${badge}</span>
        </div>
        <div class="user-details">
          <span>ID: ${escapeHtml(user.user_id)}</span>
          <span>Email: ${escapeHtml(user.email)}</span>
          <span>Contact: ${escapeHtml(user.contact || '—')}</span>
        </div>
      </div>
      <div class="user-actions">
        <button class="edit-btn" data-id="${user._id}" data-role="${role}">Edit</button>
        ${role === 'faculty' ? `<button class="delete-btn" data-id="${user._id}" data-role="faculty">Delete</button>` : ''}
      </div>
    </div>
  `;
}

// ---------- Event handling ----------
function attachDesktopEvents() {
  document.getElementById('addFacultyBtnDesktop')?.addEventListener('click', openAddFacultyModal);
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openEditModal(btn.dataset.id, btn.dataset.role); };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openDeleteModal(btn.dataset.id); };
  });
}

function attachMobileEvents() {
  document.getElementById('addFacultyBtnMobile')?.addEventListener('click', openAddFacultyModal);
  document.querySelectorAll('#mobileUsersContainer .edit-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openEditModal(btn.dataset.id, btn.dataset.role); };
  });
  document.querySelectorAll('#mobileUsersContainer .delete-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); openDeleteModal(btn.dataset.id); };
  });
}

// ---------- Edit Modal ----------
let currentEditId = null;

function openEditModal(userId, role) {
  const user = allUsers.find(u => u._id === userId);
  if (!user) return;

  document.getElementById('editUserId').value = user.user_id;
  document.getElementById('editFirstName').value = user.first_name || '';
  document.getElementById('editLastName').value = user.last_name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editContact').value = user.contact || '';
  document.getElementById('editPassword').value = '';
  currentEditId = user._id;
  document.getElementById('editModal').classList.add('is-open');
}

async function saveEdit() {
  const firstName = document.getElementById('editFirstName').value.trim();
  const lastName = document.getElementById('editLastName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const contact = document.getElementById('editContact').value.trim();
  const password = document.getElementById('editPassword').value.trim();

  if (!firstName || !lastName || !email || !contact) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const body = { first_name: firstName, last_name: lastName, email, contact };
  if (password) body.password = password;

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/users/${currentEditId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Failed to update user');
    document.getElementById('editModal').classList.remove('is-open');
    await fetchUsers();
    renderUserLists();
  } catch (err) {
    console.error(err);
    showToast('Error updating user. See console.', 'error');
  }
}

// ---------- Delete Modal ----------
let deleteTargetId = null;

function openDeleteModal(userId) {
  deleteTargetId = userId;
  document.getElementById('deleteConfirmModal').classList.add('is-open');
}

async function confirmDelete() {
  if (!deleteTargetId) return;
  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/users/${deleteTargetId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Delete failed');
    document.getElementById('deleteConfirmModal').classList.remove('is-open');
    deleteTargetId = null;
    await fetchUsers();
    renderUserLists();
  } catch (err) {
    console.error(err);
    showToast('Error deleting user. See console.', 'error');
  }
}

// ---------- Add Faculty Modal ----------
function openAddFacultyModal() {
  document.getElementById('facultyId').value = '';
  document.getElementById('facultyFirstName').value = '';
  document.getElementById('facultyLastName').value = '';
  document.getElementById('facultyEmail').value = '';
  document.getElementById('facultyContact').value = '';
  document.getElementById('facultyPassword').value = '';
  document.getElementById('addFacultyModal').classList.add('is-open');
}

async function saveNewFaculty() {
  const userId = document.getElementById('facultyId').value.trim();
  const firstName = document.getElementById('facultyFirstName').value.trim();
  const lastName = document.getElementById('facultyLastName').value.trim();
  const email = document.getElementById('facultyEmail').value.trim();
  const contact = document.getElementById('facultyContact').value.trim();
  const password = document.getElementById('facultyPassword').value.trim();

  if (!userId || !firstName || !lastName || !email || !contact) {
    showToast('Please fill all required fields.', 'error');
    return;
  }

  const body = {
    user_id: userId,
    name: `${firstName} ${lastName}`,
    email,
    contact,
    role: 'faculty'
  };
  if (password) body.password = password;

  const token = getToken();
  try {
    const res = await fetch(`${API_BASE}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('Failed to create faculty');
    document.getElementById('addFacultyModal').classList.remove('is-open');
    await fetchUsers();
    renderUserLists();
  } catch (err) {
    console.error(err);
    showToast('Error creating faculty. See console.', 'error');
  }
}

// ---------- Init ----------
document.addEventListener('DOMContentLoaded', async () => {
  initHamburger();
  renderAuthUI();
  const user = getUser();
  if (!user || user.role !== 'admin') return;

  // Replace edit modal fields (from first/last name to single Name)
  const editModal = document.getElementById('editModal');
  if (editModal) {
    editModal.querySelector('.modal').innerHTML = `
      <h3>Edit User</h3>
      <div class="field"><label>School ID</label><input type="text" id="editUserId" class="readonly-input" readonly></div>
      <div class="field"><label>Name</label><input type="text" id="editName"></div>
      <div class="field"><label>Email</label><input type="email" id="editEmail"></div>
      <div class="field"><label>Contact</label><input type="tel" id="editContact"></div>
      <div class="field"><label>New Password (leave blank to keep current)</label><input type="password" id="editPassword" placeholder="Enter new password"></div>
      <div class="modal-actions"><button class="btn-secondary" id="cancelEditBtn">Cancel</button><button class="btn-primary" id="saveEditBtn">Save Changes</button></div>
    `;
    document.getElementById('saveEditBtn').onclick = saveEdit;
    document.getElementById('cancelEditBtn').onclick = () => editModal.classList.remove('is-open');
  }

  // Bind other modal buttons
  document.getElementById('confirmDeleteBtn').onclick = confirmDelete;
  document.getElementById('cancelDeleteBtn').onclick = () => document.getElementById('deleteConfirmModal').classList.remove('is-open');
  document.getElementById('saveFacultyBtn').onclick = saveNewFaculty;
  document.getElementById('cancelFacultyBtn').onclick = () => document.getElementById('addFacultyModal').classList.remove('is-open');

  // Logout modal buttons
  document.getElementById('confirmLogoutBtn').onclick = () => {
    hideLogoutModal();
    clearAuthAndRedirect();
  };
  document.getElementById('cancelLogoutBtn').onclick = hideLogoutModal;

  // Close modals on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('is-open');
    });
  });

  await fetchUsers();
  renderUserLists();
});
