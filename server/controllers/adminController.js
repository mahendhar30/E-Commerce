const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get Admin Dashboard Stats & Recent Orders
// @route   GET /api/admin/metrics
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'user' });
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({ orderStatus: 'Pending' });

    // Calculate revenue from non-cancelled orders
    const revenueAgg = await Order.aggregate([
      { $match: { orderStatus: { $ne: 'Cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    // Recent 6 orders
    const recentOrders = await Order.find()
      .sort({ orderDate: -1 })
      .limit(6);

    return res.json({
      success: true,
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        pendingOrders,
        totalRevenue,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all products for Admin table
// @route   GET /api/admin/products
// @access  Private/Admin
const getAdminProducts = async (req, res) => {
  try {
    const { keyword } = req.query;
    let query = {};
    if (keyword) {
      query = {
        $or: [
          { name: { $regex: keyword, $options: 'i' } },
          { category: { $regex: keyword, $options: 'i' } },
        ],
      };
    }
    const products = await Product.find(query).sort({ createdAt: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new product
// @route   POST /api/admin/products
// @access  Private/Admin
const addProduct = async (req, res) => {
  try {
    const { name, image, category, price, description, stock } = req.body;

    if (!name || !image || !category || price === undefined || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: Name, Image URL, Category, Price, Description, and Stock',
      });
    }

    const product = await Product.create({
      name: name.trim(),
      image: image.trim(),
      category: category.trim(),
      price: parseFloat(price),
      originalPrice: Math.round(parseFloat(price) * 1.2),
      description: description.trim(),
      stock: parseInt(stock, 10) || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an existing product
// @route   PUT /api/admin/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const { name, image, category, price, description, stock } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (name) product.name = name.trim();
    if (image) product.image = image.trim();
    if (category) product.category = category.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (description) product.description = description.trim();
    if (stock !== undefined) product.stock = parseInt(stock, 10);

    const updatedProduct = await product.save();

    return res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/admin/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await Product.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all orders for Admin
// @route   GET /api/admin/orders
// @access  Private/Admin
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    return res.json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Order Status
// @route   PUT /api/admin/orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const oldStatus = order.orderStatus;
    order.orderStatus = status;
    await order.save();

    // If newly cancelled by admin, restore stock
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    return res.json({
      success: true,
      message: `Order status updated to "${status}"`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all customers with their order count & registration details
// @route   GET /api/admin/customers
// @access  Private/Admin
const getCustomers = async (req, res) => {
  try {
    const users = await User.find({ role: 'user' })
      .select('-password')
      .sort({ createdAt: -1 });

    // Aggregate order count per user
    const userOrdersCount = await Order.aggregate([
      {
        $group: {
          _id: '$userId',
          totalOrders: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
        },
      },
    ]);

    const orderCountMap = {};
    const totalSpentMap = {};
    userOrdersCount.forEach((item) => {
      orderCountMap[item._id.toString()] = item.totalOrders;
      totalSpentMap[item._id.toString()] = item.totalSpent;
    });

    const customersWithOrders = users.map((user) => {
      const u = user.toObject();
      u.orderCount = orderCountMap[user._id.toString()] || 0;
      u.totalSpent = totalSpentMap[user._id.toString()] || 0;
      return u;
    });

    return res.json({
      success: true,
      count: customersWithOrders.length,
      customers: customersWithOrders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getDashboardStats,
  getAdminProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getCustomers,
};
