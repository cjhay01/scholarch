// faculty_profile.js – first_name / last_name split

let currentUser = null;
let profileData = {
  first_name: '',
  last_name: '',
  email: '',
  contact: '',
  department: '',
  facultyId: '',
  bio: ''
};

let passwordModal, confirmModal;

function clearAuthAndRedirect() {
  localStorage.removeItem('token');
  sessionStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('user');
  window.location.href = './index.html';
}

// ---------- Load profile from backend ----------
async function loadProfileData() {
  const token = getToken();
  if (!token) return;

  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) {
      if (response.status === 401) throw new Error('Session expired');
      throw new Error('Failed to load profile');
    }
    const user = await response.json();
    currentUser = user;
    localStorage.setItem('user', JSON.stringify(user));
    profileData = {
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      contact: user.contact || '',
      department: user.department || 'CEIT',
      facultyId: user.user_id || '',
      bio: user.bio || ''
    };
    renderAuthUI();
  } catch (err) {
    console.error('Profile fetch error:', err);
    const localUser = getUser();
    if (localUser) {
      currentUser = localUser;
      profileData = {
        first_name: localUser.first_name || '',
        last_name: localUser.last_name || '',
        email: localUser.email || '',
        contact: localUser.contact || '',
        department: localUser.department || 'CEIT',
        facultyId: localUser.user_id || '',
        bio: localUser.bio || ''
      };
      showToast('Using cached profile data', 'warning');
    } else {
      showToast('Could not load profile', 'error');
    }
  } finally {
    updateProfileUI();
  }
}

function updateProfileUI() {
  const fullName = `${profileData.first_name} ${profileData.last_name}`;
  // Desktop
  document.getElementById('displayFirstName').innerText = profileData.first_name;
  document.getElementById('displayLastName').innerText = profileData.last_name;
  document.getElementById('displayEmail').innerText = profileData.email;
  document.getElementById('displayContact').innerText = profileData.contact;
  document.getElementById('displayDept').innerText = profileData.department;
  document.getElementById('displayFacultyId').innerText = profileData.facultyId;
  document.getElementById('displayBio').innerText = profileData.bio;
  document.getElementById('profileName').innerText = `${profileData.first_name} ${profileData.last_name}`.trim();
  document.getElementById('profileRole').innerHTML = `Faculty · ${profileData.department} Department · ${profileData.email}`;

  // Mobile – ensure there are at least 6 .info-value elements
  const mobileValues = document.querySelectorAll('#mobilePersonalView .info-value');
  if (mobileValues.length >= 6) {
    mobileValues[0].innerText = profileData.first_name;
    mobileValues[1].innerText = profileData.last_name;
    mobileValues[2].innerText = profileData.email;
    mobileValues[3].innerText = profileData.contact;
    mobileValues[4].innerText = profileData.department;
    mobileValues[5].innerText = profileData.facultyId;
  }
  const mobileBioDiv = document.querySelector('#mobileBioView .bio-text');
  if (mobileBioDiv) mobileBioDiv.innerText = profileData.bio;
  document.getElementById('mobileProfileName').innerText = `${profileData.first_name} ${profileData.last_name}`.trim();
  document.getElementById('mobileProfileRole').innerHTML = `Faculty · ${profileData.department} · ${profileData.email}`;
}

function setButtonsLoading(loading, ...buttons) {
  buttons.forEach(btn => {
    if (btn) {
      btn.disabled = loading;
      btn.textContent = loading ? 'Saving...' : (btn.dataset.originalText || 'Save');
      if (!btn.dataset.originalText) btn.dataset.originalText = 'Save';
    }
  });
}

async function savePersonal(isMobile = false) {
  const prefix = isMobile ? 'mobile' : '';
  const newFirstName = document.getElementById(`${prefix}EditFirstName`).value.trim();
  const newLastName = document.getElementById(`${prefix}EditLastName`).value.trim();
  const newEmail = document.getElementById(`${prefix}EditEmail`).value.trim();
  const newContact = document.getElementById(`${prefix}EditContact`).value.trim();
  const newDept = document.getElementById(`${prefix}EditDept`).value.trim();
  if (!newFirstName || !newLastName || !newEmail || !newContact || !newDept) {
    showToast('All fields are required.', 'error');
    return;
  }

  const token = getToken();
  const saveBtn = document.querySelector(`.btn-save[data-section="${prefix}personal"]`);
  setButtonsLoading(true, saveBtn);

  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: newFirstName,
        last_name: newLastName,
        email: newEmail,
        contact: newContact,
        department: newDept,
        bio: profileData.bio
      })
    });
    if (!response.ok) throw new Error('Failed to update profile');
    const updatedUser = await response.json();
    localStorage.setItem('user', JSON.stringify(updatedUser));
    currentUser = updatedUser;
    profileData = {
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      contact: updatedUser.contact,
      department: updatedUser.department,
      facultyId: updatedUser.user_id,
      bio: updatedUser.bio
    };
    updateProfileUI();
    cancelEdit('personal', isMobile);
    renderAuthUI();
    showToast('Personal information updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setButtonsLoading(false, saveBtn);
  }
}

async function saveBio(isMobile = false) {
  const prefix = isMobile ? 'mobile' : '';
  const newBio = document.getElementById(`${prefix}EditBio`).value;
  const token = getToken();
  const saveBtn = document.querySelector(`.btn-save[data-section="${prefix}bio"]`);
  setButtonsLoading(true, saveBtn);

  try {
    const response = await fetch(`${API_BASE}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        first_name: profileData.first_name,
        last_name: profileData.last_name,
        email: profileData.email,
        contact: profileData.contact,
        department: profileData.department,
        bio: newBio
      })
    });
    if (!response.ok) throw new Error('Failed to update bio');
    const updatedUser = await response.json();
    localStorage.setItem('user', JSON.stringify(updatedUser));
    currentUser = updatedUser;
    profileData.bio = updatedUser.bio;
    updateProfileUI();
    cancelEdit('bio', isMobile);
    showToast('Bio updated!', 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    setButtonsLoading(false, saveBtn);
  }
}

async function changePassword() {
  const current = document.getElementById('currentPw').value;
  const newPw = document.getElementById('newPw').value;
  const confirm = document.getElementById('confirmPw').value;
  if (!current || !newPw || !confirm) {
    showToast('Please fill all fields.', 'error');
    return;
  }
  if (newPw !== confirm) {
    showToast('New passwords do not match.', 'error');
    return;
  }
  const token = getToken();
  const updateBtn = document.getElementById('updatePasswordBtn');
  const originalText = updateBtn.textContent;
  updateBtn.disabled = true;
  updateBtn.textContent = 'Updating...';

  try {
    const response = await fetch(`${API_BASE}/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ currentPassword: current, newPassword: newPw })
    });
    if (!response.ok) throw new Error('Password change failed');
    showToast('Password changed successfully!', 'success');
    closePasswordModal();
    document.getElementById('currentPw').value = '';
    document.getElementById('newPw').value = '';
    document.getElementById('confirmPw').value = '';
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    updateBtn.disabled = false;
    updateBtn.textContent = originalText;
  }
}

function setupAvatarUpload(desktopFileInputId, desktopPreviewId, mobileFileInputId, mobilePreviewId) {
  const desktopInput = document.getElementById(desktopFileInputId);
  const desktopPreview = document.getElementById(desktopPreviewId);
  const mobileInput = document.getElementById(mobileFileInputId);
  const mobilePreview = document.getElementById(mobilePreviewId);

  async function uploadAvatar(file, imgElement) {
    const token = getToken();
    const formData = new FormData();
    formData.append('avatar', file);
    try {
      const response = await fetch(`${API_BASE}/users/avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      if (data.avatarUrl) {
        imgElement.src = data.avatarUrl;
      }
      showToast('Avatar updated!', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  }

  function handleFile(file, imgElement) {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) { imgElement.src = e.target.result; };
      reader.readAsDataURL(file);
      uploadAvatar(file, imgElement);
    }
  }

  if (desktopInput && desktopPreview) {
    desktopInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0], desktopPreview);
    });
  }
  if (mobileInput && mobilePreview) {
    mobileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0], mobilePreview);
    });
  }
}

function renderAuthUI() {
  const user = getUser();
  const authSection = document.getElementById('authSection');
  const topbarAuth = document.getElementById('topbarAuth');
  const mobileAuth = document.getElementById('mobileAuth');
  const mobileAvatar = document.getElementById('mobileAvatar');

  if (user) {
    const firstName = user.first_name || '';
    const lastName = user.last_name || '';
    const name = (firstName + ' ' + lastName).trim() || user.name || 'Faculty';
    const role = user.role || 'Faculty';
    const initial = (firstName.charAt(0) || lastName.charAt(0) || 'F').toUpperCase();

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

function toggleEdit(section, isMobile = false) {
  const prefix = isMobile ? 'mobile' : '';
  if (section === 'personal') {
    const view = document.getElementById(isMobile ? 'mobilePersonalView' : 'personalView');
    const edit = document.getElementById(isMobile ? 'mobilePersonalEdit' : 'personalEdit');
    if (view && edit) {
      view.style.display = 'none';
      edit.classList.add('active');
      if (!isMobile) {
        document.getElementById('editFirstName').value = profileData.first_name;
        document.getElementById('editLastName').value = profileData.last_name;
        document.getElementById('editEmail').value = profileData.email;
        document.getElementById('editContact').value = profileData.contact;
        document.getElementById('editDept').value = profileData.department;
        document.getElementById('editFacultyId').innerText = profileData.facultyId;
      } else {
        document.getElementById('mobileEditFirstName').value = profileData.first_name;
        document.getElementById('mobileEditLastName').value = profileData.last_name;
        document.getElementById('mobileEditEmail').value = profileData.email;
        document.getElementById('mobileEditContact').value = profileData.contact;
        document.getElementById('mobileEditDept').value = profileData.department;
        document.getElementById('mobileEditFacultyId').innerText = profileData.facultyId;
      }
    }
  } else if (section === 'bio') {
    const view = document.getElementById(isMobile ? 'mobileBioView' : 'bioView');
    const edit = document.getElementById(isMobile ? 'mobileBioEdit' : 'bioEdit');
    if (view && edit) {
      view.style.display = 'none';
      edit.classList.add('active');
      document.getElementById(`${prefix}EditBio`).value = profileData.bio;
    }
  }
}

function cancelEdit(section, isMobile = false) {
  const prefix = isMobile ? 'mobile' : '';
  if (section === 'personal') {
    const view = document.getElementById(isMobile ? 'mobilePersonalView' : 'personalView');
    const edit = document.getElementById(isMobile ? 'mobilePersonalEdit' : 'personalEdit');
    if (view && edit) {
      view.style.display = 'block';
      edit.classList.remove('active');
    }
  } else if (section === 'bio') {
    const view = document.getElementById(isMobile ? 'mobileBioView' : 'bioView');
    const edit = document.getElementById(isMobile ? 'mobileBioEdit' : 'bioEdit');
    if (view && edit) {
      view.style.display = 'block';
      edit.classList.remove('active');
    }
  }
}

function openPasswordModal() { passwordModal.classList.add('is-open'); }
function closePasswordModal() { passwordModal.classList.remove('is-open'); }
function confirmSignOut() { confirmModal.classList.add('is-open'); }
function closeConfirmModal() { confirmModal.classList.remove('is-open'); }
function signOut() { clearAuthAndRedirect(); }

// ---------- Event listeners ----------
document.addEventListener('DOMContentLoaded', () => {
  passwordModal = document.getElementById('passwordModal');
  confirmModal = document.getElementById('confirmModal');
  if (typeof initHamburger === 'function') initHamburger();
  renderAuthUI();
  loadProfileData();
  setupAvatarUpload('avatarFile', 'avatarPreview', 'mobileAvatarFile', 'mobileAvatarPreview');

  // Desktop edit buttons
  document.querySelectorAll('.edit-btn[data-section="personal"]').forEach(btn => {
    btn.addEventListener('click', () => toggleEdit('personal', false));
  });
  document.querySelectorAll('.edit-btn[data-section="bio"]').forEach(btn => {
    btn.addEventListener('click', () => toggleEdit('bio', false));
  });
  document.querySelectorAll('.btn-cancel-form[data-section="personal"]').forEach(btn => {
    btn.addEventListener('click', () => cancelEdit('personal', false));
  });
  document.querySelectorAll('.btn-cancel-form[data-section="bio"]').forEach(btn => {
    btn.addEventListener('click', () => cancelEdit('bio', false));
  });
  document.querySelectorAll('.btn-save[data-section="personal"]').forEach(btn => {
    btn.addEventListener('click', () => savePersonal(false));
  });
  document.querySelectorAll('.btn-save[data-section="bio"]').forEach(btn => {
    btn.addEventListener('click', () => saveBio(false));
  });

  // Mobile edit buttons
  document.querySelectorAll('.edit-btn[data-section="mobile-personal"]').forEach(btn => {
    btn.addEventListener('click', () => toggleEdit('personal', true));
  });
  document.querySelectorAll('.edit-btn[data-section="mobile-bio"]').forEach(btn => {
    btn.addEventListener('click', () => toggleEdit('bio', true));
  });
  document.querySelectorAll('.btn-cancel-form[data-section="mobile-personal"]').forEach(btn => {
    btn.addEventListener('click', () => cancelEdit('personal', true));
  });
  document.querySelectorAll('.btn-cancel-form[data-section="mobile-bio"]').forEach(btn => {
    btn.addEventListener('click', () => cancelEdit('bio', true));
  });
  document.querySelectorAll('.btn-save[data-section="mobile-personal"]').forEach(btn => {
    btn.addEventListener('click', () => savePersonal(true));
  });
  document.querySelectorAll('.btn-save[data-section="mobile-bio"]').forEach(btn => {
    btn.addEventListener('click', () => saveBio(true));
  });

  // Password modal
  const changePwBtn = document.getElementById('changePasswordBtn');
  const mobileChangePwBtn = document.getElementById('mobileChangePasswordBtn');
  if (changePwBtn) changePwBtn.addEventListener('click', openPasswordModal);
  if (mobileChangePwBtn) mobileChangePwBtn.addEventListener('click', openPasswordModal);
  document.getElementById('cancelPasswordBtn')?.addEventListener('click', closePasswordModal);
  document.getElementById('updatePasswordBtn')?.addEventListener('click', changePassword);

  // Sign out
  const signoutBtn = document.getElementById('signoutBtn');
  const mobileSignoutBtn = document.getElementById('mobileSignoutBtn');
  if (signoutBtn) signoutBtn.addEventListener('click', confirmSignOut);
  if (mobileSignoutBtn) mobileSignoutBtn.addEventListener('click', confirmSignOut);
  document.getElementById('cancelSignoutBtn')?.addEventListener('click', closeConfirmModal);
  document.getElementById('confirmSignoutBtn')?.addEventListener('click', signOut);

  // Close modals on background click or Escape
  [passwordModal, confirmModal].forEach(modal => {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('is-open'); });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      passwordModal.classList.remove('is-open');
      confirmModal.classList.remove('is-open');
    }
  });
});