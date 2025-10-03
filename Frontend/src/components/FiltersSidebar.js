import React from "react";
import { motion } from "framer-motion";

function Checkbox({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" className="h-4 w-4" checked={checked} onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}

export default function FiltersSidebar({
  categories = [],
  selectedCategories = [],
  onToggleCategory,
  priceRange = [0, 1000],
  onPriceChange,
  onClear,
}) {
  const [min, max] = priceRange;

  return (
    <motion.aside
      className="w-64 shrink-0 bg-[#DFE2DE] rounded-xl shadow p-4 h-fit sticky top-20"
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-lg">Filters</h2>
        <button
          onClick={onClear}
          className="text-sm text-blue-600 hover:underline"
          aria-label="Clear filters"
        >
          Clear
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Categories</h3>
        <div className="flex flex-col gap-2">
          {categories.map((c) => (
            <Checkbox
              key={c}
              label={c}
              checked={selectedCategories.includes(c)}
              onChange={() => onToggleCategory && onToggleCategory(c)}
            />
          ))}
        </div>
      </div>

      <div className="mb-2">
        <h3 className="font-medium mb-2">Price</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            className="w-20 border rounded px-2 py-1"
            value={min}
            onChange={(e) => onPriceChange && onPriceChange([Number(e.target.value) || 0, max])}
          />
          <span>—</span>
          <input
            type="number"
            min={0}
            className="w-20 border rounded px-2 py-1"
            value={max}
            onChange={(e) => onPriceChange && onPriceChange([min, Number(e.target.value) || 0])}
          />
        </div>
      </div>
    </motion.aside>
  );
}
