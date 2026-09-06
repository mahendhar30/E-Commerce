const Product = require('../models/Product');

// @desc    Fetch all products with filtering, search, and sorting
// @route   GET /api/products
// @access  Public
const getAllProducts = async (req, res) => {
  try {
    const { keyword, category, sort } = req.query;

    const filter = {};

    // Search query
    if (keyword && keyword.trim() !== '') {
      filter.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } },
        { category: { $regex: keyword.trim(), $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category.toLowerCase() !== 'all') {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Sorting
    let sortOption = { createdAt: -1 }; // default newest
    if (sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'name-asc') sortOption = { name: 1 };

    const products = await Product.find(filter).sort(sortOption);

    // Also get all distinct categories
    const categories = await Product.distinct('category');

    return res.json({
      success: true,
      count: products.length,
      categories,
      products,
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
    });
  }
};

// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      // Related products in the same category
      const relatedProducts = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
      }).limit(4);

      return res.json({
        success: true,
        product,
        relatedProducts,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Invalid product ID' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all product categories
// @route   GET /api/products/categories
// @access  Public
const getCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category');
    return res.json({ success: true, categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getCategories,
};
