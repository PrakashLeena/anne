// Minimal test server for Vercel debugging
const express = require("express");
const cors = require("cors");

const app = express();

// Basic CORS
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "✅ Minimal backend is working!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Test API endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "✅ API test endpoint working!",
    timestamp: new Date().toISOString(),
    cloudinary: {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
      api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
      api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing'
    }
  });
});

// Basic products endpoint
app.get("/api/products", (req, res) => {
  res.json([
    {
      id: "test-1",
      title: "Test Product",
      price: 99.99,
      stock: 10,
      category: "Test",
      image: "https://via.placeholder.com/300x300"
    }
  ]);
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Export for Vercel
module.exports = app;
