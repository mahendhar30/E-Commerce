// Product Details Controller

let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    window.location.href = '/index.html';
    return;
  }

  loadProductDetails(productId);
});

async function loadProductDetails(productId) {
  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  try {
    const res = await API.get(`/products/${productId}`);
    if (res.success && res.product) {
      currentProduct = res.product;
      renderProduct(res.product);
      renderRelatedProducts(res.relatedProducts || []);
      document.title = `${res.product.name} - GenZ Shopping`;
    }
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Product Not Found</div>
        <div class="empty-desc">${error.message || 'The requested product could not be loaded.'}</div>
        <a href="/index.html" class="btn-sm btn-primary">Back to Shop</a>
      </div>
    `;
  }
}

function renderProduct(product) {
  const container = document.getElementById('productDetailContainer');
  if (!container) return;

  const isOutOfStock = product.stock <= 0;
  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : null;

  // Update breadcrumb
  const breadcrumbCategory = document.getElementById('bcCategory');
  const breadcrumbTitle = document.getElementById('bcTitle');
  if (breadcrumbCategory) breadcrumbCategory.textContent = product.category;
  if (breadcrumbTitle) breadcrumbTitle.textContent = product.name;

  container.innerHTML = `
    <div class="product-detail-grid">
      <!-- Gallery Left -->
      <div class="detail-gallery">
        <img 
          src="${product.image}" 
          alt="${product.name}" 
          class="detail-main-img" 
          id="detailMainImg" 
          onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'"
        />
      </div>

      <!-- Info Right -->
      <div class="detail-info">
        <span class="detail-category-badge">${product.category}</span>
        <h1 class="detail-title">${product.name}</h1>

        <div class="detail-rating">
          <span style="color:#f59e0b; font-weight:700;">★ ${product.rating ? product.rating.toFixed(1) : '4.5'}</span>
          <span style="color:#94a3b8;">•</span>
          <span style="color:#64748b; font-size:0.9rem;">${product.numReviews || 18} Verified Customer Reviews</span>
        </div>

        <div class="detail-pricing">
          <span class="detail-price-current">${formatPrice(product.price)}</span>
          ${product.originalPrice ? `<span class="detail-price-original">${formatPrice(product.originalPrice)}</span>` : ''}
          ${discountPercent ? `<span class="discount-save-tag">Save ${discountPercent}%</span>` : ''}
        </div>

        <div class="stock-indicator ${isOutOfStock ? 'stock-out' : 'stock-in'}" style="font-size:0.92rem; margin-bottom: 20px;">
          ${isOutOfStock ? '● Currently Out of Stock' : `● In Stock (${product.stock} units ready to dispatch)`}
        </div>

        <div class="detail-desc-title">Product Overview</div>
        <p class="detail-desc">${product.description}</p>

        <!-- Quantity Picker -->
        ${
          !isOutOfStock
            ? `
          <div class="quantity-control">
            <span style="font-weight: 700; font-size: 0.95rem; color: #0f172a;">Quantity:</span>
            <div class="quantity-picker">
              <button class="qty-btn" onclick="changeQuantity(-1)">−</button>
              <input type="text" class="qty-input" id="detailQtyInput" value="1" readonly />
              <button class="qty-btn" onclick="changeQuantity(1)">+</button>
            </div>
            <span style="font-size: 0.8rem; color: #64748b;">(Max ${product.stock} per order)</span>
          </div>

          <!-- Buttons -->
          <div class="detail-buttons">
            <button class="btn-auth btn-primary" onclick="addToCartDetail()" id="btnDetailAddToCart">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Add to Cart
            </button>
            <button class="btn-auth btn-success" onclick="buyNowDetail()" id="btnDetailBuyNow">
              ⚡ Buy Now
            </button>
          </div>
          `
            : `
          <button class="btn-auth btn-secondary" disabled style="width: 100%; opacity: 0.6; cursor: not-allowed; margin-bottom: 24px;">
            Item Currently Unavailable
          </button>
          `
        }

        <!-- Assurances -->
        <div class="perks-list">
          <div class="perk-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
            Cash on Delivery Available
          </div>
          <div class="perk-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            7 Days Easy Replacement
          </div>
          <div class="perk-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            100% Genuine Brand Product
          </div>
          <div class="perk-item">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            Fast Express Courier Dispatch
          </div>
        </div>
      </div>
    </div>
  `;
}

function changeQuantity(delta) {
  if (!currentProduct) return;
  const newQty = currentQuantity + delta;
  if (newQty >= 1 && newQty <= currentProduct.stock) {
    currentQuantity = newQty;
    const input = document.getElementById('detailQtyInput');
    if (input) input.value = currentQuantity;
  }
}

// Add to Cart with current quantity
async function addToCartDetail() {
  if (!Auth.requireAuth()) return;
  if (!currentProduct) return;

  const btn = document.getElementById('btnDetailAddToCart');
  btn.disabled = true;
  btn.innerHTML = 'Adding...';

  try {
    const res = await API.post('/cart/add', {
      productId: currentProduct._id,
      quantity: currentQuantity,
    });

    if (res.success) {
      showToast(`${currentQuantity}x "${currentProduct.name}" added to cart!`, 'success', 'Cart Updated');
      Auth.updateCartBadge();
    }
  } catch (error) {
    showToast(error.message || 'Could not add to cart', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg> Add to Cart`;
  }
}

// Buy Now - Fast track straight to checkout
function buyNowDetail() {
  if (!Auth.requireAuth()) return;
  if (!currentProduct) return;

  // Direct checkout URL with query params
  window.location.href = `/checkout.html?directBuy=${currentProduct._id}&qty=${currentQuantity}`;
}

// Related products
function renderRelatedProducts(products = []) {
  const container = document.getElementById('relatedProductsGrid');
  if (!container) return;

  if (products.length === 0) {
    document.getElementById('relatedSection')?.remove();
    return;
  }

  container.innerHTML = products
    .map(
      (p) => `
    <div class="product-card">
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'" />
      </div>
      <div class="product-body">
        <h3 class="product-title"><a href="/product.html?id=${p._id}">${p.name}</a></h3>
        <div class="product-pricing">
          <span class="price-current">${formatPrice(p.price)}</span>
        </div>
        <a href="/product.html?id=${p._id}" class="btn-sm btn-outline" style="width: 100%; text-align: center;">View Details</a>
      </div>
    </div>
  `
    )
    .join('');
}
