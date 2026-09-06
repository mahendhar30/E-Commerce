const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAdminProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllOrders,
  updateOrderStatus,
  getCustomers,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// All admin routes require admin credentials
router.use(protect);
router.use(adminOnly);

router.get('/metrics', getDashboardStats);

// Product management
router.get('/products', getAdminProducts);
router.post('/products', addProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Order management
router.get('/orders', getAllOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Customer management
router.get('/customers', getCustomers);

module.exports = router;
