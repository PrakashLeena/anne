import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { getCurrentUser } from "../services/auth";

export default function Orders({ onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    
    if (currentUser?.userId) {
      loadUserOrders(currentUser.userId);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUserOrders(userId) {
    try {
      setLoading(true);
      const response = await axios.get(`/api/orders/user/${userId}`);
      setOrders(response.data);
    } catch (error) {
      console.error('Failed to load orders:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusColor(status) {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusIcon(status) {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '⚙️';
      case 'shipped': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Please Login</h2>
          <p className="text-gray-600 mb-4">You need to be logged in to view your orders.</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <motion.button
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
        >
          Back
        </motion.button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading orders...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold mb-2">No Orders Yet</h2>
          <p className="text-gray-600 mb-4">You haven't placed any orders yet. Start shopping to see your orders here!</p>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              key={order.orderId}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              whileHover={{ scale: 1.01 }}
              onClick={() => setSelectedOrder(order)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">Order #{order.orderId}</h3>
                    <p className="text-gray-600 text-sm">
                      Placed on {new Date(order.orderDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                      <span>{getStatusIcon(order.status)}</span>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </div>
                    <p className="text-lg font-bold mt-1">${order.totalAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>📦 {order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                  {order.trackingNumber && (
                    <span>🚚 Tracking: {order.trackingNumber}</span>
                  )}
                  {order.estimatedDelivery && (
                    <span>📅 Est. Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {order.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="flex items-center gap-2 bg-gray-50 rounded px-3 py-1 text-sm">
                      {item.image && (
                        <img src={item.image} alt={item.title} className="w-6 h-6 rounded object-cover" />
                      )}
                      <span>{item.title} x{item.quantity}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <div className="bg-gray-100 rounded px-3 py-1 text-sm text-gray-600">
                      +{order.items.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Order Info */}
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-2">Order Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><strong>Order ID:</strong> {selectedOrder.orderId}</p>
                      <p><strong>Date:</strong> {new Date(selectedOrder.orderDate).toLocaleString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`ml-2 inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(selectedOrder.status)}`}>
                          {getStatusIcon(selectedOrder.status)} {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </span>
                      </p>
                      <p><strong>Payment:</strong> {selectedOrder.paymentMethod}</p>
                      {selectedOrder.trackingNumber && (
                        <p><strong>Tracking:</strong> {selectedOrder.trackingNumber}</p>
                      )}
                      {selectedOrder.estimatedDelivery && (
                        <p><strong>Est. Delivery:</strong> {new Date(selectedOrder.estimatedDelivery).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.shippingAddress.street}</p>
                      <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state}</p>
                      <p>{selectedOrder.shippingAddress.zipCode}</p>
                      <p>{selectedOrder.shippingAddress.country}</p>
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                        {item.image && (
                          <img src={item.image} alt={item.title} className="w-12 h-12 rounded object-cover" />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.title}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Amount:</span>
                    <span className="text-xl font-bold text-green-600">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
