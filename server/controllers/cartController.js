const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Helper to ensure user has a cart
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({
      userId,
      products: [],
      totalAmount: 0,
    });
  }
  return cart;
};

// @desc    Get user's shopping cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.calculateTotal();
    await cart.save();

    const itemCount = cart.products.reduce((acc, item) => acc + item.quantity, 0);

    return res.json({
      success: true,
      cart,
      itemCount,
    });
  } catch (error) {
    console.error('Error in getCart:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add product to cart
// @route   POST /api/cart/add
// @access  Private
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'Product ID is required' });
    }

    const qty = Math.max(1, parseInt(quantity, 10) || 1);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Sorry, this product is currently out of stock' });
    }

    const cart = await getOrCreateCart(req.user._id);

    // Check if product is already in cart
    const itemIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex > -1) {
      const newQuantity = cart.products[itemIndex].quantity + qty;
      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Cannot add more than available stock (${product.stock} units)`,
        });
      }
      cart.products[itemIndex].quantity = newQuantity;
      cart.products[itemIndex].price = product.price; // keep updated
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Requested quantity exceeds available stock (${product.stock} units)`,
        });
      }
      cart.products.push({
        product: product._id,
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: qty,
      });
    }

    cart.calculateTotal();
    await cart.save();

    const itemCount = cart.products.reduce((acc, item) => acc + item.quantity, 0);

    return res.json({
      success: true,
      message: `"${product.name}" added to your cart!`,
      cart,
      itemCount,
    });
  } catch (error) {
    console.error('Error in addToCart:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update quantity of an item in cart
// @route   PUT /api/cart/update
// @access  Private
const updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Product ID and quantity are required' });
    }

    const qty = parseInt(quantity, 10);
    const cart = await getOrCreateCart(req.user._id);

    const itemIndex = cart.products.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not found in cart' });
    }

    if (qty <= 0) {
      // Remove item if quantity set to 0 or less
      cart.products.splice(itemIndex, 1);
    } else {
      // Validate with product stock
      const product = await Product.findById(productId);
      if (product && qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} units available in stock`,
        });
      }
      cart.products[itemIndex].quantity = qty;
    }

    cart.calculateTotal();
    await cart.save();

    const itemCount = cart.products.reduce((acc, item) => acc + item.quantity, 0);

    return res.json({
      success: true,
      message: 'Cart updated',
      cart,
      itemCount,
    });
  } catch (error) {
    console.error('Error in updateCartItemQuantity:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove an item from cart
// @route   DELETE /api/cart/remove/:productId
// @access  Private
const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;
    const cart = await getOrCreateCart(req.user._id);

    cart.products = cart.products.filter(
      (item) => item.product.toString() !== productId
    );

    cart.calculateTotal();
    await cart.save();

    const itemCount = cart.products.reduce((acc, item) => acc + item.quantity, 0);

    return res.json({
      success: true,
      message: 'Item removed from cart',
      cart,
      itemCount,
    });
  } catch (error) {
    console.error('Error in removeFromCart:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear entire cart
// @route   DELETE /api/cart/clear
// @access  Private
const clearCart = async (req, res) => {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.products = [];
    cart.totalAmount = 0;
    await cart.save();

    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      cart,
      itemCount: 0,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
};
