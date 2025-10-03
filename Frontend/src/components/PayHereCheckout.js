import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { initiatePayHerePayment, getExchangeInfo } from '../services/payhere';
import { getCurrentUser } from '../services/auth';
import axios from 'axios';

export default function PayHereCheckout({ cartItems, totalAmount, onSuccess, onCancel }) {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [shippingInfo, setShippingInfo] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('payhere');

  useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const exchangeInfo = getExchangeInfo(totalAmount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!user) {
      alert('Please login to place an order');
      return false;
    }
    
    if (!shippingInfo.street || !shippingInfo.city || !shippingInfo.state || !shippingInfo.zipCode) {
      alert('Please fill in all shipping information');
      return false;
    }
    
    if (!shippingInfo.phone) {
      alert('Please provide a phone number');
      return false;
    }
    
    return true;
  };

  const handlePayHerePayment = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Create order first
      const orderData = {
        userId: user.userId,
        customerName: user.username,
        customerEmail: user.email,
        items: cartItems.map(item => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: totalAmount,
        shippingAddress: {
          street: shippingInfo.street,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: 'Sri Lanka'
        },
        paymentMethod: 'PayHere Online Payment',
        phone: shippingInfo.phone
      };

      const orderResponse = await axios.post('/api/orders', orderData);
      const order = orderResponse.data;

      // Initiate PayHere payment
      const paymentResult = await initiatePayHerePayment(
        {
          ...order,
          phone: shippingInfo.phone
        },
        (orderId) => {
          console.log('Payment successful:', orderId);
          onSuccess && onSuccess(order);
        },
        (error) => {
          console.error('Payment error:', error);
          alert('Payment failed: ' + error);
        },
        () => {
          console.log('Payment dismissed');
        }
      );

    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCashOnDelivery = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const orderData = {
        userId: user.userId,
        customerName: user.username,
        customerEmail: user.email,
        items: cartItems.map(item => ({
          productId: item.id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image
        })),
        totalAmount: totalAmount,
        shippingAddress: {
          street: shippingInfo.street,
          city: shippingInfo.city,
          state: shippingInfo.state,
          zipCode: shippingInfo.zipCode,
          country: 'Sri Lanka'
        },
        paymentMethod: 'Cash on Delivery'
      };

      const orderResponse = await axios.post('/api/orders', orderData);
      const order = orderResponse.data;
      
      onSuccess && onSuccess(order);
    } catch (error) {
      console.error('Order creation error:', error);
      alert('Failed to create order: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Please Login</h2>
        <p className="text-gray-600 mb-4">You need to be logged in to place an order.</p>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-3 sm:p-4 lg:p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Checkout</h2>
      
      {/* Order Summary */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Order Summary</h3>
        <div className="space-y-2">
          {cartItems.map((item, index) => (
            <div key={index} className="flex justify-between text-xs sm:text-sm">
              <span className="truncate pr-2">{item.title} x{item.quantity}</span>
              <span className="flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t pt-2 font-semibold flex justify-between text-sm sm:text-base">
            <span>Total (USD):</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-xs sm:text-sm text-blue-600 flex justify-between">
            <span>Total (LKR):</span>
            <span>{exchangeInfo.formatted}</span>
          </div>
          <div className="text-xs text-gray-500">
            Exchange rate: 1 USD = {exchangeInfo.rate} LKR
          </div>
        </div>
      </div>

      {/* Shipping Information */}
      <div className="mb-4 sm:mb-6">
        <h3 className="font-semibold mb-3 text-sm sm:text-base">Shipping Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1">Street Address</label>
            <input
              type="text"
              name="street"
              value={shippingInfo.street}
              onChange={handleInputChange}
              className="w-full border rounded px-2 sm:px-3 py-2 text-sm"
              placeholder="Enter street address"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">City</label>
            <input
              type="text"
              name="city"
              value={shippingInfo.city}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter city"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">State/Province</label>
            <input
              type="text"
              name="state"
              value={shippingInfo.state}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter state/province"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ZIP Code</label>
            <input
              type="text"
              name="zipCode"
              value={shippingInfo.zipCode}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter ZIP code"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={shippingInfo.phone}
              onChange={handleInputChange}
              className="w-full border rounded px-3 py-2"
              placeholder="Enter phone number"
              required
            />
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3">Payment Method</h3>
        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="payhere"
              checked={paymentMethod === 'payhere'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span className="flex items-center">
              <img 
                src="https://www.payhere.lk/downloads/images/payhere_logo_dark.png" 
                alt="PayHere" 
                className="h-6 mr-2"
              />
              PayHere Online Payment (Cards, Mobile Banking)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === 'cod'}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="mr-2"
            />
            <span>Cash on Delivery</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 border border-gray-300 rounded hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        
        {paymentMethod === 'payhere' ? (
          <motion.button
            onClick={handlePayHerePayment}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? 'Processing...' : `Pay ${exchangeInfo.formatted} with PayHere`}
          </motion.button>
        ) : (
          <motion.button
            onClick={handleCashOnDelivery}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? 'Processing...' : 'Place Order (Cash on Delivery)'}
          </motion.button>
        )}
      </div>
    </div>
  );
}
