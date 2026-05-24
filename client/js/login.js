function redirectByRole(role) {
  const r = role.toLowerCase();
  if (r === 'admin') window.location.href = '/admin_dashboard.html';
  else if (r === 'faculty') window.location.href = '/faculty_dashboard.html';
  else window.location.href = '/student_dashboard.html';
}


async function handleLogin(username, password, remember) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Login failed');

    const userData = {
      _id: data._id,
      user_id: data.user_id,
      first_name: data.first_name,
      last_name: data.last_name,
      username: data.username,
      role: data.role,
      email: data.email,
      contact: data.contact || "",
      department: data.department || "CEIT",
      bio: data.bio || "",
      proposals: data.proposals || [],
      year_and_section: data.year_and_section || "",
    };

    if (remember) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(userData));
    }

    const role = data.role.toLowerCase();
    redirectByRole(role);

    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function showStatus(type, message) {
  const statusEl = document.getElementById('login-status');
  statusEl.className = `status-msg ${type}`;
  statusEl.textContent = message;
}

function onLoginSubmit() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const remember = document.getElementById('remember-checkbox').checked;

  if (!username || !password) {
    showStatus('error', 'Username and password are required.');
    return;
  }
  showStatus('success', 'Signing you in...');
  handleLogin(username, password, remember).then(result => {
    if (!result.success) showStatus('error', result.message);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // If already logged in (token exists), redirect
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const role = user.role.toLowerCase();
      redirectByRole(role);
      return;
    }
  }

  const loginBtn = document.getElementById('login-btn');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  loginBtn.addEventListener('click', onLoginSubmit);
  [usernameInput, passwordInput].forEach(input => {
    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') onLoginSubmit(); });
  });
});