const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to generate human-readable Order ID
const generateOrderId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
};

// @desc    Create new order (Cash on Delivery)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { customerDetails, directBuyItem } = req.body;

    if (
      !customerDetails ||
      !customerDetails.fullName ||
      !customerDetails.email ||
      !customerDetails.phone ||
      !customerDetails.deliveryAddress ||
      !customerDetails.city ||
      !customerDetails.state ||
      !customerDetails.pincode
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please complete all delivery address and contact fields',
      });
    }

    let orderProducts = [];
    let totalAmount = 0;

    // Direct Buy Fast-Track OR Cart Checkout
    if (directBuyItem && directBuyItem.productId) {
      const product = await Product.findById(directBuyItem.productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      const qty = parseInt(directBuyItem.quantity, 10) || 1;
      if (product.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available in stock`,
        });
      }
      orderProducts.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: qty,
      });
      totalAmount = product.price * qty;
    } else {
      // From cart
      const cart = await Cart.findOne({ userId: req.user._id });
      if (!cart || cart.products.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Your shopping cart is empty. Please add items first.',
        });
      }

      // Validate stock for all products in cart
      for (const item of cart.products) {
        const prod = await Product.findById(item.product);
        if (!prod || prod.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Product "${item.name}" only has ${prod ? prod.stock : 0} items remaining in stock. Please adjust your cart.`,
          });
        }
        orderProducts.push({
          product: item.product,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        });
      }

      totalAmount = cart.totalAmount || cart.calculateTotal();
    }

    // Create the Order
    const order = await Order.create({
      orderId: generateOrderId(),
      userId: req.user._id,
      products: orderProducts,
      customerDetails: {
        fullName: customerDetails.fullName.trim(),
        email: customerDetails.email.trim(),
        phone: customerDetails.phone.trim(),
        deliveryAddress: customerDetails.deliveryAddress.trim(),
        city: customerDetails.city.trim(),
        state: customerDetails.state.trim(),
        pincode: customerDetails.pincode.trim(),
      },
      totalAmount,
      paymentMethod: 'Cash on Delivery',
      orderStatus: 'Pending',
      orderDate: new Date(),
    });

    // Deduct stock from products
    for (const item of orderProducts) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // If checked out from cart, empty the user's cart
    if (!directBuyItem) {
      await Cart.findOneAndUpdate(
        { userId: req.user._id },
        { $set: { products: [], totalAmount: 0 } }
      );
    }

    return res.status(201).json({
      success: true,
      message: 'Your order has been placed successfully!',
      order,
    });
  } catch (error) {
    console.error('Error placing order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ orderDate: -1 });
    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single order by ID or orderId
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
  try {
    const query = req.params.id.startsWith('ORD-')
      ? { orderId: req.params.id }
      : { _id: req.params.id };

    const order = await Order.findOne(query);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Check ownership unless admin
    if (
      order.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    return res.json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel order (if Pending or Confirmed)
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (
      order.userId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify this order' });
    }

    if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that has already been ${order.orderStatus.toLowerCase()}`,
      });
    }

    if (order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This order is already cancelled',
      });
    }

    order.orderStatus = 'Cancelled';
    await order.save();

    // Restore inventory stock
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity },
      });
    }

    return res.json({
      success: true,
      message: 'Order has been cancelled and items restored to inventory',
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
};
