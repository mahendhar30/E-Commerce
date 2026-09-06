# E-Commerce Website — Full-Stack Web Development Project

A modern, responsive full-stack **E-Commerce Web Application** built with Node.js, Express.js, MongoDB (Mongoose), Vanilla HTML5/CSS3/ES6+ JavaScript, and JWT Authentication. Includes a complete **Customer Shopping Experience** and a dedicated **Admin Management Portal**.

---

## 🌟 Key Features

### 👤 Customer / User Module
1. **User Registration**:
   - Comprehensive registration form with Full Name, Email, Mobile Number, Password, Confirm Password, and Delivery Address.
   - Client-side & server-side validation with real-time feedback.
2. **User Login & Session Management**:
   - Secure authentication with password hashing using `bcryptjs`.
   - Signed JSON Web Tokens (`jsonwebtoken`) stored securely in client storage.
   - Quick one-click demo user auto-fill for effortless evaluation.
3. **Product Catalog & Discovery**:
   - Dynamic product grid with high-resolution imagery, category pills, rating badges, discount percentages, and live stock indicator.
   - Live search with debounce (instant results as you type).
   - Category filtering (Electronics, Fashion, Home & Kitchen, Sports & Fitness, Books & Stationery, Beauty).
   - Price & customer rating sorting.
4. **Specific Product Page**:
   - High-definition image display.
   - Title, pricing, discount calculation, stock level, category badge, and detailed product overview.
   - Dynamic quantity selector (+ / -) with available stock limits.
   - **Add to Cart** and **⚡ Buy Now** fast-track checkout.
   - Similar/Related products recommendation section.
5. **Shopping Bag / Cart**:
   - View items with thumbnails, unit prices, quantity modifiers, and per-item subtotals.
   - Dynamic subtotal, shipping fee calculation (Free Delivery above ₹999), and total amount.
   - Item removal and entire cart clearing with confirmation.
   - Real-time animated cart badge in header navbar.
6. **Checkout & Cash on Delivery (COD)**:
   - Shipping details prefilled automatically from registered profile.
   - Multi-field validation (Full Name, Phone, Email, Delivery Address, City, State, Pincode).
   - Dedicated **Cash on Delivery (COD)** payment flow with 0% transaction friction.
7. **Order Confirmation & Tracking**:
   - Generates unique human-readable Order IDs (e.g., `#ORD-2026-XXXXX`).
   - Clears user cart automatically upon order placement.
   - Immediate order confirmation receipt with summary and direct link to My Orders.
8. **My Orders & Order History**:
   - List of placed customer orders with items, pricing, delivery address, and date.
   - Color-coded live status badges: `Pending`, `Confirmed`, `Shipped`, `Delivered`, `Cancelled`.
   - Order cancellation button for eligible active orders (automatically restores inventory stock in MongoDB!).
9. **Secure Logout**:
   - Clears authentication tokens and cleans up the UI session.

---

### 🛡️ Administrator Module
1. **Dedicated Admin Login**:
   - Restricted admin login route (`/admin-login.html`).
   - Server-side role validation (`adminOnly` middleware) strictly preventing standard users from accessing admin routes or data.
   - One-click demo admin auto-fill.
2. **Executive Admin Dashboard**:
   - Live metric cards:
     - **Total Products** in catalog
     - **Total Customers** registered
     - **Total Orders** placed
     - **Pending Orders** needing fulfillment
     - **Total Revenue (₹)** generated from active orders
   - Recent customer orders table with order details.
3. **Product Catalog Management (CRUD)**:
   - View all products with photo, name, category, price, stock units, and rating.
   - Search products in real time.
   - **Add Product**: Form with Name, Category, Price, Stock, Image URL, and Description.
   - **Edit Product**: Modal dialog to adjust price, stock, description, or image.
   - **Delete Product**: Removes product with confirmation dialog.
4. **Order Management & Fulfillment**:
   - Table of all customer orders across the platform.
   - Customer contact, delivery address, ordered items count, total amount, and order date.
   - **Dynamic Status Dropdown**: Change status between `Pending` → `Confirmed` → `Shipped` → `Delivered` → `Cancelled`.
   - Automatic inventory restoration if an order is cancelled.
5. **Customer Directory**:
   - Customer name, email, phone number, primary shipping address.
   - Aggregated lifetime total orders placed and total amount spent per customer.
   - Registration timestamp.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | HTML5, Modern CSS3 (CSS Variables, Glassmorphism, Micro-animations), Vanilla JavaScript (ES6+ Modules, Fetch API) |
| **Backend** | Node.js, Express.js (RESTful API architecture & static asset delivery) |
| **Database** | MongoDB with Mongoose ODM (Schemas, Relationships, Validation, Pre-save Hooks) |
| **Security** | `bcryptjs` (Password Hashing), `jsonwebtoken` (JWT Auth & Role-Based Middleware) |
| **Styling** | Google Fonts (*Plus Jakarta Sans*), Custom SVG Icons, Responsive Grid & Flexbox |

---

## 📁 Project Structure

```
ecommerce/
├── client/                     # Frontend Client Files
│   ├── css/
│   │   ├── style.css           # Global tokens, navbar, product cards, checkout, responsive styles
│   │   ├── admin.css           # Admin sidebar, metric cards, data tables, modals
│   │   └── toast.css           # Floating toast notification system
│   ├── js/
│   │   ├── api.js              # Centralized API fetch wrapper, toast alerts, currency formatter
│   │   ├── auth.js             # Session management, JWT helpers, navbar state
│   │   ├── main.js             # Shop catalog, search with debounce, category filter, sorting
│   │   ├── product.js          # Product detail page, gallery, quantity picker, fast-track buy now
│   │   ├── cart.js             # Shopping cart table, quantity +/- handlers, order summary
│   │   ├── checkout.js         # Delivery address form, COD payment selection, order placement
│   │   ├── orders.js           # My Orders history cards, status badges, order cancellation
│   │   └── admin.js            # Admin SPA controller (stats, products CRUD, orders, customers)
│   ├── index.html              # Customer Shop Homepage
│   ├── product.html            # Single Product Details Page
│   ├── cart.html               # Shopping Cart Page
│   ├── checkout.html           # Cash on Delivery Checkout Page
│   ├── order-success.html      # Order Confirmation Notification Page
│   ├── orders.html             # Customer "My Orders" History Page
│   ├── login.html              # Customer Login Page
│   ├── register.html           # Customer Registration Page
│   ├── admin-login.html        # Dedicated Admin Login Page
│   └── admin.html              # Admin Portal (Dashboard, Products, Orders, Customers)
│
├── server/                     # Backend API & Server Files
│   ├── config/
│   │   └── db.js               # MongoDB connection logic via Mongoose
│   ├── controllers/
│   │   ├── authController.js   # User registration, login, and profile
│   │   ├── productController.js# Product listing, filtering, search, and details
│   │   ├── cartController.js   # Persistent user cart operations
│   │   ├── orderController.js  # COD order creation, user orders, order cancellation
│   │   └── adminController.js  # Dashboard metrics, product CRUD, status updater, customer list
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT authentication & admin authorization guards
│   │   └── errorMiddleware.js  # 404 handler and central JSON error responder
│   ├── models/
│   │   ├── User.js             # User Mongoose Schema (bcrypt hooks, roles)
│   │   ├── Product.js          # Product Mongoose Schema
│   │   ├── Cart.js             # Cart Mongoose Schema
│   │   └── Order.js            # Order Mongoose Schema (COD details, status workflow)
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth endpoints
│   │   ├── productRoutes.js    # /api/products endpoints
│   │   ├── cartRoutes.js       # /api/cart endpoints
│   │   ├── orderRoutes.js      # /api/orders endpoints
│   │   └── adminRoutes.js      # /api/admin endpoints
│   ├── utils/
│   │   └── seedData.js         # Comprehensive seed data (admin, users, 16 curated products)
│   ├── seed.js                 # Standalone database seeder (`npm run seed`)
│   └── server.js               # Express server entry point
│
├── .env                        # Local environment variables
├── .env.example                # Example environment template
├── package.json                # Project dependencies and npm scripts
└── README.md                   # Full documentation & project manual
```

---

## 🚀 Installation & Running Instructions

### Prerequisites
1. **Node.js** (v16 or higher recommended; verified on v24.x)
2. **MongoDB**:
   - Local MongoDB Community Server running on port `27017` (e.g., Windows Service `MongoDB`), **OR**
   - Cloud MongoDB Atlas connection string.

---

### Step 1: Clone or Open Project
Open the project directory in your terminal or in Visual Studio Code:
```bash
cd "c:\Users\Mahender\OneDrive\Desktop\ecommerce"
```

### Step 2: Install Dependencies
Run the following command in the root folder to install all required npm packages (`express`, `mongoose`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `cors`):
```bash
npm install
```

### Step 3: Configure Environment Variables
A `.env` file is already created. You can adjust it if you are using MongoDB Atlas:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_db
JWT_SECRET=supersecretjwtkey_eshop_college_project_2026
NODE_ENV=development
```
*(For MongoDB Atlas, simply replace `MONGO_URI` with your connection string).*

### Step 4: Seed the Database
Populate your database with the administrator account, customer accounts, and 16 curated products across diverse categories:
```bash
npm run seed
```

### Step 5: Start the Application
Start the Node.js / Express server:
```bash
npm start
```
*Or for development with automatic reload on changes:*
```bash
npm run dev
```

Open your browser and navigate to:
- **Customer Store**: [http://localhost:5000](http://localhost:5000)
- **Admin Portal**: [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html)

---

## 🔑 Default Login Credentials

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Administrator** | `admin@eshop.com` | `admin123` | Full Admin Panel (`/admin.html`) & Products/Orders/Customers CRUD |
| **Test Customer 1** | `user@eshop.com` | `user123` | Shopping Bag, COD Checkout, My Orders |
| **Test Customer 2** | `priya@eshop.com` | `user123` | Shopping Bag, COD Checkout, My Orders |

> **Tip:** Both the Customer Login and Admin Login pages include a **⚡ Auto-fill Demo Credentials** button for instant one-click login!

---

## 🧪 Testing the Complete Flow Step-by-Step

### 1. Customer Shopping & Cash on Delivery (COD) Flow:
1. Navigate to `http://localhost:5000/`.
2. Browse products, filter by category (e.g. *Electronics*), or use the search bar to find "Sony".
3. Click on any product card to view the **Product Details Page** (`/product.html?id=...`).
4. Select quantity (e.g., 2) and click **Add to Cart**. A toast alert will confirm the addition, and the cart badge in the navbar will update.
5. Click the **Cart** icon in the navbar to open `cart.html`.
6. Inspect the items, adjust quantities, or review the subtotal.
7. Click **Proceed to Checkout →** to navigate to `checkout.html`.
8. The delivery details will be auto-filled if logged in (or you can edit your address).
9. Confirm the selected payment mode: **Cash on Delivery (COD)**.
10. Click **Confirm & Place Order (COD)**.
11. You will be directed to the **Order Confirmation Screen** (`/order-success.html`) displaying your generated Order ID (e.g. `#ORD-2026-10492`).
12. Click **View My Orders** (`/orders.html`) to see your order listed with its `Pending` status.

### 2. Administrator Flow:
1. Navigate to `http://localhost:5000/admin-login.html`.
2. Click **Auto-fill Admin Credentials** and sign in.
3. The **Admin Dashboard** opens:
   - Review live metrics: Total Products, Total Customers, Total Orders, Pending Orders, and Total Revenue.
4. Click **Products** in the sidebar:
   - Search for products.
   - Click **Edit** to modify a product's price or stock.
   - Click **Add Product** in the sidebar to publish a new product to MongoDB.
5. Click **Orders** in the sidebar:
   - Locate the newly placed customer order.
   - Click the status dropdown and update from `Pending` → `Confirmed` → `Shipped` → `Delivered`.
   - Log back into the customer account to see the status updated in real-time under **My Orders**!
6. Click **Customers** in the sidebar:
   - View registered customers, their contact numbers, addresses, lifetime order counts, and total spend.
7. Click **Admin Logout** to securely exit the session.

---

## 📡 REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new customer account
- `POST /api/auth/login` — Sign in and receive JWT bearer token
- `GET /api/auth/me` — Fetch currently authenticated user profile

### Products (`/api/products`)
- `GET /api/products` — Retrieve all products (supports `?keyword=...`, `?category=...`, `?sort=...`)
- `GET /api/products/categories` — Get list of distinct product categories
- `GET /api/products/:id` — Retrieve single product details and related recommendations

### Shopping Cart (`/api/cart` - Protected)
- `GET /api/cart` — Fetch active shopping cart
- `POST /api/cart/add` — Add item to cart with quantity validation against stock
- `PUT /api/cart/update` — Update item quantity in cart
- `DELETE /api/cart/remove/:productId` — Remove specific item from cart
- `DELETE /api/cart/clear` — Clear entire shopping cart

### Orders (`/api/orders` - Protected)
- `POST /api/orders` — Place order with Cash on Delivery (deducts inventory & clears cart)
- `GET /api/orders/myorders` — Retrieve authenticated user's order history
- `GET /api/orders/:id` — Get single order details
- `PUT /api/orders/:id/cancel` — Cancel pending/confirmed order and restore inventory

### Admin Management (`/api/admin` - Protected / Admin Only)
- `GET /api/admin/metrics` — Dashboard stats (counts, revenue, recent orders)
- `GET /api/admin/products` — Admin products list with search
- `POST /api/admin/products` — Add new product
- `PUT /api/admin/products/:id` — Update existing product
- `DELETE /api/admin/products/:id` — Delete product
- `GET /api/admin/orders` — View all customer orders
- `PUT /api/admin/orders/:id/status` — Update order fulfillment status
- `GET /api/admin/customers` — Customer base directory with order aggregates

---

## 🎓 Academic / Major Project Demonstration Points
- **Architecture**: Decoupled MVC REST backend with clean, responsive client-side routing and DOM manipulation.
- **Database Engineering**: Normalized Mongoose schemas with pre-save encryption middleware, relational references (`ref: 'User'`, `ref: 'Product'`), and MongoDB Aggregation Pipelines for revenue and customer metrics.
- **Security**: Strict role-based access control (RBAC), bcrypt 10-round salt hashing, JWT validation with expiration, and defensive input sanitization.
- **Production Readiness**: Environment-driven configurations, graceful database connection retries, and comprehensive error handling.
