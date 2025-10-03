import React, { useState } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import PayHereCheckout from "./PayHereCheckout";

export default function CartPage({ onBack }) {
  const { items, setQuantity, removeItem, clearCart, total } = useCart();
  const [showCheckout, setShowCheckout] = useState(false);

  const hasItems = items && items.length > 0;

  const handleCheckoutSuccess = (order) => {
    alert(`Order placed successfully! Order ID: ${order.orderId}`);
    clearCart();
    setShowCheckout(false);
    onBack();
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
  };

  if (showCheckout) {
    return (
      <PayHereCheckout
        cartItems={items}
        totalAmount={total}
        onSuccess={handleCheckoutSuccess}
        onCancel={handleCheckoutCancel}
      />
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Your Cart</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.button
            className="px-3 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onBack}
          >
            Continue Shopping
          </motion.button>
          {hasItems && (
            <motion.button
              className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearCart}
            >
              Clear Cart
            </motion.button>
          )}
        </div>
      </div>

      {!hasItems ? (
        <div className="text-center text-gray-600 py-16 bg-[#F3F4F6] rounded-xl">
          Your cart is empty.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 flex flex-col gap-3 sm:gap-4">
            {items.map((it) => (
              <div key={it.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 bg-white rounded-xl shadow p-3 sm:p-4">
                {it.image ? (
                  <img src={it.image} alt={it.title} className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded mx-auto sm:mx-0" />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded mx-auto sm:mx-0" />
                )}
                <div className="flex-1 text-center sm:text-left">
                  <div className="font-semibold text-sm sm:text-base">{it.title}</div>
                  <div className="text-gray-600 text-xs sm:text-sm">${it.price.toFixed(2)}</div>
                  <div className="mt-2 flex items-center justify-center sm:justify-start gap-2">
                    <label className="text-xs sm:text-sm text-gray-600">Qty</label>
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => setQuantity(it.id, Number(e.target.value) || 1)}
                      className="w-16 sm:w-20 border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div className="text-center sm:text-right w-full sm:w-auto">
                  <div className="font-semibold mb-2 text-sm sm:text-base">${(it.price * it.quantity).toFixed(2)}</div>
                  <motion.button
                    className="px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600 text-xs sm:text-sm w-full sm:w-auto"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => removeItem(it.id)}
                  >
                    Remove
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl shadow p-3 sm:p-4 h-fit sticky top-4">
            <h2 className="text-base sm:text-lg font-semibold mb-3">Order Summary</h2>
            <div className="flex items-center justify-between mb-1 text-sm sm:text-base">
              <span>Subtotal</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between mb-3 text-xs sm:text-sm text-gray-600">
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex items-center justify-between font-bold text-base sm:text-lg">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <motion.button
              className="w-full mt-4 px-3 sm:px-4 py-2 sm:py-3 rounded bg-blue-600 text-white hover:bg-blue-700 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowCheckout(true)}
            >
              Proceed to Checkout
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
}
