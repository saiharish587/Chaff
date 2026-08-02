// Local-only authentication (Firebase removed)

const STORAGE_KEY = 'chaff.session';

function readSession() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
}

function writeSession(session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

function getRoleFromUIFallback() {
  // Default to manufacturer if role is not explicitly chosen
  return (window.currentRole || 'manufacturer');
}

export function getCurrentSession() {
  return readSession();
}

export function requireRole(allowedRoles) {
  const session = readSession();
  if (!session || !allowedRoles.includes(session.role)) {
    window.location.href = '/index.html';
    return null;
  }
  return session;
}

export function logoutUser() {
  clearSession();
  window.location.href = '/index.html';
}

// Signup (mock): create session and route to profile pages
async function handleSignupMock(name, email) {
  const role = getRoleFromUIFallback();
  const session = {
    name: name || 'User',
    email: email || '',
    role,
    profileComplete: false,
    createdAt: new Date().toISOString()
  };
  writeSession(session);

  // Route to profile completion pages
  window.location.href = role === 'farmer'
    ? '/html/farmer_data.html'
    : '/html/manufacturer_registration.html';
}

// Login (mock): create session and route to dashboards
async function handleLoginMock(email) {
  const role = getRoleFromUIFallback();

  // Simple admin shortcut
  if ((email || '').toLowerCase() === 'admin@gmail.com') {
    writeSession({ name: 'Admin', email, role: 'admin', profileComplete: true });
    window.location.href = '/html/admin.html';
    return;
  }

  const session = readSession() || {
    name: role === 'farmer' ? 'Farmer' : 'Manufacturer',
    email: email || '',
    role,
    profileComplete: true
  };

  // Ensure the chosen role is respected
  session.role = role;
  session.profileComplete = true;
  writeSession(session);

  window.location.href = role === 'farmer'
    ? '/html/farmer-dashboard.html'
    : '/html/manufacturer-dashboard.html';
}

async function handleResetPasswordMock() {
  alert('Password reset is disabled in local-only mode.');
}

// Wire up the modal forms on index.html
document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const forgotPasswordForm = document.getElementById('forgotPasswordForm');

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail')?.value;
      await handleLoginMock(email);
    });
  }

  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('signupName')?.value;
      const email = document.getElementById('signupEmail')?.value;
      await handleSignupMock(name, email);
    });
  }

  if (forgotPasswordForm) {
    forgotPasswordForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleResetPasswordMock();
    });
  }

  // If user is already logged in, route them away from landing page
  const session = readSession();
  if (session?.role === 'admin') {
    window.location.href = '/html/admin.html';
  } else if (session?.role === 'farmer') {
    window.location.href = '/html/farmer-dashboard.html';
  } else if (session?.role === 'manufacturer') {
    window.location.href = '/html/manufacturer-dashboard.html';
  }
});
