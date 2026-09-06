// Shop Homepage / Dashboard Controller

let currentCategory = 'all';
let currentSearch = '';
let currentSort = '';
let debounceTimer = null;

// Initialize Homepage
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  loadProducts();
});

function setupEventListeners() {
  // Search bar input with debounce
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        currentSearch = e.target.value.trim();
        loadProducts();
      }, 350);
    });
  }

  // Sort dropdown
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      loadProducts();
    });
  }
}

// Fetch and render products with active filters
async function loadProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  grid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px 0;">
      <div style="display: inline-block; width: 40px; height: 40px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 14px; color: #64748b; font-weight: 600;">Loading amazing products...</p>
    </div>
  `;

  try {
    let query = `?category=${encodeURIComponent(currentCategory)}`;
    if (currentSearch) query += `&keyword=${encodeURIComponent(currentSearch)}`;
    if (currentSort) query += `&sort=${encodeURIComponent(currentSort)}`;

    const res = await API.get(`/products${query}`);

    if (res.success) {
      renderCategoryPills(res.categories);
      renderProductCards(res.products);
    }
  } catch (error) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Failed to load products</div>
        <div class="empty-desc">${error.message}</div>
        <button class="btn-sm btn-primary" onclick="loadProducts()">Try Again</button>
      </div>
    `;
  }
}

// Render dynamic category pills
function renderCategoryPills(categories = []) {
  const container = document.getElementById('categoryPills');
  if (!container) return;

  // Keep "All" as first pill
  let html = `
    <button class="category-pill ${currentCategory.toLowerCase() === 'all' ? 'active' : ''}" 
            onclick="setCategory('all')">
      All Products
    </button>
  `;

  categories.forEach((cat) => {
    const isActive = currentCategory.toLowerCase() === cat.toLowerCase();
    html += `
      <button class="category-pill ${isActive ? 'active' : ''}" 
              onclick="setCategory('${cat}')">
        ${cat}
      </button>
    `;
  });

  container.innerHTML = html;
}

// Set active category filter
function setCategory(cat) {
  currentCategory = cat;
  loadProducts();
}

// Render product card grid
function renderProductCards(products = []) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  if (products.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <div class="empty-title">No products found</div>
        <div class="empty-desc">We couldn't find any items matching your criteria. Try adjusting your search or category filter.</div>
        <button class="btn-sm btn-primary" onclick="resetFilters()">Reset All Filters</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = products
    .map((product) => {
      const discountPercent =
        product.originalPrice && product.originalPrice > product.price
          ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
          : null;

      const isOutOfStock = product.stock <= 0;

      return `
      <div class="product-card">
        <div class="product-image-wrap">
          <img src="${product.image}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'" />
          <div class="product-badge-group">
            <span class="badge-pill badge-category">${product.category}</span>
            ${discountPercent ? `<span class="badge-pill badge-discount">${discountPercent}% OFF</span>` : ''}
          </div>
        </div>
        <div class="product-body">
          <div class="product-rating">
            <span>★</span> ${product.rating ? product.rating.toFixed(1) : '4.5'}
            <span class="product-reviews-count">(${product.numReviews || 12})</span>
          </div>
          <h3 class="product-title">
            <a href="/product.html?id=${product._id}" title="${product.name}">${product.name}</a>
          </h3>
          <p class="product-description">${product.description}</p>
          <div class="product-pricing">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${product.originalPrice ? `<span class="price-original">${formatPrice(product.originalPrice)}</span>` : ''}
          </div>
          <div class="stock-indicator ${isOutOfStock ? 'stock-out' : 'stock-in'}">
            ${isOutOfStock ? '● Out of Stock' : `● In Stock (${product.stock} available)`}
          </div>
          <div class="product-actions">
            <a href="/product.html?id=${product._id}" class="btn-sm btn-outline">
              View Details
            </a>
            <button 
              class="btn-sm btn-primary" 
              onclick="handleAddToCart('${product._id}', this)"
              ${isOutOfStock ? 'disabled style="opacity:0.5; cursor:not-allowed;"' : ''}
            >
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// Reset filters
function resetFilters() {
  currentCategory = 'all';
  currentSearch = '';
  currentSort = '';
  const searchInput = document.getElementById('productSearchInput');
  if (searchInput) searchInput.value = '';
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) sortSelect.value = '';
  loadProducts();
}

// Add to Cart handler
async function handleAddToCart(productId, btnElement) {
  if (!Auth.requireAuth()) return;

  const originalContent = btnElement.innerHTML;
  btnElement.disabled = true;
  btnElement.innerHTML = `<span style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite;"></span> Adding...`;

  try {
    const res = await API.post('/cart/add', { productId, quantity: 1 });
    if (res.success) {
      showToast(res.message || 'Item added to your shopping cart!', 'success', 'Added to Cart');
      Auth.updateCartBadge();
    }
  } catch (error) {
    showToast(error.message || 'Failed to add item to cart', 'error', 'Cart Error');
  } finally {
    btnElement.disabled = false;
    btnElement.innerHTML = originalContent;
  }
}
