import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

// Use stable external image URLs instead of missing local assets

// ⏳ Countdown Timer Component
function CountdownTimer({ endTime }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Sale Ended");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className="text-lg font-bold text-red-600 bg-red-100 px-3 py-1 rounded-lg">
      ⏰ {timeLeft}
    </span>
  );
}

// 🛒 Product Card
function FlashSaleProduct({ image, title, price, stock, variants, onGrabDeal }) {
  return (
    <motion.div
      variants={variants}
      className="bg-white/5 rounded-xl shadow-md p-2 sm:p-3 cursor-pointer flex flex-col w-full"
      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {/* Image */}
      <motion.img
        src={image}
        alt={title}
        className="w-full h-20 sm:h-24 lg:h-28 object-cover rounded-lg mb-2"
        whileHover={{ rotate: 1, scale: 1.02 }}
        transition={{ duration: 0.3 }}
      />

      {/* Title */}
      <h2 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{title}</h2>

      {/* Price */}
      <p className="text-red-600 font-bold text-sm sm:text-base mb-1">${price}</p>

      {/* Stock Progress */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div
          className="bg-red-500 h-1.5 rounded-full"
          style={{ width: `${stock}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mb-2">{stock}% Stock Left</p>

      {/* Button */}
      <motion.button
        className="mt-auto bg-red-600 text-white py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg shadow-md hover:bg-red-700"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGrabDeal}
      >
        Grab Deal
      </motion.button>
    </motion.div>
  );
}

// ⚡ Flash Sale Page
export default function FlashSalePage({ searchQuery = "", selectedCategories = [], priceRange = [0, 1000], onGrabDeal = () => {} }) {
  const { addItem } = useCart();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/flash-products');
        if (!res.ok) throw new Error(`Failed to load flash products: ${res.status}`);
        const data = await res.json();
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setError(e.message || 'Failed to load flash products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Sale ending 2 hours from now
  const saleEnd = new Date();
  saleEnd.setHours(saleEnd.getHours() + 2);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  // Filter by search query
  const q = searchQuery ? String(searchQuery).trim().toLowerCase() : "";
  const selCats = Array.isArray(selectedCategories) ? selectedCategories : [];
  let [minPrice, maxPrice] = priceRange;
  // Normalize price bounds similar to Products: non-positive max => Infinity; swap if min>max
  const effectiveMin = Number.isFinite(minPrice) ? Math.max(0, minPrice) : 0;
  let effectiveMax = Number.isFinite(maxPrice) ? maxPrice : Infinity;
  if (!effectiveMax || effectiveMax <= 0) effectiveMax = Infinity;
  let minB = effectiveMin, maxB = effectiveMax;
  if (minB > maxB) {
    const t = minB; minB = maxB; maxB = t;
  }
  const hasCategoryFilter = selCats.length > 0;
  const filtered = items.filter((p) => {
    const title = (p.title || "");
    const category = p.category || title;
    const price = Number(p.price) || 0;
    const matchesQuery = q ? title.toLowerCase().includes(q) : true;
    const matchesCategory = hasCategoryFilter ? selCats.includes(category) : true;
    const matchesPrice = price >= minB && price <= maxB;
    return matchesQuery && matchesCategory && matchesPrice;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Header */}
      <motion.div className="flex justify-between items-center mb-6"
        initial={{ opacity: 0, y: -10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <h1 className="text-2xl font-bold text-red-600">🔥 Flash Sale</h1>
        <CountdownTimer endTime={saleEnd} />
      </motion.div>

      {/* Products Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4"
        variants={container}
        initial="hidden"
        animate="show"
        whileInView="show"
        viewport={{ amount: 0.2 }}
        key={`fs-${selCats.sort().join(',')}-${q}-${minB}-${maxB}`}
      >
        {loading ? (
          <div className="col-span-full text-center text-gray-500 py-8">Loading flash sale items...</div>
        ) : error ? (
          <div className="col-span-full text-center text-red-600 py-8">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-8">
            No flash sale items found{q ? ` for "${searchQuery}"` : ""}.
          </div>
        ) : (
          filtered.map((p) => (
            <FlashSaleProduct
              key={p.id || `${p.title}-${p.price}`}
              variants={item}
              image={p.image}
              title={p.title}
              price={p.price}
              stock={p.stock}
              onGrabDeal={() => {
                const id = p.id || p.title;
                addItem({ id, title: p.title, price: p.price, image: p.image }, 1);
                onGrabDeal();
              }}
            />
          ))
        )}
      </motion.div>
    </div>
  );
}
