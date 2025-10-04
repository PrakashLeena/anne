// backend/server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
require("dotenv").config();
const mongoose = require("mongoose");

const app = express();

// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim())
      : ['http://localhost:3000', 'https://localhost:3000'];
    
    // For debugging: log all origins
    console.log('🌐 CORS request from origin:', origin);
    console.log('🔍 Allowed origins:', allowedOrigins);
    
    // Allow all Vercel domains for debugging
    if (origin && (origin.includes('vercel.app') || allowedOrigins.indexOf(origin) !== -1)) {
      console.log('✅ CORS allowed for origin:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS blocked origin:', origin);
      // For debugging, allow all origins temporarily
      callback(null, true); // Change this back to callback(new Error('Not allowed by CORS')) after debugging
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());

// --- MongoDB Atlas connection ---
const MONGODB_URI = "mongodb+srv://kiboxsonleena:20040620Kiyu@cluster0.cr1byep.mongodb.net/passkey?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(MONGODB_URI, {
    // options recommended for Mongoose 8+
    dbName: "passkey",
  })
  .then(async () => {
    console.log("✅ Connected to MongoDB Atlas");
    // Test the connection with a ping
    await mongoose.connection.db.admin().ping();
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
  });

// Chat Message Schema
const chatMessageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  sender: { type: String, required: true }, // 'user' or 'admin'
  senderName: { type: String, default: 'Anonymous' },
  userId: { type: String, default: null }, // Firebase UID for registered users
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String, required: true }, // to group conversations
  isRead: { type: Boolean, default: false }
});

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);

// User Schema for storing registered users
const userSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // Firebase UID
  username: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, default: 'user' }, // 'user' or 'admin'
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: String, required: true }, // Firebase UID
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  items: [{
    productId: { type: String, required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    image: { type: String, default: null }
  }],
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'Sri Lanka' }
  },
  paymentMethod: { type: String, default: 'Cash on Delivery' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  paymentDetails: {
    status_code: String,
    status_message: String,
    card_holder_name: String,
    card_no: String,
    transaction_id: String
  },
  orderDate: { type: Date, default: Date.now },
  estimatedDelivery: { type: Date },
  trackingNumber: { type: String, default: null }
});

const Order = mongoose.model('Order', orderSchema);

// Email Credentials Schema (for sending confirmation emails)
const credentialSchema = new mongoose.Schema({
  user: String,
  pass: String
});

const Credential = mongoose.model("Credential", credentialSchema, "bulkmail");

// Product Schema
const productSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  image: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// Flash Product Schema
const flashProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  category: { type: String, default: 'General' },
  image: { type: String, default: null },
  discount: { type: Number, default: null },
  startsAt: { type: String, default: null },
  endsAt: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const FlashProduct = mongoose.model('FlashProduct', flashProductSchema);

// Persistent JSON storage for products (fallback for local development)
const DATA_DIR = path.join(__dirname, "data");
const PRODUCTS_FILE = path.join(DATA_DIR, "products.json");
const FLASH_FILE = path.join(DATA_DIR, "flash_products.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, "[]", "utf8");
  if (!fs.existsSync(FLASH_FILE)) fs.writeFileSync(FLASH_FILE, "[]", "utf8");
}

// MongoDB-based product functions (for production)
async function readProducts() {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    return products.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      category: p.category,
      image: p.image
    }));
  } catch (error) {
    console.error('Error reading products from MongoDB:', error);
    // Fallback to JSON file for local development
    return readProductsFromFile();
  }
}

async function saveProduct(productData) {
  try {
    console.log('🔄 Attempting to save product to MongoDB:', productData);
    
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error('❌ MongoDB not connected. Connection state:', mongoose.connection.readyState);
      throw new Error('Database not connected');
    }
    
    const product = new Product(productData);
    console.log('📝 Created product document:', product);
    
    const savedProduct = await product.save();
    console.log('✅ Product saved successfully:', savedProduct);
    
    return {
      id: savedProduct.id,
      title: savedProduct.title,
      price: savedProduct.price,
      stock: savedProduct.stock,
      category: savedProduct.category,
      image: savedProduct.image
    };
  } catch (error) {
    console.error('❌ Error saving product to MongoDB:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // If MongoDB fails, try fallback to JSON file for debugging
    try {
      console.log('🔄 Attempting fallback to JSON file...');
      const items = readProductsFromFile();
      items.push(productData);
      writeProductsToFile(items);
      console.log('✅ Product saved to JSON file as fallback');
      return productData;
    } catch (fallbackError) {
      console.error('❌ Fallback to JSON file also failed:', fallbackError);
      throw new Error(`MongoDB save failed: ${error.message}, Fallback failed: ${fallbackError.message}`);
    }
  }
}

async function deleteProduct(productId) {
  try {
    const result = await Product.deleteOne({ id: productId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting product from MongoDB:', error);
    throw error;
  }
}

async function readFlashProducts() {
  try {
    const flashProducts = await FlashProduct.find({}).sort({ createdAt: -1 });
    return flashProducts.map(p => ({
      id: p.id,
      title: p.title,
      price: p.price,
      stock: p.stock,
      category: p.category,
      image: p.image,
      discount: p.discount,
      startsAt: p.startsAt,
      endsAt: p.endsAt
    }));
  } catch (error) {
    console.error('Error reading flash products from MongoDB:', error);
    // Fallback to JSON file for local development
    return readFlashFromFile();
  }
}

async function saveFlashProduct(productData) {
  try {
    const flashProduct = new FlashProduct(productData);
    await flashProduct.save();
    return {
      id: flashProduct.id,
      title: flashProduct.title,
      price: flashProduct.price,
      stock: flashProduct.stock,
      category: flashProduct.category,
      image: flashProduct.image,
      discount: flashProduct.discount,
      startsAt: flashProduct.startsAt,
      endsAt: flashProduct.endsAt
    };
  } catch (error) {
    console.error('Error saving flash product to MongoDB:', error);
    throw error;
  }
}

async function deleteFlashProduct(productId) {
  try {
    const result = await FlashProduct.deleteOne({ id: productId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting flash product from MongoDB:', error);
    throw error;
  }
}

// Fallback functions for local development
function readProductsFromFile() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function writeProductsToFile(list) {
  ensureDataFile();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(list, null, 2), "utf8");
}

function readFlashFromFile() {
  ensureDataFile();
  try {
    const raw = fs.readFileSync(FLASH_FILE, "utf8");
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function writeFlashToFile(list) {
  ensureDataFile();
  fs.writeFileSync(FLASH_FILE, JSON.stringify(list, null, 2), "utf8");
}

// Email sending function
async function sendOrderConfirmationEmail(orderDetails) {
  try {
    console.log("🔍 Attempting to send order confirmation email...");
    
    const credentials = await Credential.find();
    console.log("📧 Email credentials found:", credentials.length > 0 ? "Yes" : "No");
    
    if (!credentials || credentials.length === 0) {
      console.log("❌ No email credentials found in database");
      return false;
    }

    console.log("📧 Using email:", credentials[0].user);
    console.log("🔑 Password length:", credentials[0].pass ? credentials[0].pass.length : 0);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: credentials[0].user,
        pass: credentials[0].pass,
      },
    });

    // Test the connection
    console.log("🔗 Testing email connection...");
    await transporter.verify();
    console.log("✅ Email connection verified successfully");

    const emailContent = `
Dear ${orderDetails.customerName},

Thank you for your order! Here are your order details:

Order ID: ${orderDetails.orderId}
Order Date: ${new Date(orderDetails.orderDate).toLocaleDateString()}
Total Amount: $${orderDetails.totalAmount.toFixed(2)}
Payment Method: ${orderDetails.paymentMethod}
Tracking Number: ${orderDetails.trackingNumber}

Items Ordered:
${orderDetails.items.map(item => `- ${item.title} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Shipping Address:
${orderDetails.shippingAddress.street}
${orderDetails.shippingAddress.city}, ${orderDetails.shippingAddress.state}
${orderDetails.shippingAddress.zipCode}
${orderDetails.shippingAddress.country}

Estimated Delivery: ${new Date(orderDetails.estimatedDelivery).toLocaleDateString()}

Thank you for shopping with us!

Best regards,
Your E-commerce Team
    `;

    console.log("📤 Sending email to:", orderDetails.customerEmail);
    
    const mailOptions = {
      from: credentials[0].user,
      to: orderDetails.customerEmail,
      subject: `Order Confirmation - ${orderDetails.orderId}`,
      text: emailContent,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully!");
    console.log("📧 Message ID:", result.messageId);
    console.log("📧 Response:", result.response);
    
    return true;
  } catch (error) {
    console.error("❌ Error sending order confirmation email:");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    if (error.response) {
      console.error("SMTP Response:", error.response);
    }
    return false;
  }
}

// DB health check
app.get("/api/health/db", (req, res) => {
  const state = mongoose.connection?.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  res.json({
    mongoConnected: state === 1,
    state,
  });
});

// Test email credentials endpoint
app.get("/api/test-email", async (req, res) => {
  try {
    console.log("🔍 Testing email credentials...");
    
    const credentials = await Credential.find();
    console.log("📧 Credentials in database:", credentials.length);
    
    if (!credentials || credentials.length === 0) {
      return res.json({
        success: false,
        error: "No email credentials found in database",
        collection: "bulkmail",
        message: "Please add email credentials to MongoDB bulkmail collection"
      });
    }

    const testTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: credentials[0].user,
        pass: credentials[0].pass,
      },
    });

    // Test connection
    await testTransporter.verify();
    
    res.json({
      success: true,
      message: "Email credentials are valid",
      email: credentials[0].user,
      passwordLength: credentials[0].pass ? credentials[0].pass.length : 0
    });
    
  } catch (error) {
    console.error("❌ Email test failed:", error);
    res.json({
      success: false,
      error: error.message,
      code: error.code,
      message: "Email credentials test failed"
    });
  }
});

// Add email credentials endpoint (for setup)
app.post("/api/setup-email", async (req, res) => {
  try {
    const { user, pass } = req.body;
    
    if (!user || !pass) {
      return res.status(400).json({
        success: false,
        error: "Email and password are required"
      });
    }

    // Delete existing credentials
    await Credential.deleteMany({});
    
    // Add new credentials
    const newCredential = new Credential({ user, pass });
    await newCredential.save();
    
    console.log("✅ Email credentials saved successfully");
    
    res.json({
      success: true,
      message: "Email credentials saved successfully",
      email: user
    });
    
  } catch (error) {
    console.error("❌ Failed to save email credentials:", error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Chat API endpoints
// Get all messages for a session
app.get("/api/chat/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await ChatMessage.find({ sessionId })
      .sort({ timestamp: 1 })
      .limit(100); // Limit to last 100 messages
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send a new message
app.post("/api/chat", async (req, res) => {
  try {
    const { message, sender, senderName, sessionId, userId } = req.body;
    
    if (!message || !sender || !sessionId) {
      return res.status(400).json({ error: "Missing required fields: message, sender, sessionId" });
    }

    const newMessage = new ChatMessage({
      message,
      sender, // 'user' or 'admin'
      senderName: senderName || (sender === 'admin' ? 'Admin' : 'Customer'),
      userId: userId || null, // Firebase UID for registered users
      sessionId,
      timestamp: new Date()
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all active chat sessions (for admin panel)
app.get("/api/chat-sessions", async (req, res) => {
  try {
    const sessions = await ChatMessage.aggregate([
      {
        $group: {
          _id: "$sessionId",
          lastMessage: { $last: "$message" },
          lastTimestamp: { $last: "$timestamp" },
          messageCount: { $sum: 1 },
          userId: { $last: "$userId" },
          senderName: { $last: "$senderName" },
          unreadCount: { 
            $sum: { 
              $cond: [{ $and: [{ $eq: ["$sender", "user"] }, { $eq: ["$isRead", false] }] }, 1, 0] 
            } 
          }
        }
      },
      { $sort: { lastTimestamp: -1 } }
    ]);
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Mark messages as read
app.put("/api/chat/:sessionId/read", async (req, res) => {
  try {
    await ChatMessage.updateMany(
      { sessionId: req.params.sessionId, sender: 'user', isRead: false },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete chat session and all its messages
app.delete("/api/chat-sessions/:sessionId", async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    
    // Delete all messages for this session
    const result = await ChatMessage.deleteMany({ sessionId: sessionId });
    
    console.log(`Deleted ${result.deletedCount} messages for session ${sessionId}`);
    
    res.json({ 
      success: true, 
      deletedCount: result.deletedCount,
      message: `Chat session ${sessionId} and all its messages have been deleted`
    });
  } catch (err) {
    console.error('Error deleting chat session:', err);
    res.status(500).json({ error: err.message });
  }
});

// User Management Endpoints

// Register or update user (called when user signs up or logs in)
app.post("/api/users", async (req, res) => {
  try {
    const { userId, username, email } = req.body;
    
    if (!userId || !username || !email) {
      return res.status(400).json({ error: "Missing required fields: userId, username, email" });
    }

    const user = await User.findOneAndUpdate(
      { userId },
      { 
        username, 
        email, 
        lastActive: new Date() 
      },
      { 
        upsert: true, 
        new: true, 
        setDefaultsOnInsert: true 
      }
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all users (for admin panel)
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user role
app.put("/api/users/:userId/role", async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: "Role must be 'user' or 'admin'" });
    }

    const user = await User.findOneAndUpdate(
      { userId: req.params.userId },
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete user
app.delete("/api/users/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    
    // Delete the user
    const deletedUser = await User.findOneAndDelete({ userId });
    
    console.log(`Deleted user: ${deletedUser.username} (${userId})`);
    
    res.json({ 
      success: true, 
      message: `User ${deletedUser.username} has been permanently deleted`,
      deletedUser: deletedUser
    });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ error: err.message });
  }
});

// Order Management Endpoints

// Create a new order
app.post("/api/orders", async (req, res) => {
  try {
    const { userId, customerName, customerEmail, items, totalAmount, shippingAddress, paymentMethod } = req.body;
    
    if (!userId || !customerName || !customerEmail || !items || !totalAmount || !shippingAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Calculate estimated delivery (7 days from now)
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 7);

    const newOrder = new Order({
      orderId,
      userId,
      customerName,
      customerEmail,
      items,
      totalAmount,
      shippingAddress,
      paymentMethod: paymentMethod || 'Cash on Delivery',
      estimatedDelivery,
      trackingNumber: `TRK${Date.now()}`
    });

    const savedOrder = await newOrder.save();
    
    // Send order confirmation email
    await sendOrderConfirmationEmail(savedOrder);
    
    res.status(201).json(savedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders for a specific user
app.get("/api/orders/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId }).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all orders (for admin)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find({}).sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get specific order by orderId
app.get("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (for admin)
app.put("/api/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }
    
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId },
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete order (only cancelled orders)
app.delete("/api/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    
    // First check if order exists and is cancelled
    const order = await Order.findOne({ orderId });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    if (order.status !== 'cancelled') {
      return res.status(400).json({ error: "Only cancelled orders can be deleted" });
    }
    
    // Delete the order
    const deletedOrder = await Order.findOneAndDelete({ orderId });
    
    console.log(`Deleted cancelled order: ${orderId}`);
    
    res.json({ 
      success: true, 
      message: `Order ${orderId} has been permanently deleted`,
      deletedOrder: deletedOrder
    });
  } catch (err) {
    console.error('Error deleting order:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/sendmail", async (req, res) => {
  const { message, recipients } = req.body;

  if (!recipients || recipients.length === 0) {
    return res.json(false);
  }

  try {
    const data = await Credential.find();
    if (!data || data.length === 0) {
      return res.json(false);
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: data[0].user,
        pass: data[0].pass, // Gmail app password
      },
    });

    // Send emails one by one
    for (let i = 0; i < recipients.length; i++) {
      await transporter.sendMail({
        from: data[0].user,
        to: recipients[i],
        subject: "Message from Bulk Mail",
        text: message,
      });
    }

    console.log("All mails sent successfully ✅");
    res.json(true);

  } catch (error) {
    console.error("Error sending mail:", error);
    res.json(false);
  }
});

// Send order cancellation email endpoint
app.post("/api/send-cancellation-email", async (req, res) => {
  try {
    const { orderId, customerName, customerEmail, totalAmount, items, orderDate } = req.body;
    
    console.log("📧 Sending order cancellation email...");
    
    const credentials = await Credential.find();
    if (!credentials || credentials.length === 0) {
      console.log("❌ No email credentials found for cancellation email");
      return res.json({ success: false, error: "No email credentials configured" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: credentials[0].user,
        pass: credentials[0].pass,
      },
    });

    const cancellationEmailContent = `
Dear ${customerName},

We regret to inform you that your order has been cancelled.

Order Details:
Order ID: ${orderId}
Order Date: ${new Date(orderDate).toLocaleDateString()}
Total Amount: $${totalAmount.toFixed(2)}

Cancelled Items:
${items.map(item => `- ${item.title} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`).join('\n')}

Reason for Cancellation:
Your order has been cancelled by our admin team. This could be due to:
- Product unavailability
- Payment processing issues
- Inventory constraints
- Other operational reasons

What happens next:
- If you have already made a payment, a full refund will be processed within 3-5 business days
- You will receive a separate email confirmation once the refund is initiated
- You can place a new order anytime on our website

We sincerely apologize for any inconvenience caused. If you have any questions or concerns, please don't hesitate to contact our customer support team.

Thank you for your understanding.

Best regards,
Customer Service Team
Your E-commerce Store
    `;

    console.log("📤 Sending cancellation email to:", customerEmail);
    
    const result = await transporter.sendMail({
      from: credentials[0].user,
      to: customerEmail,
      subject: `Order Cancellation - ${orderId}`,
      text: cancellationEmailContent,
    });

    console.log("✅ Cancellation email sent successfully!");
    console.log("📧 Message ID:", result.messageId);
    
    res.json({ success: true, message: "Cancellation email sent successfully" });
    
  } catch (error) {
    console.error("❌ Error sending cancellation email:");
    console.error("Error type:", error.name);
    console.error("Error message:", error.message);
    res.json({ success: false, error: error.message });
  }
});

// PayHere payment notification endpoint
app.post("/api/payhere/notify", async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      amount,
      currency,
      status_code,
      md5sig,
      custom_1, // userId
      custom_2, // domain
      method,
      status_message,
      card_holder_name,
      card_no,
      card_expiry
    } = req.body;

    console.log('PayHere notification received:', req.body);

    // Verify the hash for security
    const merchantSecret = "MTczMjUyMTQ3ODE0MTI5Njg5MzkyMTEyMjA2MDI2NDU3NDUw";
    const appId = "4OVyIPRBDwu4JFnJsiyj4a3D3";
    const appSecret = "4E1BAvC5UIL4ZCbWDIfItK49Z4CkZCF0N8W3jZn6NXjp";
    const crypto = require('crypto');
    
    const localMd5sig = crypto.createHash('md5')
      .update(merchant_id + order_id + amount + currency + status_code + crypto.createHash('md5').update(merchantSecret).digest('hex').toUpperCase())
      .digest('hex')
      .toUpperCase();

    if (localMd5sig !== md5sig) {
      console.log('Invalid hash signature');
      return res.status(400).send('Invalid signature');
    }

    // Update order status based on payment status
    let orderStatus = 'pending';
    if (status_code === '2') {
      orderStatus = 'processing'; // Payment successful
    } else if (status_code === '-1' || status_code === '-2' || status_code === '-3') {
      orderStatus = 'cancelled'; // Payment failed/cancelled
    }

    // Update order in database
    const updatedOrder = await Order.findOneAndUpdate(
      { orderId: order_id },
      { 
        status: orderStatus,
        paymentStatus: status_code === '2' ? 'paid' : 'failed',
        paymentMethod: `PayHere - ${method}`,
        paymentDetails: {
          status_code,
          status_message,
          card_holder_name,
          card_no: card_no ? `****${card_no.slice(-4)}` : null,
          transaction_id: req.body.payment_id
        }
      },
      { new: true }
    );

    if (updatedOrder) {
      console.log(`Order ${order_id} updated with payment status: ${orderStatus}`);
      
      // Send status update email if payment successful
      if (status_code === '2') {
        const statusEmailContent = `
Dear ${updatedOrder.customerName},

Great news! Your payment has been successfully processed.

Order ID: ${updatedOrder.orderId}
Payment Status: Successful
Amount Paid: LKR ${amount}
Payment Method: ${method}

Your order is now being processed and will be shipped soon.

Thank you for your business!

Best regards,
Your E-commerce Team
        `;

        // Send status update email (optional)
        try {
          const credentials = await Credential.find();
          if (credentials && credentials.length > 0) {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
              service: "gmail",
              auth: {
                user: credentials[0].user,
                pass: credentials[0].pass,
              },
            });

            await transporter.sendMail({
              from: credentials[0].user,
              to: updatedOrder.customerEmail,
              subject: `Payment Confirmation - ${updatedOrder.orderId}`,
              text: statusEmailContent,
            });
          }
        } catch (emailError) {
          console.error('Failed to send payment confirmation email:', emailError);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('PayHere notification error:', error);
    res.status(500).send('Error processing notification');
  }
});

// PayHere return URL handler
app.get("/api/payhere/return", (req, res) => {
  const { order_id, status } = req.query;
  
  // Redirect to frontend with payment result
  if (status === 'success') {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-success?order=${order_id}`);
  } else {
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment-failed?order=${order_id}`);
  }
});

// Test endpoint to verify API is working
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working", 
    timestamp: new Date().toISOString(),
    mongoState: mongoose.connection.readyState,
    mongoStateText: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const items = await readProducts();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    console.log('📥 Received product creation request:', req.body);
    
    const { id, title, price, stock, category, image } = req.body || {};
    
    // Validate required fields
    if (!title || typeof price !== "number") {
      console.error('❌ Validation failed - missing required fields');
      return res.status(400).json({ error: "Missing required fields: title, price" });
    }
    
    const pid = String(id || `${title}-${Date.now()}`);
    const productData = {
      id: pid,
      title,
      price,
      stock: Number(stock || 0),
      category: category || (title ? title.split(" ")[0] : "General"),
      image: image || null,
    };
    
    console.log('🔄 Prepared product data:', productData);
    
    const savedProduct = await saveProduct(productData);
    console.log('✅ Product saved, sending response:', savedProduct);
    
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('❌ Error in POST /api/products:', err);
    res.status(500).json({ 
      error: err.message,
      details: 'Check server logs for more information'
    });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const deleted = await deleteProduct(id);
    if (!deleted) return res.status(404).json({ error: "Product not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Flash products API
app.get("/api/flash-products", async (req, res) => {
  try {
    const items = await readFlashProducts();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/flash-products", async (req, res) => {
  try {
    const { id, title, price, stock, category, image, startsAt, endsAt, discount } = req.body || {};
    if (!title || typeof price !== "number") {
      return res.status(400).json({ error: "Missing required fields: title, price" });
    }
    const pid = String(id || `${title}-${Date.now()}`);
    const productData = {
      id: pid,
      title,
      price,
      stock: Number(stock || 0),
      category: category || (title ? title.split(" ")[0] : "General"),
      image: image || null,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      discount: typeof discount === 'number' ? discount : null,
    };
    const savedProduct = await saveFlashProduct(productData);
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/flash-products/:id", async (req, res) => {
  try {
    const id = String(req.params.id);
    const deleted = await deleteFlashProduct(id);
    if (!deleted) return res.status(404).json({ error: "Flash product not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// WhatsApp Cloud API integration
// Required env vars: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, VERIFY_TOKEN
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "dev-verify-token";

// Send a WhatsApp message using Cloud API
// Body: { to: "+9470..." | "9470...", text: "message" }
app.post("/api/whatsapp/send", async (req, res) => {
  try {
    if (!WHATSAPP_TOKEN || !WHATSAPP_PHONE_NUMBER_ID) {
      return res.status(500).json({ error: "WhatsApp API not configured" });
    }
    const { to, text, template } = req.body;
    if (!to || (!text && !template)) {
      return res.status(400).json({ error: "Missing 'to' and 'text' or 'template'" });
    }

    const toNumber = String(to).replace(/[^\d]/g, "");
    const url = `https://graph.facebook.com/v20.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    let payload;
    if (template) {
      // template: { name: string, language: { code: 'en_US' }, components?: [...] }
      payload = {
        messaging_product: "whatsapp",
        to: toNumber,
        type: "template",
        template,
      };
    } else {
      payload = {
        messaging_product: "whatsapp",
        to: toNumber,
        type: "text",
        text: { body: text },
      };
    }

    const resp = await axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
    });
    res.json({ success: true, data: resp.data });
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: err.response?.data || err.message });
  }
});

// Webhook verification (GET) and receiver (POST)
app.get("/api/whatsapp/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post("/api/whatsapp/webhook", (req, res) => {
  const body = req.body;
  // Basic logging of incoming messages/events for now
  try {
    console.log("📥 WhatsApp Webhook:", JSON.stringify(body, null, 2));
  } catch {}
  // TODO: handle messages and optionally forward to an admin UI or email/DB.
  res.sendStatus(200);
});

app.listen(5000, () => console.log("✅ Backend running on http://localhost:5000"));
