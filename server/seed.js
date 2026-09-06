const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Cart = require('./models/Cart');
const Order = require('./models/Order');
const { seedUsers, seedProducts } = require('./utils/seedData');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecommerce_db';
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected.');

    // Clear existing collections
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await Order.deleteMany({});

    // Seed Users
    console.log('Seeding users...');
    const createdUsers = [];
    for (const userData of seedUsers) {
      const user = await User.create(userData);
      createdUsers.push(user);
    }
    console.log(`Seeded ${createdUsers.length} users (including Admin).`);

    // Seed Products
    console.log('Seeding trending GenZ products...');
    const createdProducts = await Product.insertMany(seedProducts);
    console.log(`Seeded ${createdProducts.length} trending products.`);

    // Find test customers
    const customerAryan = createdUsers.find((u) => u.email === 'user@eshop.com');
    const customerAnanya = createdUsers.find((u) => u.email === 'ananya@eshop.com');

    // Create carts: For Aryan, pre-populate with trending GenZ cart items!
    for (const user of createdUsers) {
      if (user.email === 'user@eshop.com' && createdProducts.length >= 2) {
        // Pre-fill Aryan's cart with 2 trending items: AirPods Max & Streetwear Hoodie
        const item1 = createdProducts[0]; // AirPods Max
        const item2 = createdProducts[1]; // Oversized Hoodie

        const cartProducts = [
          {
            product: item1._id,
            name: item1.name,
            image: item1.image,
            price: item1.price,
            quantity: 1,
          },
          {
            product: item2._id,
            name: item2.name,
            image: item2.image,
            price: item2.price,
            quantity: 2,
          },
        ];

        const totalAmount = item1.price * 1 + item2.price * 2;

        await Cart.create({
          userId: user._id,
          products: cartProducts,
          totalAmount,
        });
        console.log('Pre-populated trending items into Aryan\'s cart (AirPods Max & Hoodie).');
      } else {
        await Cart.create({
          userId: user._id,
          products: [],
          totalAmount: 0,
        });
      }
    }

    // Seed a couple of initial sample orders for Aryan and Ananya
    if (customerAryan && createdProducts.length >= 5) {
      const order1 = await Order.create({
        orderId: 'ORD-2026-10492',
        userId: customerAryan._id,
        products: [
          {
            product: createdProducts[2]._id, // Baggy cargo pants
            name: createdProducts[2].name,
            image: createdProducts[2].image,
            price: createdProducts[2].price,
            quantity: 1,
          },
          {
            product: createdProducts[4]._id, // Stanley Cup
            name: createdProducts[4].name,
            image: createdProducts[4].image,
            price: createdProducts[4].price,
            quantity: 1,
          },
        ],
        customerDetails: {
          fullName: customerAryan.name,
          email: customerAryan.email,
          phone: customerAryan.phone,
          deliveryAddress: customerAryan.address.street,
          city: customerAryan.address.city,
          state: customerAryan.address.state,
          pincode: customerAryan.address.pincode,
        },
        totalAmount: createdProducts[2].price * 1 + createdProducts[4].price * 1,
        paymentMethod: 'Cash on Delivery',
        orderStatus: 'Confirmed',
        orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      });
    }

    if (customerAnanya && createdProducts.length >= 7) {
      const order2 = await Order.create({
        orderId: 'ORD-2026-10518',
        userId: customerAnanya._id,
        products: [
          {
            product: createdProducts[6]._id, // Sunset lamp
            name: createdProducts[6].name,
            image: createdProducts[6].image,
            price: createdProducts[6].price,
            quantity: 2,
          },
        ],
        customerDetails: {
          fullName: customerAnanya.name,
          email: customerAnanya.email,
          phone: customerAnanya.phone,
          deliveryAddress: customerAnanya.address.street,
          city: customerAnanya.address.city,
          state: customerAnanya.address.state,
          pincode: customerAnanya.address.pincode,
        },
        totalAmount: createdProducts[6].price * 2,
        paymentMethod: 'Cash on Delivery',
        orderStatus: 'Pending',
        orderDate: new Date(),
      });
    }

    console.log('Initial sample orders created for demo metrics.');
    console.log('-------------------------------------------');
    console.log('GENZ SHOPPING DATABASE SEEDED SUCCESSFULLY!');
    console.log('Admin Account: admin@eshop.com / admin123');
    console.log('Customer Account (with trending cart items): user@eshop.com / user123');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
