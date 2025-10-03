import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../context/CartContext";

export default function ProductModal({ open, product, onClose, onBuyNow }) {
  const { addItem } = useCart();
  if (!open || !product) return null;

  const { id, title, price, image, category } = product;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 z-[70]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            className="fixed inset-0 z-[71] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="flex">
                {image ? (
                  <img src={image} alt={title} className="w-40 h-40 object-cover" />
                ) : (
                  <div className="w-40 h-40 bg-gray-200" />
                )}
                <div className="p-4 flex-1">
                  <h2 className="font-semibold text-lg mb-1">{title}</h2>
                  {category && (
                    <div className="text-xs text-gray-500 mb-2">{category}</div>
                  )}
                  <div className="text-red-600 font-bold text-xl mb-3">${Number(price).toFixed(2)}</div>
                  <div className="text-sm text-gray-600 mb-4">
                    High-quality product selected from the catalog.
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        addItem({ id, title, price, image }, 1);
                        onClose && onClose();
                      }}
                    >
                      Add to Cart
                    </motion.button>
                    <motion.button
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        addItem({ id, title, price, image }, 1);
                        onClose && onClose();
                        onBuyNow && onBuyNow();
                      }}
                    >
                      Buy Now
                    </motion.button>
                    <motion.button
                      className="px-3 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={onClose}
                    >
                      Close
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
