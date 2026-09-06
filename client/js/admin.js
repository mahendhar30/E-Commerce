// Admin Portal Controller

let currentEditingProductId = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAdmin()) return;

  setupAdminNavigation();
  loadDashboardData();
  setupAddProductForm();
  setupEditProductForm();
});

// Sidebar Navigation
function setupAdminNavigation() {
  const links = document.querySelectorAll('.sidebar-link[data-tab]');
  links.forEach((link) => {
    link.addEventListener('click', () => {
      const tabId = link.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Admin user display
  const adminUser = Auth.getUser();
  const nameEl = document.getElementById('adminUserName');
  if (nameEl && adminUser) {
    nameEl.textContent = adminUser.name;
  }
}

function switchTab(tabId) {
  // Update sidebar active link
  document.querySelectorAll('.sidebar-link[data-tab]').forEach((l) => {
    l.classList.toggle('active', l.getAttribute('data-tab') === tabId);
  });

  // Update panels
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.id === `tab-${tabId}`);
  });

  // Update Topbar Title
  const titles = {
    dashboard: 'Dashboard Overview',
    products: 'Product Management',
    'add-product': 'Add New Product',
    orders: 'Customer Orders',
    customers: 'Customer Directory',
  };
  const titleEl = document.getElementById('adminPageTitle');
  if (titleEl) titleEl.textContent = titles[tabId] || 'Admin Panel';

  // Load relevant data on tab open
  if (tabId === 'dashboard') loadDashboardData();
  if (tabId === 'products') loadAdminProducts();
  if (tabId === 'orders') loadAdminOrders();
  if (tabId === 'customers') loadAdminCustomers();
}

// 1. Dashboard Metrics & Recent Orders
async function loadDashboardData() {
  try {
    const res = await API.get('/admin/metrics');
    if (res.success) {
      const { stats, recentOrders } = res;

      document.getElementById('statTotalProducts').textContent = stats.totalProducts || 0;
      document.getElementById('statTotalCustomers').textContent = stats.totalCustomers || 0;
      document.getElementById('statTotalOrders').textContent = stats.totalOrders || 0;
      document.getElementById('statPendingOrders').textContent = stats.pendingOrders || 0;
      document.getElementById('statTotalRevenue').textContent = formatPrice(stats.totalRevenue || 0);

      renderRecentOrdersTable(recentOrders || []);
    }
  } catch (error) {
    showToast('Failed to load dashboard metrics: ' + error.message, 'error');
  }
}

function renderRecentOrdersTable(orders = []) {
  const tbody = document.getElementById('recentOrdersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">No orders placed yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = orders
    .map((o) => {
      const dateStr = new Date(o.orderDate).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      return `
      <tr>
        <td><strong>#${o.orderId}</strong></td>
        <td>${o.customerDetails.fullName}</td>
        <td>${o.products.length} items</td>
        <td><strong>${formatPrice(o.totalAmount)}</strong></td>
        <td>
          <span class="status-badge status-${o.orderStatus.toLowerCase()}">
            ${o.orderStatus}
          </span>
        </td>
        <td>${dateStr}</td>
      </tr>
    `;
    })
    .join('');
}

// 2. Product Management
let adminProductSearchDebounce = null;

async function loadAdminProducts(keyword = '') {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Loading catalog items...</td></tr>`;

  try {
    const query = keyword ? `?keyword=${encodeURIComponent(keyword)}` : '';
    const res = await API.get(`/admin/products${query}`);

    if (res.success) {
      renderAdminProductsTable(res.products || []);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:20px;">${error.message}</td></tr>`;
  }
}

function handleProductSearch(input) {
  clearTimeout(adminProductSearchDebounce);
  adminProductSearchDebounce = setTimeout(() => {
    loadAdminProducts(input.value.trim());
  }, 350);
}

function renderAdminProductsTable(products = []) {
  const tbody = document.getElementById('adminProductsTableBody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">No products found.</td></tr>`;
    return;
  }

  tbody.innerHTML = products
    .map(
      (p) => `
    <tr>
      <td>
        <img src="${p.image}" alt="${p.name}" class="prod-thumb-sm" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'" />
      </td>
      <td>
        <div style="font-weight:700; color:#0f172a; max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          ${p.name}
        </div>
      </td>
      <td>
        <span class="badge-pill" style="background:#f1f5f9; color:#475569;">${p.category}</span>
      </td>
      <td><strong>${formatPrice(p.price)}</strong></td>
      <td>
        <span style="font-weight:700; color:${p.stock > 0 ? '#10b981' : '#ef4444'};">
          ${p.stock} units
        </span>
      </td>
      <td>★ ${p.rating ? p.rating.toFixed(1) : '4.5'}</td>
      <td>
        <div style="display:flex; gap:8px;">
          <button class="btn-sm btn-outline" onclick="openEditProductModal('${p._id}')" title="Edit Product">
            Edit
          </button>
          <button class="btn-sm btn-danger" onclick="deleteProduct('${p._id}')" title="Delete Product">
            Delete
          </button>
        </div>
      </td>
    </tr>
  `
    )
    .join('');
}

// Add Product Form
function setupAddProductForm() {
  const form = document.getElementById('addProductForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('addProdName').value.trim();
    const category = document.getElementById('addProdCategory').value.trim();
    const price = parseFloat(document.getElementById('addProdPrice').value);
    const stock = parseInt(document.getElementById('addProdStock').value, 10);
    const image = document.getElementById('addProdImage').value.trim();
    const description = document.getElementById('addProdDescription').value.trim();

    if (!name || !category || isNaN(price) || isNaN(stock) || !image || !description) {
      showToast('Please fill all product fields properly', 'error');
      return;
    }

    const btn = document.getElementById('btnSubmitAddProduct');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
      const res = await API.post('/admin/products', {
        name,
        category,
        price,
        stock,
        image,
        description,
      });

      if (res.success) {
        showToast('Product created successfully!', 'success');
        form.reset();
        switchTab('products');
      }
    } catch (error) {
      showToast(error.message || 'Failed to add product', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Publish Product';
    }
  });
}

// Edit Product Modal
async function openEditProductModal(productId) {
  try {
    const res = await API.get(`/products/${productId}`);
    if (res.success && res.product) {
      const p = res.product;
      currentEditingProductId = p._id;

      document.getElementById('editProdName').value = p.name;
      document.getElementById('editProdCategory').value = p.category;
      document.getElementById('editProdPrice').value = p.price;
      document.getElementById('editProdStock').value = p.stock;
      document.getElementById('editProdImage').value = p.image;
      document.getElementById('editProdDescription').value = p.description;

      document.getElementById('editProductModal').classList.add('show');
    }
  } catch (error) {
    showToast('Failed to load product details for editing', 'error');
  }
}

function closeEditProductModal() {
  currentEditingProductId = null;
  document.getElementById('editProductModal').classList.remove('show');
}

function setupEditProductForm() {
  const form = document.getElementById('editProductForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentEditingProductId) return;

    const payload = {
      name: document.getElementById('editProdName').value.trim(),
      category: document.getElementById('editProdCategory').value.trim(),
      price: parseFloat(document.getElementById('editProdPrice').value),
      stock: parseInt(document.getElementById('editProdStock').value, 10),
      image: document.getElementById('editProdImage').value.trim(),
      description: document.getElementById('editProdDescription').value.trim(),
    };

    try {
      const res = await API.put(`/admin/products/${currentEditingProductId}`, payload);
      if (res.success) {
        showToast('Product updated successfully!', 'success');
        closeEditProductModal();
        loadAdminProducts();
      }
    } catch (error) {
      showToast(error.message || 'Failed to update product', 'error');
    }
  });
}

// Delete product
async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
    return;
  }

  try {
    const res = await API.delete(`/admin/products/${productId}`);
    if (res.success) {
      showToast('Product deleted', 'info');
      loadAdminProducts();
    }
  } catch (error) {
    showToast(error.message || 'Failed to delete product', 'error');
  }
}

// 3. Orders Management
async function loadAdminOrders() {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px;">Loading customer orders...</td></tr>`;

  try {
    const res = await API.get('/admin/orders');
    if (res.success) {
      renderAdminOrdersTable(res.orders || []);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#ef4444; padding:20px;">${error.message}</td></tr>`;
  }
}

function renderAdminOrdersTable(orders = []) {
  const tbody = document.getElementById('adminOrdersTableBody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">No orders found.</td></tr>`;
    return;
  }

  const statuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

  tbody.innerHTML = orders
    .map((o) => {
      const dateStr = new Date(o.orderDate).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const optionsHtml = statuses
        .map(
          (st) =>
            `<option value="${st}" ${o.orderStatus === st ? 'selected' : ''}>${st}</option>`
        )
        .join('');

      return `
      <tr>
        <td><strong>#${o.orderId}</strong></td>
        <td>
          <div style="font-weight:700; color:#0f172a;">${o.customerDetails.fullName}</div>
          <div style="font-size:0.8rem; color:#64748b;">${o.customerDetails.phone}</div>
        </td>
        <td>
          <div style="font-size:0.85rem; color:#475569; max-width:220px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${o.customerDetails.deliveryAddress}, ${o.customerDetails.city}
          </div>
        </td>
        <td>${o.products.length} items</td>
        <td><strong>${formatPrice(o.totalAmount)}</strong></td>
        <td>
          <select class="status-select" onchange="updateOrderStatus('${o._id}', this.value)">
            ${optionsHtml}
          </select>
        </td>
        <td style="font-size:0.82rem; color:#64748b;">${dateStr}</td>
      </tr>
    `;
    })
    .join('');
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await API.put(`/admin/orders/${orderId}/status`, { status: newStatus });
    if (res.success) {
      showToast(`Order status changed to "${newStatus}"`, 'success');
      loadDashboardData(); // Refresh metrics
    }
  } catch (error) {
    showToast(error.message || 'Failed to update order status', 'error');
    loadAdminOrders(); // Revert dropdown
  }
}

// 4. Customers Management
async function loadAdminCustomers() {
  const tbody = document.getElementById('adminCustomersTableBody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px;">Loading customer directory...</td></tr>`;

  try {
    const res = await API.get('/admin/customers');
    if (res.success) {
      renderAdminCustomersTable(res.customers || []);
    }
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:#ef4444; padding:20px;">${error.message}</td></tr>`;
  }
}

function renderAdminCustomersTable(customers = []) {
  const tbody = document.getElementById('adminCustomersTableBody');
  if (!tbody) return;

  if (customers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">No registered customers yet.</td></tr>`;
    return;
  }

  tbody.innerHTML = customers
    .map((c) => {
      const regDate = new Date(c.createdAt).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      const addressStr = c.address
        ? typeof c.address === 'string'
          ? c.address
          : `${c.address.street || ''}, ${c.address.city || ''} ${c.address.state || ''}`
        : 'N/A';

      return `
      <tr>
        <td>
          <div style="font-weight:700; color:#0f172a;">${c.name}</div>
          <div style="font-size:0.8rem; color:#64748b;">${c.email}</div>
        </td>
        <td>${c.phone || 'N/A'}</td>
        <td>
          <div style="font-size:0.85rem; color:#475569; max-width:240px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${addressStr}
          </div>
        </td>
        <td>
          <span class="badge-pill" style="background:#eef2ff; color:#4f46e5; font-weight:700;">
            ${c.orderCount} orders
          </span>
        </td>
        <td><strong>${formatPrice(c.totalSpent || 0)}</strong></td>
        <td style="font-size:0.82rem; color:#64748b;">${regDate}</td>
      </tr>
    `;
    })
    .join('');
}
