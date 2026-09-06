// User & Session Authentication Manager

const Auth = {
  getToken() {
    return localStorage.getItem('token');
  },

  getUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  isAdmin() {
    const user = this.getUser();
    return user && user.role === 'admin';
  },

  setSession(user, token) {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  },

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    showToast('You have been logged out safely.', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 800);
  },

  requireAuth(redirectUrl = window.location.href) {
    if (!this.isLoggedIn()) {
      showToast('Please sign in to continue', 'warning');
      window.location.href = `/login.html?redirect=${encodeURIComponent(redirectUrl)}`;
      return false;
    }
    return true;
  },

  requireAdmin() {
    if (!this.isLoggedIn() || !this.isAdmin()) {
      showToast('Administrator access required', 'error');
      window.location.href = '/admin-login.html';
      return false;
    }
    return true;
  },

  async updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    if (!badge) return;

    if (!this.isLoggedIn()) {
      badge.textContent = '0';
      badge.style.display = 'none';
      return;
    }

    try {
      const res = await API.get('/cart');
      if (res.success && res.itemCount !== undefined) {
        badge.textContent = res.itemCount;
        badge.style.display = res.itemCount > 0 ? 'flex' : 'none';

        // Animate badge bump
        badge.classList.remove('bump');
        void badge.offsetWidth; // trigger reflow
        badge.classList.add('bump');
      }
    } catch (err) {
      console.warn('Failed to load cart count:', err.message);
    }
  },

  initNavbar() {
    const authActions = document.getElementById('navAuthActions');
    if (!authActions) return;

    const user = this.getUser();

    if (user && this.isLoggedIn()) {
      const initials = user.name
        ? user.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : 'U';

      authActions.innerHTML = `
        <div class="user-menu" id="userMenuDropdown">
          <button class="user-btn" id="userDropdownBtn" onclick="toggleUserDropdown(event)">
            <div class="user-avatar">${initials}</div>
            <span>${user.name.split(' ')[0]}</span>
            <span style="font-size: 0.75rem; color: #94a3b8;">▼</span>
          </button>
          <div class="user-dropdown" id="userDropdownMenu">
            <div style="padding: 8px 14px 10px; border-bottom: 1px solid #f1f5f9;">
              <div style="font-weight: 700; color: #0f172a; font-size: 0.92rem;">${user.name}</div>
              <div style="font-size: 0.78rem; color: #64748b; overflow: hidden; text-overflow: ellipsis;">${user.email}</div>
              ${user.role === 'admin' ? '<span style="display:inline-block; margin-top:4px; font-size:0.7rem; font-weight:700; background:#e0e7ff; color:#4f46e5; padding:2px 8px; border-radius:99px;">Admin</span>' : ''}
            </div>
            <a href="/orders.html" class="dropdown-item">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
              My Orders
            </a>
            ${
              user.role === 'admin'
                ? `<a href="/admin.html" class="dropdown-item" style="color: #4f46e5; font-weight: 700;">
                    <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                    Admin Panel
                   </a>`
                : ''
            }
            <div class="dropdown-divider"></div>
            <button onclick="Auth.logout()" class="dropdown-item danger">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Sign Out
            </button>
          </div>
        </div>
      `;
    } else {
      authActions.innerHTML = `
        <a href="/login.html" class="nav-link">Sign In</a>
        <a href="/register.html" class="btn-auth btn-primary">Register</a>
      `;
    }

    this.updateCartBadge();
  },
};

// Toggle user profile dropdown in navbar
function toggleUserDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('userDropdownMenu');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// Close dropdown on click outside
window.addEventListener('click', (e) => {
  const dropdown = document.getElementById('userDropdownMenu');
  if (dropdown && dropdown.classList.contains('show')) {
    dropdown.classList.remove('show');
  }
});

// Auto initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  Auth.initNavbar();
});
