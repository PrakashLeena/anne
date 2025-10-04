import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProducts } from "../context/ProductsContext";
import storageService from "../services/storage";
import axios from "axios";
import EmailTest from "./EmailTest";
import PayHereConfig from "./PayHereConfig";
import { getApiUrl } from "../config/api";

export default function AdminPanel({ onBack, isAdmin = false }) {
  const [tab, setTab] = useState("products");

  // Shared products state
  const { products, addProduct: ctxAddProduct, removeProduct: ctxRemoveProduct } = useProducts();
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({ title: "", price: "", stock: "", category: "" });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [filter, setFilter] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Flash sale state
  const [flashForm, setFlashForm] = useState({ title: "", price: "", stock: "", category: "", discount: "", startsAt: "", endsAt: "" });
  const [flashImageFile, setFlashImageFile] = useState(null);
  const [flashImagePreview, setFlashImagePreview] = useState("");
  const [flashItems, setFlashItems] = useState([]);
  const [isFlashSubmitting, setIsFlashSubmitting] = useState(false);
  
  // Global Flash Sale Timer Control
  const [globalFlashTimer, setGlobalFlashTimer] = useState(() => {
    try {
      const saved = localStorage.getItem('globalFlashTimer');
      return saved ? JSON.parse(saved) : { startsAt: "", endsAt: "", isActive: false, isLocked: false };
    } catch {
      return { startsAt: "", endsAt: "", isActive: false, isLocked: false };
    }
  });
  const [cloudName, setCloudName] = useState(() => {
    try { return localStorage.getItem('CLOUDINARY_CLOUD_NAME') || ''; } catch { return ''; }
  });
  const [uploadPreset, setUploadPreset] = useState(() => {
    try { return localStorage.getItem('CLOUDINARY_UPLOAD_PRESET') || ''; } catch { return ''; }
  });

  // Chat state
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");

  function saveCloudinaryConfig(e) {
    e.preventDefault();
    try {
      localStorage.setItem('CLOUDINARY_CLOUD_NAME', cloudName.trim());
      localStorage.setItem('CLOUDINARY_UPLOAD_PRESET', uploadPreset.trim());
      alert('Cloudinary config saved. You can upload images now.');
    } catch (err) {
      alert('Failed to save Cloudinary config to localStorage.');
    }
  }

  // Global Flash Timer Functions
  function saveGlobalFlashTimer(timer) {
    try {
      localStorage.setItem('globalFlashTimer', JSON.stringify(timer));
    } catch (err) {
      console.error('Failed to save global flash timer:', err);
    }
  }

  function setGlobalFlashSale(startsAt, endsAt) {
    const newTimer = {
      startsAt,
      endsAt,
      isActive: true,
      isLocked: true,
      setAt: new Date().toISOString()
    };
    setGlobalFlashTimer(newTimer);
    saveGlobalFlashTimer(newTimer);
    
    // Override form timer with global timer
    setFlashForm(prev => ({
      ...prev,
      startsAt,
      endsAt
    }));
    
    console.log('Global flash sale timer set:', newTimer);
  }

  function clearGlobalFlashSale() {
    if (window.confirm('Are you sure you want to clear the global flash sale timer? This will affect all flash sales.')) {
      const clearedTimer = { startsAt: "", endsAt: "", isActive: false, isLocked: false };
      setGlobalFlashTimer(clearedTimer);
      saveGlobalFlashTimer(clearedTimer);
      console.log('Global flash sale timer cleared');
    }
  }

  const filteredProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)
    );
  }, [products, filter]);

  // Load flash products
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(getApiUrl('/api/flash-products'));
        if (!res.ok) throw new Error(`Failed to load flash products: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setFlashItems(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load flash products', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function addProduct(e) {
    e.preventDefault();
    const title = form.title.trim();
    const price = Number(form.price);
    const stock = Number(form.stock);
    const category = form.category.trim() || "General";

    if (!title || isNaN(price) || isNaN(stock)) return;

    setIsSubmitting(true);

    try {
      // Validate image file if provided
      if (imageFile) {
        const validation = storageService.validateImageFile(imageFile);
        if (!validation.isValid) {
          alert(validation.error);
          setIsSubmitting(false);
          return;
        }
      }

      // Add product with image upload handled by ProductsContext
      await ctxAddProduct({ title, price, stock, category, imageFile });

      // Reset form on success
      setForm({ title: "", price: "", stock: "", category: "" });
      setImageFile(null);
      if (imagePreview) {
        storageService.revokePreviewUrl(imagePreview);
      }
      setImagePreview("");
    } catch (error) {
      console.error('Failed to add product:', error);
      alert(`Failed to add product: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  function deleteProduct(id) {
    ctxRemoveProduct(id);
  }

  function toggleUserRole(id) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: u.role === "admin" ? "user" : "admin" } : u))
    );
  }

  // Chat functions
  useEffect(() => {
    if (tab === "chat") {
      loadChatSessions();
      const interval = setInterval(loadChatSessions, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [tab]);

  // Load users when users tab is selected
  useEffect(() => {
    if (tab === "users") {
      loadUsers();
    }
  }, [tab]);

  // Load orders when orders tab is selected
  useEffect(() => {
    if (tab === "orders") {
      loadOrders();
    }
  }, [tab]);

  useEffect(() => {
    if (selectedSession) {
      loadChatMessages(selectedSession._id);
      const interval = setInterval(() => loadChatMessages(selectedSession._id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedSession]);

  async function loadChatSessions() {
    try {
      const response = await axios.get(getApiUrl('/api/chat-sessions'));
      setChatSessions(response.data);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    }
  }

  async function loadChatMessages(sessionId) {
    try {
      const response = await axios.get(getApiUrl(`/api/chat/${sessionId}`));
      setChatMessages(response.data);
      // Mark messages as read
      await axios.put(getApiUrl(`/api/chat/${sessionId}/read`));
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  }

  async function sendAdminMessage() {
    if (!adminMessage.trim() || !selectedSession) return;
    
    try {
      await axios.post(getApiUrl('/api/chat'), {
        message: adminMessage.trim(),
        sender: 'admin',
        senderName: 'Admin Support',
        sessionId: selectedSession._id
      });
      
      setAdminMessage("");
      loadChatMessages(selectedSession._id);
    } catch (error) {
      console.error('Failed to send admin message:', error);
    }
  }

  async function deleteChatSession(sessionId, sessionName) {
    if (!window.confirm(`Are you sure you want to delete the chat session with "${sessionName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(getApiUrl(`/api/chat-sessions/${sessionId}`));
      
      if (response.status === 200) {
        // Remove from local state
        setChatSessions(prev => prev.filter(session => session._id !== sessionId));
        
        // Clear selected session if it was the deleted one
        if (selectedSession && selectedSession._id === sessionId) {
          setSelectedSession(null);
          setChatMessages([]);
        }
        
        console.log('Chat session deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete chat session:', error);
      alert('Failed to delete chat session. Please try again.');
    }
  }

  // User management functions
  async function loadUsers() {
    try {
      const response = await axios.get(getApiUrl('/api/users'));
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  }

  async function toggleUserRole(userId) {
    try {
      const user = users.find(u => u.userId === userId);
      if (!user) return;
      
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      
      await axios.put(getApiUrl(`/api/users/${userId}/role`), { role: newRole });
      
      // Update local state
      setUsers(prev => 
        prev.map(u => u.userId === userId ? { ...u, role: newRole } : u)
      );
    } catch (error) {
      console.error('Failed to toggle user role:', error);
      alert('Failed to toggle user role');
    }
  }

  async function deleteUser(userId, username) {
    if (!window.confirm(`Are you sure you want to delete user "${username}"?\n\nThis action cannot be undone and will remove the user from the database.`)) {
      return;
    }

    try {
      const response = await axios.delete(getApiUrl(`/api/users/${userId}`));
      
      if (response.status === 200) {
        // Remove from local state
        setUsers(prev => prev.filter(user => user.userId !== userId));
        console.log('User deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  }

  async function loadOrders() {
    try {
      const response = await axios.get(getApiUrl('/api/orders'));
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    }
  }

  async function updateOrderStatus(orderId, newStatus) {
    try {
      await axios.put(getApiUrl(`/api/orders/${orderId}/status`), { status: newStatus });
      
      // If order is being cancelled, send cancellation email
      if (newStatus === 'cancelled') {
        const order = orders.find(o => o.orderId === orderId);
        if (order) {
          try {
            await axios.post(getApiUrl('/api/send-cancellation-email'), {
              orderId: order.orderId,
              customerEmail: order.customerEmail,
              customerName: order.customerName,
              items: order.items,
              totalAmount: order.totalAmount
            });
            console.log('Cancellation email sent successfully');
          } catch (emailError) {
            console.error('Failed to send cancellation email:', emailError);
            // Continue with status update even if email fails
          }
        }
      }
      
      // Update local state
      setOrders(prev => 
        prev.map(order => 
          order.orderId === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      
      // Show success message
      if (newStatus === 'cancelled') {
        window.alert(`Order #${orderId} cancelled successfully! Cancellation email sent to customer.`);
      } else {
        window.alert(`Order #${orderId} status updated to ${newStatus} successfully!`);
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
    }
  }

  async function deleteOrder(orderId, orderStatus) {
    if (orderStatus !== 'cancelled') {
      alert('Only cancelled orders can be deleted!');
      return;
    }

    if (!window.confirm(`Are you sure you want to permanently delete order ${orderId}?\n\nThis action cannot be undone and will remove the order from the database.`)) {
      return;
    }

    try {
      const response = await axios.delete(getApiUrl(`/api/orders/${orderId}`));
      
      if (response.status === 200) {
        // Remove from local state
        setOrders(prev => prev.filter(order => order.orderId !== orderId));
        console.log('Order deleted successfully');
      }
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order. Please try again.');
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      {!isAdmin ? (
        <div className="bg-white border rounded p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3 sm:gap-0">
            <h1 className="text-lg sm:text-xl font-semibold">Not authorized</h1>
            <button className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-sm sm:text-base" onClick={onBack}>Back</button>
          </div>
          <p className="text-gray-600 text-xs sm:text-sm">You do not have permission to access the admin panel.</p>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-bold">Admin Panel</h1>
            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300 text-sm sm:text-base"
                onClick={onBack}
              >
                Back
              </button>
            </div>
          </div>

          {/* Cloudinary Config */}
          <form onSubmit={saveCloudinaryConfig} className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
            <div className="text-sm font-medium mb-2">Cloudinary Configuration</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 items-end">
              <div className="flex flex-col">
                <label className="text-xs text-gray-600">Cloud Name</label>
                <input
                  className="border rounded px-2 py-1 text-sm"
                  value={cloudName}
                  onChange={(e) => setCloudName(e.target.value)}
                  placeholder="e.g. dgpocgkx3"
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-600">Upload Preset (Unsigned)</label>
                <input
                  className="border rounded px-2 py-1 text-sm"
                  value={uploadPreset}
                  onChange={(e) => setUploadPreset(e.target.value)}
                  placeholder="your_unsigned_preset"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="px-3 py-2 rounded bg-black text-white w-full sm:w-auto text-sm">Save</button>
              </div>
            </div>
            <div className="text-xs text-gray-600 mt-2">
              Status: {cloudName && uploadPreset ? <span className="text-green-700">Configured</span> : <span className="text-red-700">Missing values</span>}
            </div>
          </form>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-4 sm:mb-6">
            {[
              { key: "products", label: "Products" },
              { key: "orders", label: "Orders" },
              { key: "users", label: "Users" },
              { key: "flash", label: "Flash Sale" },
              { key: "chat", label: "Live Chat" },
              { key: "email", label: "📧 Email Setup" },
              { key: "payhere", label: "💳 PayHere Config" },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded border text-xs sm:text-sm ${
                  tab === t.key ? "bg-black text-white border-black" : "bg-white text-black border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {tab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
            {/* Add product (admins only) */}
            {isAdmin ?
            <form
              onSubmit={addProduct}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 items-end bg-white p-3 rounded border"
            >
              
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Title</label>
                <input
                  className="border rounded px-2 py-1 text-sm sm:text-base"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Product title"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Price</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm sm:text-base"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.01"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Stock</label>
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm sm:text-base"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  placeholder="0"
                  min="0"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Category</label>
                <input
                  className="border rounded px-2 py-1 text-sm sm:text-base"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="Category"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="border rounded px-2 py-1 text-xs sm:text-sm"
                  onChange={(e) => {
                    const file = e.target.files && e.target.files[0];
                    setImageFile(file || null);
                    if (imagePreview) {
                      storageService.revokePreviewUrl(imagePreview);
                    }
                    if (file) {
                      const previewUrl = storageService.createPreviewUrl(file);
                      setImagePreview(previewUrl);
                    } else {
                      setImagePreview("");
                    }
                  }}
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-3 py-2 rounded text-white ${
                  isSubmitting ? "bg-gray-500 cursor-not-allowed" : "bg-black hover:bg-gray-800"
                }`}
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </form>:""}

            {imagePreview && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Preview</div>
                <img src={imagePreview} alt="preview" className="h-24 w-24 object-cover rounded border" />
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <input
                className="border rounded px-3 py-2 w-full sm:w-64"
                placeholder="Search products..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <div className="text-sm text-gray-500">{filteredProducts.length} items</div>
            </div>

            {/* Product list */}
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Title</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Stock</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.title}</td>
                      <td className="px-3 py-2">{p.category}</td>
                      <td className="px-3 py-2">${p.price}</td>
                      <td className="px-3 py-2">{p.stock}</td>
                      <td className="px-3 py-2 text-right">
                        <button
                          className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={() => deleteProduct(p.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "flash" && (
          <motion.div
            key="flash"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Global Flash Sale Timer Control */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">🎯 Global Flash Sale Timer Control</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-3 text-gray-800">⏰ Set Global Timer</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={globalFlashTimer.startsAt}
                        onChange={(e) => setGlobalFlashTimer(prev => ({ ...prev, startsAt: e.target.value }))}
                        disabled={globalFlashTimer.isLocked}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        className="w-full border rounded px-3 py-2 text-sm"
                        value={globalFlashTimer.endsAt}
                        onChange={(e) => setGlobalFlashTimer(prev => ({ ...prev, endsAt: e.target.value }))}
                        disabled={globalFlashTimer.isLocked}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!globalFlashTimer.startsAt || !globalFlashTimer.endsAt) {
                            alert('Please set both start and end times');
                            return;
                          }
                          setGlobalFlashSale(globalFlashTimer.startsAt, globalFlashTimer.endsAt);
                        }}
                        className={`flex-1 px-3 py-2 text-white rounded text-sm ${
                          globalFlashTimer.isLocked
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                        disabled={globalFlashTimer.isLocked}
                      >
                        🔒 Lock Timer
                      </button>
                      <button
                        onClick={clearGlobalFlashSale}
                        className="flex-1 px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        🔓 Clear Timer
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded border">
                  <h4 className="font-medium mb-3 text-gray-800">📊 Timer Status</h4>
                  <div className="space-y-2 text-sm">
                    <div className={`p-2 rounded ${
                      globalFlashTimer.isActive 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-gray-100 text-gray-600 border border-gray-200'
                    }`}>
                      <strong>Status:</strong> {globalFlashTimer.isActive ? '🟢 Active' : '🔴 Inactive'}
                    </div>
                    <div className={`p-2 rounded ${
                      globalFlashTimer.isLocked 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      <strong>Lock Status:</strong> {globalFlashTimer.isLocked ? '🔒 Locked' : '🔓 Unlocked'}
                    </div>
                    {globalFlashTimer.startsAt && (
                      <div className="p-2 bg-blue-50 rounded border border-blue-200">
                        <strong>Start:</strong> {new Date(globalFlashTimer.startsAt).toLocaleString()}
                      </div>
                    )}
                    {globalFlashTimer.endsAt && (
                      <div className="p-2 bg-orange-50 rounded border border-orange-200">
                        <strong>End:</strong> {new Date(globalFlashTimer.endsAt).toLocaleString()}
                      </div>
                    )}
                    {globalFlashTimer.setAt && (
                      <div className="p-2 bg-gray-50 rounded border border-gray-200 text-xs">
                        <strong>Set At:</strong> {new Date(globalFlashTimer.setAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Flash Sale Control Panel */}
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-red-800 mb-4">⚡ Flash Sale Control Panel</h3>
              {globalFlashTimer.isLocked && (
                <div className="mb-4 p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800 text-sm">
                  ⚠️ <strong>Timer Locked:</strong> Global flash sale timer is active. All flash sales will use the global timer settings.
                </div>
              )}
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* Quick Start Flash Sale */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium mb-2">🚀 Quick Start</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (globalFlashTimer.isLocked) {
                          alert('Global flash sale timer is locked! Use the Global Timer Control to modify.');
                          return;
                        }
                        console.log('1-Hour Sale button clicked');
                        const now = new Date();
                        const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
                        setGlobalFlashSale(now.toISOString().slice(0, 16), end.toISOString().slice(0, 16));
                      }}
                      className={`w-full px-3 py-2 text-white rounded text-sm ${
                        globalFlashTimer.isLocked 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-green-500 hover:bg-green-600'
                      }`}
                      disabled={globalFlashTimer.isLocked}
                    >
                      Start 1 Hour Sale
                    </button>
                    <button
                      onClick={() => {
                        if (globalFlashTimer.isLocked) {
                          alert('Global flash sale timer is locked! Use the Global Timer Control to modify.');
                          return;
                        }
                        console.log('24-Hour Sale button clicked');
                        const now = new Date();
                        const end = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
                        setGlobalFlashSale(now.toISOString().slice(0, 16), end.toISOString().slice(0, 16));
                      }}
                      className={`w-full px-3 py-2 text-white rounded text-sm ${
                        globalFlashTimer.isLocked 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-500 hover:bg-blue-600'
                      }`}
                      disabled={globalFlashTimer.isLocked}
                    >
                      Start 24 Hour Sale
                    </button>
                  </div>
                </div>

                {/* Schedule Flash Sale */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium mb-2">📅 Schedule Sale</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
                        const end = new Date(tomorrow.getTime() + 12 * 60 * 60 * 1000); // 12 hours
                        setFlashForm({
                          ...flashForm,
                          startsAt: tomorrow.toISOString().slice(0, 16),
                          endsAt: end.toISOString().slice(0, 16)
                        });
                      }}
                      className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                    >
                      Tomorrow 9 AM
                    </button>
                    <button
                      onClick={() => {
                        const weekend = new Date();
                        weekend.setDate(weekend.getDate() + (6 - weekend.getDay())); // Next Saturday
                        weekend.setHours(10, 0, 0, 0);
                        const end = new Date(weekend.getTime() + 48 * 60 * 60 * 1000); // Weekend sale
                        setFlashForm({
                          ...flashForm,
                          startsAt: weekend.toISOString().slice(0, 16),
                          endsAt: end.toISOString().slice(0, 16)
                        });
                      }}
                      className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
                    >
                      Weekend Sale
                    </button>
                  </div>
                </div>

                {/* Emergency Controls */}
                <div className="bg-white p-3 rounded border">
                  <h4 className="font-medium mb-2">🚨 Emergency Controls</h4>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (window.confirm('Stop all active flash sales immediately?')) {
                          // Set all flash sales to end now
                          const now = new Date().toISOString().slice(0, 16);
                          setFlashForm({
                            ...flashForm,
                            endsAt: now
                          });
                          window.alert('All flash sales will be stopped when you add/update items');
                        }
                      }}
                      className="w-full px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                    >
                      🛑 Stop All Sales
                    </button>
                    <button
                      onClick={() => {
                        setFlashForm({
                          ...flashForm,
                          startsAt: "",
                          endsAt: "",
                          discount: ""
                        });
                      }}
                      className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      Clear Timing
                    </button>
                  </div>
                </div>
              </div>

              {/* Current Flash Sale Status */}
              {(flashForm.startsAt || flashForm.endsAt) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                  <h4 className="font-medium text-blue-800 mb-2">📊 Current Flash Sale Settings</h4>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {flashForm.startsAt && (
                      <div>
                        <span className="font-medium">Start:</span> {new Date(flashForm.startsAt).toLocaleString()}
                      </div>
                    )}
                    {flashForm.endsAt && (
                      <div>
                        <span className="font-medium">End:</span> {new Date(flashForm.endsAt).toLocaleString()}
                      </div>
                    )}
                    {flashForm.discount && (
                      <div>
                        <span className="font-medium">Discount:</span> {flashForm.discount}%
                      </div>
                    )}
                    {flashForm.startsAt && flashForm.endsAt && (
                      <div>
                        <span className="font-medium">Duration:</span> {
                          Math.round((new Date(flashForm.endsAt) - new Date(flashForm.startsAt)) / (1000 * 60 * 60))
                        } hours
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Add flash product */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                console.log('Flash form submitted with data:', flashForm);
                const title = flashForm.title.trim();
                const price = Number(flashForm.price);
                const stock = Number(flashForm.stock);
                const category = flashForm.category.trim() || 'General';
                const discount = flashForm.discount ? Number(flashForm.discount) : null;
                // Use global timer if locked, otherwise use form timer
                const startsAt = globalFlashTimer.isLocked ? globalFlashTimer.startsAt : (flashForm.startsAt || null);
                const endsAt = globalFlashTimer.isLocked ? globalFlashTimer.endsAt : (flashForm.endsAt || null);
                console.log('Processed form data:', { title, price, stock, category, discount, startsAt, endsAt });
                console.log('Using global timer:', globalFlashTimer.isLocked);
                if (!title || isNaN(price) || isNaN(stock)) {
                  console.log('Form validation failed');
                  return;
                }
                setIsFlashSubmitting(true);
                const pid = `${title}-${Date.now()}`;
                try {
                  let imageUrl = null;
                  if (flashImageFile) {
                    const validation = storageService.validateImageFile(flashImageFile);
                    if (!validation.isValid) { alert(validation.error); setIsFlashSubmitting(false); return; }
                    imageUrl = await storageService.uploadFlashImage(flashImageFile, pid);
                  }
                  const payload = { id: pid, title, price, stock, category, image: imageUrl, discount, startsAt, endsAt };
                  const res = await fetch(getApiUrl('/api/flash-products'), {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
                  });
                  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `Failed: ${res.status}`); }
                  const saved = await res.json();
                  setFlashItems((prev) => [...prev, saved]);
                  setFlashForm({ title: "", price: "", stock: "", category: "", discount: "", startsAt: "", endsAt: "" });
                  setFlashImageFile(null);
                  if (flashImagePreview) storageService.revokePreviewUrl(flashImagePreview);
                  setFlashImagePreview("");
                } catch (err) {
                  console.error('Failed to add flash product:', err);
                  alert(`Failed to add flash product: ${err.message}`);
                } finally {
                  setIsFlashSubmitting(false);
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 items-end bg-white p-3 rounded border"
            >
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Title</label>
                <input className="border rounded px-2 py-1" value={flashForm.title} onChange={(e)=>setFlashForm({...flashForm, title:e.target.value})} required disabled={isFlashSubmitting} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Price</label>
                <input type="number" className="border rounded px-2 py-1" value={flashForm.price} onChange={(e)=>setFlashForm({...flashForm, price:e.target.value})} min="0" step="0.01" required disabled={isFlashSubmitting} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Stock</label>
                <input type="number" className="border rounded px-2 py-1" value={flashForm.stock} onChange={(e)=>setFlashForm({...flashForm, stock:e.target.value})} min="0" required disabled={isFlashSubmitting} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">Discount (%)</label>
                <input type="number" className="border rounded px-2 py-1" value={flashForm.discount} onChange={(e)=>setFlashForm({...flashForm, discount:e.target.value})} min="0" max="100" disabled={isFlashSubmitting} />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">
                  Starts At {globalFlashTimer.isLocked && <span className="text-red-500">(🔒 Locked)</span>}
                </label>
                <input 
                  type="datetime-local" 
                  className={`border rounded px-2 py-1 ${globalFlashTimer.isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={globalFlashTimer.isLocked ? globalFlashTimer.startsAt : flashForm.startsAt} 
                  onChange={(e)=>setFlashForm({...flashForm, startsAt:e.target.value})} 
                  disabled={isFlashSubmitting || globalFlashTimer.isLocked} 
                />
              </div>
              <div className="flex flex-col">
                <label className="text-xs text-gray-500">
                  Ends At {globalFlashTimer.isLocked && <span className="text-red-500">(🔒 Locked)</span>}
                </label>
                <input 
                  type="datetime-local" 
                  className={`border rounded px-2 py-1 ${globalFlashTimer.isLocked ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  value={globalFlashTimer.isLocked ? globalFlashTimer.endsAt : flashForm.endsAt} 
                  onChange={(e)=>setFlashForm({...flashForm, endsAt:e.target.value})} 
                  disabled={isFlashSubmitting || globalFlashTimer.isLocked} 
                />
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs text-gray-500">Category</label>
                <input className="border rounded px-2 py-1" value={flashForm.category} onChange={(e)=>setFlashForm({...flashForm, category:e.target.value})} disabled={isFlashSubmitting} />
              </div>
              <div className="flex flex-col md:col-span-2">
                <label className="text-xs text-gray-500">Image</label>
                <input type="file" accept="image/*" className="border rounded px-2 py-1" disabled={isFlashSubmitting}
                  onChange={(e)=>{
                    const file = e.target.files && e.target.files[0];
                    setFlashImageFile(file||null);
                    if (flashImagePreview) storageService.revokePreviewUrl(flashImagePreview);
                    if (file) setFlashImagePreview(storageService.createPreviewUrl(file)); else setFlashImagePreview("");
                  }}
                />
              </div>
              <button type="submit" disabled={isFlashSubmitting} className={`px-3 py-2 rounded text-white ${isFlashSubmitting? 'bg-gray-500 cursor-not-allowed':'bg-black hover:bg-gray-800'}`}>{isFlashSubmitting? 'Adding...':'Add Flash Item'}</button>
            </form>

            {flashImagePreview && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Preview</div>
                <img src={flashImagePreview} alt="preview" className="h-24 w-24 object-cover rounded border" />
              </div>
            )}

            {/* Flash list */}
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2">Title</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Stock</th>
                    <th className="text-left px-3 py-2">Discount</th>
                    <th className="text-left px-3 py-2">Window</th>
                    <th className="text-right px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flashItems.map((p) => (
                    <tr key={p.id} className="border-t">
                      <td className="px-3 py-2">{p.title}</td>
                      <td className="px-3 py-2">{p.category}</td>
                      <td className="px-3 py-2">${p.price}</td>
                      <td className="px-3 py-2">{p.stock}</td>
                      <td className="px-3 py-2">{p.discount ?? '-'}%</td>
                      <td className="px-3 py-2">{p.startsAt || '-'} → {p.endsAt || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <button className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700"
                          onClick={async ()=>{
                            try{
                              const res = await fetch(getApiUrl(`/api/flash-products/${encodeURIComponent(p.id)}`), { method: 'DELETE' });
                              if(!res.ok){ const err = await res.json().catch(()=>({})); throw new Error(err.error||`Failed: ${res.status}`);} 
                              setFlashItems((prev)=> prev.filter(x=>x.id!==p.id));
                            }catch(err){
                              console.error('Failed to delete flash product', err);
                              alert(`Failed to delete: ${err.message}`);
                            }
                          }}
                        >Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No orders found
              </div>
            ) : (
              <div className="overflow-x-auto border rounded">
                <table className="min-w-full text-xs sm:text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-2 sm:px-3 py-2">Order ID</th>
                      <th className="text-left px-2 sm:px-3 py-2">Customer</th>
                      <th className="text-left px-2 sm:px-3 py-2">Items</th>
                      <th className="text-left px-2 sm:px-3 py-2">Total</th>
                      <th className="text-left px-2 sm:px-3 py-2">Status</th>
                      <th className="text-left px-2 sm:px-3 py-2">Date</th>
                      <th className="text-right px-2 sm:px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.orderId} className="border-t hover:bg-gray-50">
                        <td className="px-2 sm:px-3 py-2">
                          <span className="font-mono text-xs">{order.orderId}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <div>
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.customerEmail}</div>
                            {order.userId && (
                              <div className="text-xs text-blue-600 font-mono">
                                ID: {order.userId.slice(0, 8)}...
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <div className="text-xs">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-[120px]">
                            {order.items.slice(0, 2).map(item => item.title).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <span className="font-semibold text-xs sm:text-sm">${order.totalAmount.toFixed(2)}</span>
                        </td>
                        <td className="px-2 sm:px-3 py-2">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.orderId, e.target.value)}
                            className={`px-1 sm:px-2 py-1 rounded text-xs border ${
                              order.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                              order.status === 'processing' ? 'bg-blue-100 text-blue-800 border-blue-300' :
                              order.status === 'shipped' ? 'bg-purple-100 text-purple-800 border-purple-300' :
                              order.status === 'delivered' ? 'bg-green-100 text-green-800 border-green-300' :
                              'bg-red-100 text-red-800 border-red-300'
                            }`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <div className="text-xs">
                            {new Date(order.orderDate).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(order.orderDate).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 py-2 text-right">
                          <div className="flex flex-col sm:flex-row gap-1">
                            <button
                              onClick={() => {
                                const details = `Order: ${order.orderId}\nCustomer: ${order.customerName}\nItems: ${order.items.map(i => `${i.title} x${i.quantity}`).join(', ')}\nTotal: $${order.totalAmount.toFixed(2)}\nStatus: ${order.status}\nShipping: ${order.shippingAddress.street}, ${order.shippingAddress.city}`;
                                window.alert(details);
                              }}
                              className="px-2 py-1 rounded bg-blue-500 text-white hover:bg-blue-600 text-xs whitespace-nowrap"
                            >
                              View
                            </button>
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to cancel order ${order.orderId}?\n\nThis will send a cancellation email to ${order.customerEmail}`)) {
                                    updateOrderStatus(order.orderId, 'cancelled');
                                  }
                                }}
                                className="px-2 py-1 rounded bg-red-500 text-white hover:bg-red-600 text-xs whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            )}
                            {order.status === 'cancelled' && (
                              <button
                                onClick={() => deleteOrder(order.orderId, order.status)}
                                className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs whitespace-nowrap flex items-center gap-1"
                                title="Delete cancelled order"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {tab === "users" && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="overflow-x-auto border rounded">
              <table className="min-w-full text-xs sm:text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-2 sm:px-3 py-2">Username</th>
                    <th className="text-left px-2 sm:px-3 py-2">Email</th>
                    <th className="text-left px-2 sm:px-3 py-2">User ID</th>
                    <th className="text-left px-2 sm:px-3 py-2">Role</th>
                    <th className="text-right px-2 sm:px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.userId || u._id} className="border-t">
                      <td className="px-2 sm:px-3 py-2">{u.username}</td>
                      <td className="px-2 sm:px-3 py-2 truncate max-w-[120px]">{u.email}</td>
                      <td className="px-2 sm:px-3 py-2">
                        <span className="font-mono text-xs text-blue-600">
                          {u.userId || "—"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          u.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-2 sm:px-3 py-2 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            className="px-2 py-1 rounded bg-gray-900 text-white hover:bg-black text-xs sm:text-sm whitespace-nowrap"
                            onClick={() => toggleUserRole(u.userId)}
                          >
                            Toggle
                          </button>
                          <button
                            onClick={() => deleteUser(u.userId, u.username)}
                            className="px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 text-xs whitespace-nowrap flex items-center gap-1"
                            title="Delete user"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {tab === "chat" && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-96">
              {/* Chat Sessions List */}
              <div className="border rounded-lg overflow-hidden h-64 md:h-auto">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <h3 className="font-semibold text-sm">Active Chats ({chatSessions.length})</h3>
                </div>
                <div className="overflow-y-auto h-52 md:h-80">
                  {chatSessions.length === 0 ? (
                    <div className="p-4 text-center text-gray-500 text-sm">
                      No active chats
                    </div>
                  ) : (
                    chatSessions.map((session) => (
                      <div
                        key={session._id}
                        className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                          selectedSession?._id === session._id ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1" onClick={() => setSelectedSession(session)}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="font-medium text-sm">
                                {session.senderName || 'Anonymous'}
                              </div>
                              {session.userId && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                                  Registered
                                </span>
                              )}
                            </div>
                            {session.userId && (
                              <div className="text-xs text-blue-600 font-mono mb-1">
                                ID: {session.userId.slice(0, 8)}...
                              </div>
                            )}
                            <div className="text-xs text-gray-600 truncate">
                              {session.lastMessage || 'No messages yet'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(session.updatedAt).toLocaleString()}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {session.unreadCount > 0 && (
                              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                {session.unreadCount}
                              </span>
                            )}
                            <div className="text-xs text-gray-400 mb-1">
                              {session.messageCount || 0} msgs
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteChatSession(session._id, session.senderName || 'Anonymous');
                              }}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                              title="Delete chat session"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div className="md:col-span-2 border rounded-lg overflow-hidden h-64 md:h-auto">
                {selectedSession ? (
                  <>
                    <div className="bg-gray-50 px-4 py-2 border-b">
                      <h3 className="font-semibold text-sm">Chat Session: {selectedSession.senderName || 'Anonymous'}</h3>
                    </div>
                    <div className="h-40 md:h-64 overflow-y-auto p-3 space-y-2">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-gray-500 text-sm">
                          No messages yet
                        </div>
                      ) : (
                        chatMessages.map((msg, i) => (
                          <div key={i} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                              msg.sender === 'admin' 
                                ? 'bg-blue-500 text-white rounded-br-none' 
                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                            }`}>
                              <div className="text-xs opacity-70 mb-1">{msg.senderName}</div>
                              {msg.message}
                              <div className="text-xs opacity-50 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t p-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Type your response..."
                          value={adminMessage}
                          onChange={(e) => setAdminMessage(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") sendAdminMessage();
                          }}
                          className="flex-1 border rounded-lg px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <button
                          onClick={sendAdminMessage}
                          disabled={!adminMessage.trim()}
                          className="px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 text-xs sm:text-sm whitespace-nowrap"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    Select a chat session to view messages
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {tab === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <EmailTest onBack={() => setTab("products")} />
          </motion.div>
        )}

        {tab === "payhere" && (
          <motion.div
            key="payhere"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <PayHereConfig onBack={() => setTab("products")} />
          </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  );
}
