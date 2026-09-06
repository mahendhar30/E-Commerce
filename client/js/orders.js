// My Orders Controller

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.requireAuth()) return;
  loadMyOrders();
});

async function loadMyOrders() {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 60px 0;">
      <div style="display: inline-block; width: 36px; height: 36px; border: 3px solid #e2e8f0; border-top-color: #4f46e5; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
      <p style="margin-top: 14px; color: #64748b; font-weight: 600;">Loading your order history...</p>
    </div>
  `;

  try {
    const res = await API.get('/orders/myorders');
    if (res.success) {
      renderOrders(res.orders || []);
    }
  } catch (error) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Could not load orders</div>
        <div class="empty-desc">${error.message}</div>
        <button class="btn-sm btn-primary" onclick="loadMyOrders()">Try Again</button>
      </div>
    `;
  }
}

function renderOrders(orders = []) {
  const container = document.getElementById('ordersListContainer');
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="background:#fff; border-radius:16px; border:1px solid #e2e8f0; padding:60px 20px;">
        <div class="empty-icon" style="font-size: 3.5rem;">📦</div>
        <h2 class="empty-title">No orders placed yet</h2>
        <p class="empty-desc">You haven't placed any orders yet. Discover our top collection and experience fast delivery with Cash on Delivery!</p>
        <a href="/index.html" class="btn-auth btn-primary" style="margin-top: 10px;">
          Browse Catalog
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const dateFormatted = new Date(order.orderDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const canCancel = order.orderStatus === 'Pending' || order.orderStatus === 'Confirmed';
      const statusClass = `status-${order.orderStatus.toLowerCase()}`;

      return `
      <div class="order-card">
        <div class="order-header">
          <div>
            <div class="order-meta-id">Order #${order.orderId}</div>
            <div class="order-meta-date">Placed on ${dateFormatted}</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="status-badge ${statusClass}">
              ● ${order.orderStatus}
            </span>
          </div>
        </div>

        <div class="order-items-list">
          ${order.products
            .map(
              (item) => `
            <div class="order-item-row">
              <div class="order-item-left">
                <img src="${item.image}" alt="${item.name}" class="order-item-thumb" onerror="this.src='https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'" />
                <div>
                  <div style="font-weight:700; font-size:0.92rem; color:#0f172a;">${item.name}</div>
                  <div style="font-size:0.8rem; color:#64748b;">Qty: ${item.quantity} × ${formatPrice(item.price)}</div>
                </div>
              </div>
              <div style="font-weight:700; color:#0f172a;">
                ${formatPrice(item.price * item.quantity)}
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="order-footer">
          <div style="font-size:0.85rem; color:#64748b;">
            <strong>Shipping to:</strong> ${order.customerDetails.fullName}, ${order.customerDetails.deliveryAddress}, ${order.customerDetails.city}, ${order.customerDetails.state} - ${order.customerDetails.pincode}
          </div>
          <div style="display:flex; align-items:center; gap:16px;">
            <div style="text-align:right;">
              <span style="font-size:0.8rem; color:#64748b;">Total (COD): </span>
              <span style="font-weight:800; font-size:1.15rem; color:#0f172a;">${formatPrice(order.totalAmount)}</span>
            </div>
            ${
              canCancel
                ? `
              <button class="btn-sm btn-outline" style="color:#ef4444; border-color:#fca5a5;" onclick="cancelMyOrder('${order._id}')">
                Cancel Order
              </button>
            `
                : ''
            }
          </div>
        </div>
      </div>
    `;
    })
    .join('');
}

// Cancel order
async function cancelMyOrder(orderId) {
  if (!confirm('Are you sure you want to cancel this order? Items will be returned to stock.')) {
    return;
  }

  try {
    const res = await API.put(`/orders/${orderId}/cancel`);
    if (res.success) {
      showToast('Order cancelled successfully', 'info', 'Order Cancelled');
      loadMyOrders();
    }
  } catch (error) {
    showToast(error.message || 'Could not cancel order', 'error');
  }
}
