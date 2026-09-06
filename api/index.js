const mongoose = require('mongoose');
const app = require('../server/server');
const connectDB = require('../server/config/db');

let databaseConnection;

module.exports = async (req, res) => {
  try {
    if (!databaseConnection || mongoose.connection.readyState !== 1) {
      databaseConnection = connectDB();
    }

    await databaseConnection;
    return app(req, res);
  } catch (error) {
    databaseConnection = null;
    console.error('Vercel database connection failed:', error.message);
    return res.status(503).json({
      success: false,
      message: 'Database connection is not ready',
    });
  }
};