import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";

// ⏳ Countdown Timer Component
function CountdownTimer({ endTime, size = "normal" }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft("Sale Ended");
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        } else {
          setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const sizeClasses = size === "large" 
    ? "text-xl font-bold text-white bg-red-600 px-4 py-2 rounded-lg shadow-lg"
    : "text-sm font-bold text-red-600 bg-red-100 px-2 py-1 rounded";

  return (
    <span className={sizeClasses}>
      ⏰ {timeLeft}
    </span>
  );
}

// 🛒 Product Card
function SaleProduct({ image, title, price, stock, variants, onGrabDeal, discount }) {
  const originalPrice = discount ? Math.round(price / (1 - discount / 100)) : price;
  
  return (
    <motion.div
      variants={variants}
      className="bg-white rounded-xl shadow-md p-3 cursor-pointer flex flex-col w-full border hover:border-red-300 transition-colors"
      whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(0,0,0,0.12)" }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      {/* Discount Badge */}
      {discount && (
        <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          -{discount}%
        </div>
      )}

      {/* Image */}
      <motion.img
        src={image || "https://via.placeholder.com/150"}
        alt={title}
        className="w-full h-32 object-cover rounded-lg mb-3"
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.3 }}
      />

      {/* Title */}
      <h3 className="text-sm font-semibold text-gray-800 mb-2 line-clamp-2">{title}</h3>

      {/* Price */}
      <div className="mb-2">
        <span className="text-red-600 font-bold text-lg">${price}</span>
        {discount && (
          <span className="text-gray-400 line-through text-sm ml-2">${originalPrice}</span>
        )}
      </div>

      {/* Stock Progress */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
        <div
          className="bg-red-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.max(0, Math.min(100, stock))}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mb-3">{stock}% Stock Left</p>

      {/* Button */}
      <motion.button
        className="mt-auto bg-red-600 text-white py-2 text-sm rounded-lg shadow-md hover:bg-red-700 transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGrabDeal}
      >
        Grab Deal 🔥
      </motion.button>
    </motion.div>
  );
}

// Sale Section Component
function SaleSection({ title, icon, items, bgColor, textColor, onGrabDeal }) {
  const { addItem } = useCart();

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  if (items.length === 0) return null;

  // Get the earliest end time for countdown
  const earliestEndTime = items.reduce((earliest, item) => {
    if (!item.endsAt) return earliest;
    const itemEnd = new Date(item.endsAt);
    return !earliest || itemEnd < earliest ? itemEnd : earliest;
  }, null);

  return (
    <motion.section
      className={`${bgColor} rounded-2xl p-6 mb-8 shadow-lg`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      {/* Section Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{icon}</span>
          <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
        </div>
        {earliestEndTime && (
          <CountdownTimer endTime={earliestEndTime} size="large" />
        )}
      </div>

      {/* Products Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ amount: 0.2 }}
      >
        {items.map((product) => (
          <SaleProduct
            key={product.id || `${product.title}-${product.price}`}
            variants={item}
            image={product.image}
            title={product.title}
            price={product.price}
            stock={product.stock}
            discount={product.discount}
            onGrabDeal={() => {
              const id = product.id || product.title;
              addItem({ 
                id, 
                title: product.title, 
                price: product.price, 
                image: product.image 
              }, 1);
              onGrabDeal();
            }}
          />
        ))}
      </motion.div>
    </motion.section>
  );
}

// Main Timed Sales Page
export default function TimedSalesPage({ searchQuery = "", selectedCategories = [], priceRange = [0, 1000], onGrabDeal = () => {} }) {
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

  // Filter products based on search and categories
  const q = searchQuery ? String(searchQuery).trim().toLowerCase() : "";
  const selCats = Array.isArray(selectedCategories) ? selectedCategories : [];
  let [minPrice, maxPrice] = priceRange;
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

  // Categorize sales by duration
  const now = new Date();
  const categorizedSales = {
    flash: [], // 1-6 hours
    daily: [], // 6-24 hours  
    weekend: [], // 24-72 hours
    weekly: [], // 3-7 days
    extended: [] // 7+ days
  };

  filtered.forEach(item => {
    if (!item.startsAt || !item.endsAt) {
      categorizedSales.flash.push(item); // Default to flash if no timing
      return;
    }

    const startTime = new Date(item.startsAt);
    const endTime = new Date(item.endsAt);
    const duration = endTime - startTime;
    const hoursLeft = (endTime - now) / (1000 * 60 * 60);

    // Only show active or upcoming sales
    if (hoursLeft > 0) {
      const durationHours = duration / (1000 * 60 * 60);
      
      if (durationHours <= 6) {
        categorizedSales.flash.push(item);
      } else if (durationHours <= 24) {
        categorizedSales.daily.push(item);
      } else if (durationHours <= 72) {
        categorizedSales.weekend.push(item);
      } else if (durationHours <= 168) { // 7 days
        categorizedSales.weekly.push(item);
      } else {
        categorizedSales.extended.push(item);
      }
    }
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center text-gray-500 py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          Loading amazing sales...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="text-center text-red-600 py-20 bg-red-50 rounded-lg">
          <span className="text-4xl mb-4 block">⚠️</span>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Page Header */}
      <motion.div 
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <h1 className="text-4xl font-bold text-gray-800 mb-4">🎯 Timed Sales</h1>
        <p className="text-gray-600 text-lg">Don't miss out on these limited-time offers!</p>
      </motion.div>

      {/* Sale Sections */}
      <SaleSection
        title="Flash Sale"
        icon="⚡"
        items={categorizedSales.flash}
        bgColor="bg-gradient-to-r from-red-50 to-orange-50"
        textColor="text-red-700"
        onGrabDeal={onGrabDeal}
      />

      <SaleSection
        title="Daily Deals"
        icon="🌅"
        items={categorizedSales.daily}
        bgColor="bg-gradient-to-r from-blue-50 to-cyan-50"
        textColor="text-blue-700"
        onGrabDeal={onGrabDeal}
      />

      <SaleSection
        title="Weekend Sale"
        icon="🎉"
        items={categorizedSales.weekend}
        bgColor="bg-gradient-to-r from-purple-50 to-pink-50"
        textColor="text-purple-700"
        onGrabDeal={onGrabDeal}
      />

      <SaleSection
        title="Weekly Specials"
        icon="📅"
        items={categorizedSales.weekly}
        bgColor="bg-gradient-to-r from-green-50 to-emerald-50"
        textColor="text-green-700"
        onGrabDeal={onGrabDeal}
      />

      <SaleSection
        title="Extended Offers"
        icon="🎁"
        items={categorizedSales.extended}
        bgColor="bg-gradient-to-r from-yellow-50 to-amber-50"
        textColor="text-yellow-700"
        onGrabDeal={onGrabDeal}
      />

      {/* No Sales Message */}
      {Object.values(categorizedSales).every(arr => arr.length === 0) && (
        <motion.div 
          className="text-center py-20 bg-gray-50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-6xl mb-4 block">🛍️</span>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Active Sales</h3>
          <p className="text-gray-500">
            {q ? `No sales found for "${searchQuery}"` : "Check back soon for amazing deals!"}
          </p>
        </motion.div>
      )}
    </div>
  );
}
