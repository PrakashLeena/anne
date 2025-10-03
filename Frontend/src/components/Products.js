import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react"; // for ratings
import { useCart } from "../context/CartContext";
import ProductModal from "./ProductModal";
import { useProducts } from "../context/ProductsContext";

// Local product assets are not available; use images provided by context or external URLs

// Product Card Component
function ProductCard({ image, title, price, rating, discount, variants, onAdd, onView, onBuyNow }) {
  return (
    <div className="bg-[white] w-full">
    <motion.div
      variants={variants}
      className="bg-white/5 rounded-xl shadow-md p-2 sm:p-3 cursor-pointer flex flex-col w-full"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 200 }}
      onClick={onView}
    >
      {/* Image with Discount Badge */}
      <div className="relative">
        <motion.img
          src={image}
          alt={title}
          className="w-full h-24 sm:h-32 object-cover rounded-lg mb-2"
          whileHover={{ rotate: 1 }}
          transition={{ duration: 0.3 }}
        />
        {discount && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs px-2 py-0.5 rounded-lg shadow">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Title */}
      <h2 className="text-xs sm:text-sm font-semibold text-gray-800 truncate">{title}</h2>

      {/* Price */}
      <p className="text-red-600 font-bold text-sm sm:text-base mb-1">${price}</p>

      {/* Rating */}
      <div className="flex items-center text-yellow-500 text-xs mb-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={12}
            className={i < rating ? "fill-yellow-400" : "text-gray-300"}
          />
        ))}
        <span className="ml-1 text-gray-500 text-xs">({rating}.0)</span>
      </div>

      {/* Buttons */}
      <motion.button
        className="mt-auto bg-blue-600 text-white py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg shadow hover:bg-blue-700"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => { e.stopPropagation(); onAdd && onAdd(); }}
      >
        Add to Cart
      </motion.button>
      <motion.button
        className="mt-2 bg-emerald-600 text-white py-1.5 text-sm rounded-lg shadow hover:bg-emerald-700"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onAdd && onAdd(); onBuyNow && onBuyNow(); }}
      >
        Buy Now
      </motion.button>
    </motion.div>
    </div>
  );
}

// Main Products Section
export default function ProductsSection({ searchQuery = "", selectedCategories = [], priceRange = [0, 1000], onBuyNow = () => {} }) {
  const [remoteProducts, setRemoteProducts] = useState(null);
  const { addItem } = useCart();
  const [selected, setSelected] = useState(null);
  const { products } = useProducts();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.07, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setRemoteProducts(Array.isArray(data) ? data : null);
      } catch (_) {
        // ignore and use local fallback
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Section Title */}
      <h1 className="text-2xl font-bold text-center mb-8">
        🌟 Featured Products
      </h1>

      {/* Grid */}
      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
        whileInView="show"
        viewport={{ amount: 0.2 }}
        key={`pd-${(Array.isArray(selectedCategories)?selectedCategories:[]).slice().sort().join(',')}-${searchQuery?String(searchQuery).trim().toLowerCase():''}-${(priceRange||[])[0]}-${(priceRange||[])[1]}`}
      >
        {(() => {
          const q = searchQuery ? String(searchQuery).trim().toLowerCase() : "";
          const selCats = Array.isArray(selectedCategories) ? selectedCategories : [];
          let [minPrice, maxPrice] = priceRange;
          // Normalize price bounds: treat non-positive max as infinity; swap if min>max
          const effectiveMin = Number.isFinite(minPrice) ? Math.max(0, minPrice) : 0;
          let effectiveMax = Number.isFinite(maxPrice) ? maxPrice : Infinity;
          if (!effectiveMax || effectiveMax <= 0) effectiveMax = Infinity;
          let minB = effectiveMin, maxB = effectiveMax;
          if (minB > maxB) {
            const t = minB; minB = maxB; maxB = t;
          }
          const hasCategoryFilter = selCats.length > 0;

          const useRemote = remoteProducts && remoteProducts.length > 0;

          const normalizedRemote = useRemote
            ? remoteProducts.map((p) => ({
                key: p.id || p.name,
                id: String(p.id || p.name),
                title: p.name,
                category: (p.name || "").split(" ")[0],
                price: Number(p.price) || 0,
                image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&q=80&auto=format&fit=crop", // placeholder image for remote items
              }))
            : [];

          const normalizedLocal = (products || []).map((p) => ({
            key: p.id || p.title,
            id: String(p.id || p.title),
            title: p.title,
            category: p.category || p.title,
            price: Number(p.price) || 0,
            image: p.image,
            meta: p,
          }));

          // Merge local (context) and remote lists so locally added items always appear
          // De-duplicate by id/key, preferring local definitions over remote placeholders
          const merged = [...normalizedLocal, ...normalizedRemote];
          const seen = new Set();
          const list = merged.filter((item) => {
            const k = item.id || item.key;
            if (seen.has(k)) return false;
            seen.add(k);
            return true;
          });
          const activeFilters = !!q || hasCategoryFilter || minB > 0 || maxB !== Infinity;
          const filtered = list.filter((item) => {
            const matchesQuery = q ? (item.title || "").toLowerCase().includes(q) : true;
            const matchesCategory = hasCategoryFilter ? selCats.includes(item.category) : true;
            const matchesPrice = item.price >= minB && item.price <= maxB;
            return matchesQuery && matchesCategory && matchesPrice;
          });

          const hasResults = filtered.length > 0;
          if (!hasResults) {
            // If there are no active filters, show the full list as a safety net
            if (!activeFilters) {
              return list.map((item) => (
                <ProductCard
                  key={item.key}
                  variants={itemVariants}
                  image={item.image}
                  title={item.title}
                  price={item.price}
                  rating={4}
                  discount={null}
                  onAdd={() =>
                    addItem({ id: item.id || item.key, title: item.title, price: item.price, image: item.image }, 1)
                  }
                  onView={() => setSelected(item)}
                  onBuyNow={() => onBuyNow()}
                />
              ));
            }
            return (
              <div className="col-span-full text-center text-gray-500 py-10">
                No products found{q ? ` for "${searchQuery}"` : ""}.
              </div>
            );
          }
          return filtered.map((item) => (
            <ProductCard
              key={item.key}
              variants={itemVariants}
              image={item.image}
              title={item.title}
              price={item.price}
              rating={4}
              discount={null}
              onAdd={() =>
                addItem({ id: item.id || item.key, title: item.title, price: item.price, image: item.image }, 1)
              }
              onView={() => setSelected(item)}
              onBuyNow={() => onBuyNow()}
            />
          ));
        })()}
      </motion.div>
      <ProductModal
        open={!!selected}
        product={selected ? { id: selected.id || selected.key, title: selected.title, price: selected.price, image: selected.image, category: selected.category } : null}
        onClose={() => setSelected(null)}
        onBuyNow={() => onBuyNow()}
      />
    </div>
  );
}
