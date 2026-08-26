/* ── API Helper ── */
const API_BASE = '';  // Vite proxy handles routing

/**
 * Get stored auth token
 */
export function getToken() {
  return localStorage.getItem('access_token');
}

/**
 * Get stored user info
 */
export function getUser() {
  const data = localStorage.getItem('user');
  return data ? JSON.parse(data) : null;
}

/**
 * Save auth data after login
 */
export function saveAuth(data) {
  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('user', JSON.stringify({
    user_id: data.user_id,
    username: data.username,
    role: data.role,
    full_name: data.full_name,
  }));
}

/**
 * Clear auth data
 */
export function clearAuth() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Make an authenticated API request
 */
export async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.headers || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    clearAuth();
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Request failed' }));
    // FastAPI validation errors return detail as an array of objects
    let message = 'Request failed';
    if (err.detail) {
      if (typeof err.detail === 'string') {
        message = err.detail;
      } else if (Array.isArray(err.detail)) {
        // e.g. [{loc: ['body','price'], msg: 'field required', type: ...}]
        message = err.detail.map(e => `${e.loc?.slice(-1)[0] ?? ''}: ${e.msg}`).join(', ');
      }
    }
    throw new Error(message);
  }

  // Handle downloads (PDF, Excel, CSV)
  const contentType = response.headers.get('content-type');
  if (contentType && (contentType.includes('pdf') || contentType.includes('spreadsheet') || contentType.includes('csv'))) {
    return response.blob();
  }

  return response.json();
}

/**
 * Login API call (uses form-encoded data as FastAPI OAuth2 expects)
 */
export async function loginAPI(username, password) {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Login failed' }));
    throw new Error(err.detail || 'Login failed');
  }

  return response.json();
}
