// Shopping Cart Controller

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  loadCart();
});

async function loadCart() {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px 0;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 14px; color: #64748b; font-weight: 600;">Updating your cart...</p>
    </div>
  `;

  try {
    const res = await API.get('/cart');
    if (res.success && res.cart) {
      renderCart(res.cart);
      Auth.updateCartBadge();
    }
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Error Loading Cart</div>
        <div class="empty-desc">${error.message}</div>
        <button class="btn-sm btn-primary" onclick="loadCart()">Retry</button>
      </div>
    `;
  }
}

function renderCart(cart) {
  const container = document.getElementById('cartContainer');
  if (!container) return;

  if (!cart.products || cart.products.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="background:#fff; border-radius:16px; border:1px solid #e2e8f0; padding:60px 20px;">
        <div class="empty-icon" style="font-size: 3.5rem;">🛒</div>
        <h2 class="empty-title">Your shopping cart is empty</h2>
        <p class="empty-desc">Looks like you haven't added any items to your cart yet. Explore our curated selection of top trending products.</p>
        <a href="/index.html" class="btn-auth btn-primary" style="margin-top: 10px;">
          Start Shopping Now
        </a>
      </div>
    `;
    return;
  }

  const subtotal = cart.totalAmount || 0;
  const shippingFee = subtotal >= 999 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

  container.innerHTML = `
    <div class="cart-layout">
      <!-- Items List -->
      <div class="cart-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; padding-bottom:14px; border-bottom:1px solid #e2e8f0;">
          <h2 style="font-size:1.3rem; font-weight:800; color:#0f172a;">Shopping Bag (${cart.products.length} unique ${cart.products.length === 1 ? 'item' : 'items'})</h2>
          <button onclick="clearEntireCart()" style="background:none; border:none; color:#ef4444; font-size:0.85rem; font-weight:600; cursor:pointer;">
            Clear Cart
          </button>
        </div>

        <div class="table-responsive">
          <table class="cart-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Unit Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${cart.products
                .map(
                  (item) => `
                <tr class="cart-item-row">
                  <td>
                    <div class="cart-item-info">
                      <img src="${item.image}" alt="${item.name}" class="cart-thumb" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'" />
                      <div>
                        <div class="cart-item-name">
                          <a href="/product.html?id=${item.product}">${item.name}</a>
                        </div>
                        <span style="font-size:0.75rem; color:#10b981; font-weight:600;">In Stock</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style="font-weight:600; color:#475569;">${formatPrice(item.price)}</span>
                  </td>
                  <td>
                    <div class="quantity-picker" style="transform: scale(0.9); transform-origin: left center;">
                      <button class="qty-btn" onclick="updateItemQuantity('${item.product}', ${item.quantity - 1})">−</button>
                      <input type="text" class="qty-input" value="${item.quantity}" readonly />
                      <button class="qty-btn" onclick="updateItemQuantity('${item.product}', ${item.quantity + 1})">+</button>
                    </div>
                  </td>
                  <td>
                    <span style="font-weight:800; color:#0f172a; font-size:1rem;">
                      ${formatPrice(item.price * item.quantity)}
                    </span>
                  </td>
                  <td style="text-align:right;">
                    <button class="cart-btn-remove" title="Remove item" onclick="removeItem('${item.product}')">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div style="margin-top:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <a href="/index.html" class="btn-sm btn-outline">
            ← Continue Shopping
          </a>
        </div>
      </div>

      <!-- Order Summary Card -->
      <div class="summary-card">
        <h3 class="summary-title">Order Summary</h3>

        <div class="summary-row">
          <span>Subtotal</span>
          <span style="font-weight:700; color:#0f172a;">${formatPrice(subtotal)}</span>
        </div>

        <div class="summary-row">
          <span>Estimated Delivery</span>
          <span style="color:#10b981; font-weight:700;">${shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span>
        </div>

        ${
          shippingFee > 0
            ? `<div style="font-size:0.8rem; color:#64748b; margin-top:-6px; margin-bottom:12px;">Add items worth ${formatPrice(999 - subtotal)} more for <strong>FREE Delivery</strong></div>`
            : `<div style="font-size:0.8rem; color:#10b981; font-weight:600; margin-top:-6px; margin-bottom:12px;">🎉 You qualified for FREE Delivery!</div>`
        }

        <div class="summary-row">
          <span>Payment Method</span>
          <span style="font-weight:700; color:#4f46e5;">Cash on Delivery (COD)</span>
        </div>

        <div class="summary-row summary-total">
          <span>Total Amount</span>
          <span style="color:#4f46e5;">${formatPrice(grandTotal)}</span>
        </div>

        <a href="/checkout.html" class="btn-auth btn-primary" style="width:100%; justify-content:center; margin-top:20px; padding:14px;">
          Proceed to Checkout →
        </a>

        <div style="margin-top:16px; text-align:center; font-size:0.78rem; color:#94a3b8; display:flex; align-items:center; justify-content:center; gap:6px;">
          <span>🔒</span> 100% Safe & Secure Cash on Delivery
        </div>
      </div>
    </div>
  `;
}

// Update quantity
async function updateItemQuantity(productId, quantity) {
  try {
    const res = await API.put('/cart/update', { productId, quantity });
    if (res.success) {
      renderCart(res.cart);
      Auth.updateCartBadge();
    }
  } catch (error) {
    showToast(error.message || 'Could not update quantity', 'error');
  }
}

// Remove item
async function removeItem(productId) {
  try {
    const res = await API.delete(`/cart/remove/${productId}`);
    if (res.success) {
      showToast('Item removed from cart', 'info');
      renderCart(res.cart);
      Auth.updateCartBadge();
    }
  } catch (error) {
    showToast(error.message || 'Failed to remove item', 'error');
  }
}

// Clear cart
async function clearEntireCart() {
  if (!confirm('Are you sure you want to clear your shopping cart?')) return;

  try {
    const res = await API.delete('/cart/clear');
    if (res.success) {
      showToast('Cart cleared', 'info');
      renderCart(res.cart);
      Auth.updateCartBadge();
    }
  } catch (error) {
    showToast(error.message || 'Failed to clear cart', 'error');
  }
}
