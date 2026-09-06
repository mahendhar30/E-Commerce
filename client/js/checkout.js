// Checkout & Cash on Delivery Controller

let checkoutItems = [];
let checkoutTotal = 0;
let directBuyConfig = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!Auth.requireAuth()) return;

  prefillUserDetails();
  await loadCheckoutData();
  setupCheckoutForm();
});

// Prefill form from user profile
function prefillUserDetails() {
  const user = Auth.getUser();
  if (!user) return;

  const nameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const phoneInput = document.getElementById('phone');
  const addressInput = document.getElementById('deliveryAddress');
  const cityInput = document.getElementById('city');
  const stateInput = document.getElementById('state');
  const pincodeInput = document.getElementById('pincode');

  if (nameInput) nameInput.value = user.name || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';

  if (user.address) {
    if (typeof user.address === 'string' && addressInput) {
      addressInput.value = user.address;
    } else if (typeof user.address === 'object') {
      if (addressInput) addressInput.value = user.address.street || '';
      if (cityInput) cityInput.value = user.address.city || '';
      if (stateInput) stateInput.value = user.address.state || '';
      if (pincodeInput) pincodeInput.value = user.address.pincode || '';
    }
  }
}

// Load items for review
async function loadCheckoutData() {
  const params = new URLSearchParams(window.location.search);
  const directBuyId = params.get('directBuy');
  const qty = parseInt(params.get('qty'), 10) || 1;

  const summaryContainer = document.getElementById('checkoutSummaryItems');
  const totalContainer = document.getElementById('checkoutGrandTotal');

  if (directBuyId) {
    // Direct Buy Mode
    try {
      const res = await API.get(`/products/${directBuyId}`);
      if (res.success && res.product) {
        directBuyConfig = {
          productId: res.product._id,
          quantity: qty,
        };
        checkoutItems = [
          {
            name: res.product.name,
            image: res.product.image,
            price: res.product.price,
            quantity: qty,
          },
        ];
        checkoutTotal = res.product.price * qty;
      }
    } catch (err) {
      showToast('Error loading direct buy product', 'error');
      window.location.href = '/index.html';
      return;
    }
  } else {
    // Cart Checkout Mode
    try {
      const res = await API.get('/cart');
      if (res.success && res.cart) {
        if (!res.cart.products || res.cart.products.length === 0) {
          showToast('Your cart is empty', 'warning');
          window.location.href = '/cart.html';
          return;
        }
        checkoutItems = res.cart.products;
        checkoutTotal = res.cart.totalAmount || 0;
      }
    } catch (err) {
      showToast('Error loading cart for checkout', 'error');
      window.location.href = '/cart.html';
      return;
    }
  }

  // Render items in review list
  if (summaryContainer) {
    summaryContainer.innerHTML = checkoutItems
      .map(
        (item) => `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; padding-bottom:12px; border-bottom:1px solid #f1f5f9;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="${item.image}" alt="${item.name}" style="width:44px; height:44px; border-radius:8px; object-fit:cover; border:1px solid #e2e8f0;" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'" />
          <div>
            <div style="font-weight:700; font-size:0.86rem; color:#0f172a; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${item.name}</div>
            <div style="font-size:0.75rem; color:#64748b;">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
          </div>
        </div>
        <div style="font-weight:700; font-size:0.9rem; color:#0f172a;">
          ${formatPrice(item.price * item.quantity)}
        </div>
      </div>
    `
      )
      .join('');
  }

  if (totalContainer) {
    totalContainer.textContent = formatPrice(checkoutTotal);
  }
}

// Form submit handler
function setupCheckoutForm() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const deliveryAddress = document.getElementById('deliveryAddress').value.trim();
    const city = document.getElementById('city').value.trim();
    const state = document.getElementById('state').value.trim();
    const pincode = document.getElementById('pincode').value.trim();

    if (!fullName || !email || !phone || !deliveryAddress || !city || !state || !pincode) {
      showToast('Please complete all required shipping fields', 'error', 'Validation Error');
      return;
    }

    const btn = document.getElementById('btnPlaceOrder');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite;"></span> Securing Order...`;

    try {
      const orderPayload = {
        customerDetails: {
          fullName,
          email,
          phone,
          deliveryAddress,
          city,
          state,
          pincode,
        },
      };

      if (directBuyConfig) {
        orderPayload.directBuyItem = directBuyConfig;
      }

      const res = await API.post('/orders', orderPayload);

      if (res.success && res.order) {
        showToast('Your order has been placed successfully!', 'success', 'Order Confirmed');
        Auth.updateCartBadge();

        // Redirect to confirmation page with order ID
        setTimeout(() => {
          window.location.href = `/order-success.html?orderId=${res.order.orderId}`;
        }, 600);
      }
    } catch (error) {
      showToast(error.message || 'Failed to place order. Please try again.', 'error', 'Checkout Error');
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  });
}
