// faculty_create.js – account creation + login state + API integration

function getUser() {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) return null;
  const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

function getToken() {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
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
    const name = user.name || user.first_name + ' ' + user.last_name || 'Faculty';
    const role = user.role || 'Faculty';
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

// ---------- Account creation logic ----------
let pendingStudents = [];
let credentialHistory = [];   // each entry: { id, timestamp, sectionName, credentialsData }

function isValidStudent(s) {
  const idPattern = /^\d{2}-\d{4}$/;
  const yearSecPattern = /^[A-Za-z]+ \d+-\d+$/;
  if (!idPattern.test(s.studentId)) return false;
  if (!yearSecPattern.test(s.yearSection)) return false;
  if (!s.firstName || !s.lastName || !s.email || !s.contact) return false;
  if (!/^\S+@\S+\.\S+$/.test(s.email)) return false;
  if (!/^\d{7,15}$/.test(s.contact.replace(/\D/g, ''))) return false;
  return true;
}
function isDuplicate(id) { return pendingStudents.some(s => s.studentId === id); }

function addStudents(studentsArray) {
  let added = 0, dup = 0, inv = 0;
  for (let s of studentsArray) {
    if (!isValidStudent(s)) { inv++; continue; }
    if (isDuplicate(s.studentId)) { dup++; continue; }
    pendingStudents.push({ ...s });
    added++;
  }
  renderAll();
  if (inv || dup) {
    let msg = [];
    if (inv) msg.push(`${inv} invalid`);
    if (dup) msg.push(`${dup} duplicates`);
    showToast(msg.join(', '), 'warning');
  } else if (added) showToast(`Added ${added} student(s).`, 'success');
  return added;
}

function removeStudent(idx) {
  pendingStudents.splice(idx, 1);
  renderAll();
  showToast('Removed.', 'info');
}

function renderAll() {
  // desktop table
  const tbody = document.getElementById('pendingBody');
  const pcSpan = document.getElementById('pendingCount');
  const totalSpan = document.getElementById('totalPendingSpan');
  pcSpan.innerText = pendingStudents.length;
  totalSpan.innerText = pendingStudents.length;
  if (pendingStudents.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="7">No pending accounts. Add manually or upload a file.</table></tr>';
  } else {
    tbody.innerHTML = '';
    pendingStudents.forEach((s, idx) => {
      const r = tbody.insertRow();
      r.insertCell(0).innerText = s.studentId;
      r.insertCell(1).innerText = s.firstName;
      r.insertCell(2).innerText = s.lastName;
      r.insertCell(3).innerText = s.yearSection;
      r.insertCell(4).innerText = s.email;
      r.insertCell(5).innerText = s.contact;
      const actionCell = r.insertCell(6);
      const del = document.createElement('button');
      del.className = 'action-btn';
      del.innerHTML = '🗑️';
      del.onclick = () => removeStudent(idx);
      actionCell.appendChild(del);
    });
  }

  // mobile pending list
  const mobileList = document.getElementById('mobilePendingList');
  const mobileCountSpan = document.getElementById('mobilePendingCount');
  const mobileTotalSpan = document.getElementById('mobileTotalPendingSpan');
  if (mobileCountSpan) mobileCountSpan.innerText = pendingStudents.length;
  if (mobileTotalSpan) mobileTotalSpan.innerText = pendingStudents.length;
  if (mobileList) {
    mobileList.innerHTML = '';
    if (pendingStudents.length === 0) {
      mobileList.innerHTML = '<div class="mobile-card">No pending accounts.</div>';
    } else {
      const heading = document.createElement('h3');
      heading.textContent = 'Pending Accounts';
      heading.style.marginBottom = '0.5rem';
      mobileList.appendChild(heading);
      pendingStudents.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'mobile-card';
        card.innerHTML = `
          <div><strong>${escapeHtml(s.studentId)}</strong> - ${escapeHtml(s.firstName)} ${escapeHtml(s.lastName)}</div>
          <div>${escapeHtml(s.yearSection)} | ${escapeHtml(s.email)} | ${escapeHtml(s.contact)}</div>
          <button class="btn btn-outline" style="margin-top:0.5rem; padding:0.2rem 0.8rem;" onclick="removeStudent(${idx})">Remove</button>
        `;
        mobileList.appendChild(card);
      });
    }
  }
  renderHistoryList();
}

// Store credentials returned from backend
function addToHistoryFromCredentials(credentialsArray, sectionName) {
  if (!credentialsArray.length) return;
  const now = new Date();
  const timestamp = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
  const id = Date.now();
  // Transform backend credentials to the format expected by renderHistoryList / exports
  const mapped = credentialsArray.map(c => ({
    studentId: c.user_id,           // backend returns user_id
    firstName: c.first_name,
    lastName: c.last_name,
    yearSection: sectionName,
    email: '',                       // not needed for history display, but keep structure
    username: c.username,
    password: c.password
  }));
  credentialHistory.unshift({ id, timestamp, sectionName, credentialsData: mapped });
  renderHistoryList();
}

function renderHistoryList() {
  const container = document.getElementById('historyListContainer');
  const mobileContainer = document.getElementById('mobileHistoryList');
  if (!container) return;
  if (credentialHistory.length === 0) {
    const emptyHtml = `
      <div class="empty-state-history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="8" y1="10" x2="16" y2="10" />
          <line x1="8" y1="14" x2="12" y2="14" />
        </svg>
        <p>No credentials generated yet.</p>
        <p style="font-size:0.75rem;">Create accounts to generate login credentials.</p>
      </div>
    `;
    container.innerHTML = emptyHtml;
    if (mobileContainer) mobileContainer.innerHTML = emptyHtml;
    return;
  }
  let html = '<ul class="history-list">';
  credentialHistory.forEach(entry => {
    const displayName = `${entry.sectionName} - ${entry.timestamp}`;
    html += `
      <li class="history-item" data-id="${entry.id}">
        <div class="history-info">
          <div class="history-filename">${escapeHtml(displayName)}</div>
          <div class="history-timestamp">${entry.timestamp}</div>
        </div>
        <div class="history-actions">
          <button class="btn btn-outline history-csv" data-id="${entry.id}">CSV</button>
          <button class="btn btn-outline history-excel" data-id="${entry.id}">Excel</button>
          <button class="btn-icon-danger history-delete" data-id="${entry.id}" title="Delete"><svg width="1.2rem" height="1.2rem" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>
        </div>
      </li>
    `;
  });
  html += '</ul>';
  container.innerHTML = html;
  if (mobileContainer) mobileContainer.innerHTML = html;

  function csvHandler(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    const entry = credentialHistory.find(e => e.id === id);
    if (entry) downloadCSV(entry.credentialsData, entry.sectionName.replace(/\s+/g, '_') + '_' + entry.timestamp.replace(/[,\s:]/g, '_'));
  }
  function excelHandler(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    const entry = credentialHistory.find(e => e.id === id);
    if (entry) downloadExcel(entry.credentialsData, entry.sectionName.replace(/\s+/g, '_') + '_' + entry.timestamp.replace(/[,\s:]/g, '_'));
  }
  function deleteHandler(e) {
    const id = parseInt(e.currentTarget.getAttribute('data-id'));
    credentialHistory = credentialHistory.filter(e => e.id !== id);
    renderHistoryList();
    showToast('History entry removed.', 'info');
  }

  container.querySelectorAll('.history-csv').forEach(btn => {
    btn.removeEventListener('click', csvHandler);
    btn.addEventListener('click', csvHandler);
  });
  container.querySelectorAll('.history-excel').forEach(btn => {
    btn.removeEventListener('click', excelHandler);
    btn.addEventListener('click', excelHandler);
  });
  container.querySelectorAll('.history-delete').forEach(btn => {
    btn.removeEventListener('click', deleteHandler);
    btn.addEventListener('click', deleteHandler);
  });
  if (mobileContainer) {
    mobileContainer.querySelectorAll('.history-csv').forEach(btn => {
      btn.removeEventListener('click', csvHandler);
      btn.addEventListener('click', csvHandler);
    });
    mobileContainer.querySelectorAll('.history-excel').forEach(btn => {
      btn.removeEventListener('click', excelHandler);
      btn.addEventListener('click', excelHandler);
    });
    mobileContainer.querySelectorAll('.history-delete').forEach(btn => {
      btn.removeEventListener('click', deleteHandler);
      btn.addEventListener('click', deleteHandler);
    });
  }
}

function downloadCSV(credentials, baseName) {
  const headers = ['Student ID', 'First Name', 'Last Name', 'Year & Section', 'Email', 'Username', 'Password'];
  const rows = credentials.map(c => [c.studentId, c.firstName, c.lastName, c.yearSection, c.email, c.username, c.password]);
  const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.setAttribute('download', `${baseName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadExcel(credentials, baseName) {
  const wsData = [
    ['Student ID', 'First Name', 'Last Name', 'Year & Section', 'Email', 'Username', 'Password'],
    ...credentials.map(c => [c.studentId, c.firstName, c.lastName, c.yearSection, c.email, c.username, c.password])
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Credentials');
  XLSX.writeFile(wb, `${baseName}.xlsx`);
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

// ---------- API call to create accounts ----------
async function createAllAccounts() {
  if (pendingStudents.length === 0) {
    showToast('No pending accounts.', 'error');
    return;
  }

  const user = getUser();
  if (!user || !user.user_id) {
    showToast('Faculty information missing. Please log in again.', 'error');
    return;
  }

  const facultyId = user.user_id;   // use user_id, not _id
  const token = getToken();
  if (!token) {
    showToast('Authentication token missing. Please log in again.', 'error');
    return;
  }

  // Prepare request body: array of student objects
  const studentsToCreate = pendingStudents.map(s => ({
    user_id: s.studentId,
    first_name: s.firstName,
    last_name: s.lastName,
    year_and_section: s.yearSection,
    email: s.email,
    contact: s.contact,
    role: "Student",
    bio: "",
    proposals: [],
    adviser_id: facultyId,
    creator_id: facultyId
  }));

  // Show loading modal
  const modalOverlay = document.getElementById('actionModal');
  const modalLoading = document.getElementById('modalLoading');
  const modalSuccessDiv = document.getElementById('modalSuccess');
  const successMsgSpan = document.getElementById('successMessage');
  function showLoadingModal() { modalLoading.style.display = 'block'; modalSuccessDiv.style.display = 'none'; modalOverlay.classList.add('is-open'); }
  function showSuccessModal(msg) { modalLoading.style.display = 'none'; modalSuccessDiv.style.display = 'block'; successMsgSpan.innerText = msg; }
  function closeModal() { modalOverlay.classList.remove('is-open'); }
  showLoadingModal();

  try {
    const response = await fetch('/api/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(studentsToCreate)   // send array directly
    });

    const data = await response.json();

    if (!response.ok) {
      // HTTP error (4xx, 5xx)
      let errorMsg = `Server error (${response.status})`;
      if (data.message) errorMsg = data.message;
      else if (data.error) errorMsg = data.error;
      throw new Error(errorMsg);
    }

    // Handle success (200) and partial success (207)
    let createdCredentials = [];
    let errors = [];

    if (response.status === 207 && data.created && data.errors) {
      // Partial success
      createdCredentials = data.created;
      errors = data.errors;
    } else if (Array.isArray(data)) {
      // Full success – response is array of credentials
      createdCredentials = data;
    } else if (data.created && Array.isArray(data.created)) {
      // Alternative: object with created array
      createdCredentials = data.created;
      errors = data.errors || [];
    } else {
      throw new Error('Unexpected response format from server');
    }

    if (createdCredentials.length > 0) {
      // Determine section name (use first student's yearSection)
      const sectionName = pendingStudents[0]?.yearSection || 'Unknown Section';
      // Add to history
      addToHistoryFromCredentials(createdCredentials, sectionName);
      // Remove successfully created students from pending list
      const successfulIds = new Set(createdCredentials.map(c => c.user_id));
      pendingStudents = pendingStudents.filter(s => !successfulIds.has(s.studentId));
      renderAll();
      showSuccessModal(`Successfully created ${createdCredentials.length} student account(s). Login credentials have been generated.`);
      // Auto-close modal after 3 seconds
      setTimeout(closeModal, 3000);
    } else {
      // No students created
      throw new Error('No accounts were created.');
    }

    // Show errors if any
    if (errors.length > 0) {
      const errorList = errors.map(e => `${e.user_id}: ${e.message}`).join('; ');
      showToast(`Partial success. Errors: ${errorList}`, 'warning');
    }
  } catch (err) {
    console.error('Account creation failed:', err);
    showToast(`Failed to create accounts: ${err.message}`, 'error');
    closeModal();
  }
}

// ---------- Desktop manual add ----------
document.getElementById('addManualBtn').addEventListener('click', () => {
  const student = {
    studentId: document.getElementById('studentId').value.trim(),
    firstName: document.getElementById('firstName').value.trim(),
    lastName: document.getElementById('lastName').value.trim(),
    yearSection: document.getElementById('yearSection').value.trim(),
    email: document.getElementById('email').value.trim(),
    contact: document.getElementById('contact').value.trim()
  };
  if (!isValidStudent(student)) {
    showToast('Check format (xx-xxxx, BSIT 2-11, email, contact).', 'error');
    return;
  }
  if (isDuplicate(student.studentId)) {
    showToast(`Duplicate ID ${student.studentId}`, 'error');
    return;
  }
  pendingStudents.push(student);
  renderAll();
  document.getElementById('studentId').value = '';
  document.getElementById('firstName').value = '';
  document.getElementById('lastName').value = '';
  document.getElementById('yearSection').value = '';
  document.getElementById('email').value = '';
  document.getElementById('contact').value = '';
  showToast('Student added.', 'success');
});

// ---------- Desktop bulk upload (unchanged) ----------
const fileInput = document.getElementById('fileInput');
const uploadZone = document.getElementById('uploadZone');
const previewContainer = document.getElementById('previewContainer');
const previewBody = document.getElementById('previewBody');
let parsedRows = [];

function handleFile(file, isMobile = false) {
  const ext = file.name.split('.').pop().toLowerCase();
  if (!['xlsx', 'xls', 'csv'].includes(ext)) {
    showToast('Upload Excel/CSV.', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const data = new Uint8Array(e.target.result);
    let workbook;
    if (ext === 'csv') workbook = XLSX.read(new TextDecoder().decode(data), { type: 'string' });
    else workbook = XLSX.read(data, { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    if (!rows || rows.length < 2) {
      showToast('File empty.', 'error');
      return;
    }
    const headers = rows[0];
    const colMap = {};
    headers.forEach((h, idx) => {
      const key = String(h).toLowerCase().replace(/\s/g, '');
      if (key.includes('studentid')) colMap.studentId = idx;
      else if (key.includes('firstname')) colMap.firstName = idx;
      else if (key.includes('lastname')) colMap.lastName = idx;
      else if (key.includes('year') || key.includes('section')) colMap.yearSection = idx;
      else if (key.includes('email')) colMap.email = idx;
      else if (key.includes('contact') || key.includes('phone')) colMap.contact = idx;
    });
    if (!colMap.studentId || !colMap.firstName || !colMap.lastName || !colMap.yearSection || !colMap.email || !colMap.contact) {
      showToast('Missing columns.', 'error');
      return;
    }
    parsedRows = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const student = {
        studentId: row[colMap.studentId] ? String(row[colMap.studentId]).trim() : '',
        firstName: row[colMap.firstName] ? String(row[colMap.firstName]).trim() : '',
        lastName: row[colMap.lastName] ? String(row[colMap.lastName]).trim() : '',
        yearSection: row[colMap.yearSection] ? String(row[colMap.yearSection]).trim() : '',
        email: row[colMap.email] ? String(row[colMap.email]).trim() : '',
        contact: row[colMap.contact] ? String(row[colMap.contact]).trim() : ''
      };
      if (student.studentId && student.firstName && student.lastName) parsedRows.push(student);
    }
    if (parsedRows.length === 0) {
      showToast('No valid rows.', 'error');
      return;
    }
    if (isMobile) {
      const mobilePreviewBody = document.getElementById('mobilePreviewBody');
      mobilePreviewBody.innerHTML = '';
      parsedRows.slice(0, 5).forEach(s => {
        const r = mobilePreviewBody.insertRow();
        r.insertCell(0).innerText = s.studentId;
        r.insertCell(1).innerText = s.firstName;
        r.insertCell(2).innerText = s.lastName;
        r.insertCell(3).innerText = s.yearSection;
        r.insertCell(4).innerText = s.email;
        r.insertCell(5).innerText = s.contact;
      });
      if (parsedRows.length > 5) {
        const info = mobilePreviewBody.insertRow();
        info.insertCell(0).colSpan = 6;
        info.cells[0].innerText = `... and ${parsedRows.length - 5} more`;
      }
      document.getElementById('mobilePreviewContainer').style.display = 'block';
      document.getElementById('mobileUploadZone').style.display = 'none';
    } else {
      previewBody.innerHTML = '';
      parsedRows.slice(0, 5).forEach(s => {
        const r = previewBody.insertRow();
        r.insertCell(0).innerText = s.studentId;
        r.insertCell(1).innerText = s.firstName;
        r.insertCell(2).innerText = s.lastName;
        r.insertCell(3).innerText = s.yearSection;
        r.insertCell(4).innerText = s.email;
        r.insertCell(5).innerText = s.contact;
      });
      if (parsedRows.length > 5) {
        const info = previewBody.insertRow();
        info.insertCell(0).colSpan = 6;
        info.cells[0].innerText = `... and ${parsedRows.length - 5} more`;
      }
      previewContainer.style.display = 'block';
      uploadZone.style.display = 'none';
    }
  };
  reader.readAsArrayBuffer(file);
}

uploadZone.addEventListener('click', () => fileInput.click());
uploadZone.addEventListener('dragover', e => { e.preventDefault(); uploadZone.style.borderColor = 'var(--clr-brand)'; });
uploadZone.addEventListener('dragleave', () => uploadZone.style.borderColor = 'var(--clr-border)');
uploadZone.addEventListener('drop', e => {
  e.preventDefault();
  uploadZone.style.borderColor = 'var(--clr-border)';
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0], false);
});
fileInput.addEventListener('change', e => { if (e.target.files.length) handleFile(e.target.files[0], false); });
document.getElementById('cancelUploadBtn').addEventListener('click', () => {
  previewContainer.style.display = 'none';
  uploadZone.style.display = 'block';
  fileInput.value = '';
  parsedRows = [];
});
document.getElementById('confirmUploadBtn').addEventListener('click', () => {
  if (parsedRows.length) addStudents(parsedRows);
  previewContainer.style.display = 'none';
  uploadZone.style.display = 'block';
  fileInput.value = '';
  parsedRows = [];
});

// Mobile bulk upload
const mobileFileInput = document.getElementById('mobileFileInput');
const mobileUploadZone = document.getElementById('mobileUploadZone');
mobileUploadZone.addEventListener('click', () => mobileFileInput.click());
mobileUploadZone.addEventListener('dragover', e => { e.preventDefault(); mobileUploadZone.style.borderColor = 'var(--clr-brand)'; });
mobileUploadZone.addEventListener('dragleave', () => mobileUploadZone.style.borderColor = 'var(--clr-border)');
mobileUploadZone.addEventListener('drop', e => {
  e.preventDefault();
  mobileUploadZone.style.borderColor = 'var(--clr-border)';
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0], true);
});
mobileFileInput.addEventListener('change', e => { if (e.target.files.length) handleFile(e.target.files[0], true); });
document.getElementById('mobileCancelUploadBtn').addEventListener('click', () => {
  document.getElementById('mobilePreviewContainer').style.display = 'none';
  mobileUploadZone.style.display = 'block';
  mobileFileInput.value = '';
  parsedRows = [];
});
document.getElementById('mobileConfirmUploadBtn').addEventListener('click', () => {
  if (parsedRows.length) addStudents(parsedRows);
  document.getElementById('mobilePreviewContainer').style.display = 'none';
  mobileUploadZone.style.display = 'block';
  mobileFileInput.value = '';
  parsedRows = [];
});

// Mobile manual add
document.getElementById('mobileAddManualBtn').addEventListener('click', () => {
  const student = {
    studentId: document.getElementById('mobileStudentId').value.trim(),
    firstName: document.getElementById('mobileFirstName').value.trim(),
    lastName: document.getElementById('mobileLastName').value.trim(),
    yearSection: document.getElementById('mobileYearSection').value.trim(),
    email: document.getElementById('mobileEmail').value.trim(),
    contact: document.getElementById('mobileContact').value.trim()
  };
  if (!isValidStudent(student)) {
    showToast('Check format.', 'error');
    return;
  }
  if (isDuplicate(student.studentId)) {
    showToast(`Duplicate ID ${student.studentId}`, 'error');
    return;
  }
  pendingStudents.push(student);
  renderAll();
  document.getElementById('mobileStudentId').value = '';
  document.getElementById('mobileFirstName').value = '';
  document.getElementById('mobileLastName').value = '';
  document.getElementById('mobileYearSection').value = '';
  document.getElementById('mobileEmail').value = '';
  document.getElementById('mobileContact').value = '';
  showToast('Student added.', 'success');
});

// Attach the new createAllAccounts to both buttons
document.getElementById('submitAllBtn').addEventListener('click', createAllAccounts);
document.getElementById('mobileSubmitAllBtn').addEventListener('click', createAllAccounts);

// Modal close button (reused from old code, but we keep it)
const modalCloseBtn = document.getElementById('modalCloseBtn');
if (modalCloseBtn) modalCloseBtn.addEventListener('click', () => {
  document.getElementById('actionModal').classList.remove('is-open');
});

// Hamburger
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
  renderAll();
});