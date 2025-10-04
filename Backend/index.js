// Ultra-minimal server using pure Node.js HTTP
const http = require('http');
const url = require('url');

const server = http.createServer((req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;

  try {
    if (path === '/') {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: "🚀 Ultra-minimal backend working!",
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      }));
    } else if (path === '/api/test') {
      res.writeHead(200);
      res.end(JSON.stringify({
        message: "✅ API test working!",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
      }));
    } else if (path === '/api/products') {
      res.writeHead(200);
      res.end(JSON.stringify([
        {
          id: "test-1",
          title: "Test Product",
          price: 99.99,
          stock: 10,
          category: "Test",
          image: "https://via.placeholder.com/300x300"
        }
      ]));
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({
        error: 'Route not found',
        path: path,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    res.writeHead(500);
    res.end(JSON.stringify({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    }));
  }
});

// For local development
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`✅ Ultra-minimal server running on port ${PORT}`);
  });
}

// Export for Vercel
module.exports = server;
