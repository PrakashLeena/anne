import React from "react";
import { motion } from "framer-motion";
import img from "../assets/kiyu.png";
import { useCart } from "../context/CartContext";

function Navbar({ user, onLoginClick, onSignupClick, onLogoutClick, searchValue, onSearchChange, onCartClick }) {
  const { count } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <>
      {/* Top section - NOT sticky */}
      <motion.div
        className="w-full bg-[#1A1E21]"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <div className="flex flex-wrap px-2 sm:px-4 py-2 gap-2 sm:gap-4 items-center justify-center text-[#EBEBEB] text-xs sm:text-sm">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="font-semibold">Hi, {user.username || user.email}</span>
              <motion.button
                onClick={onLogoutClick}
                className="px-3 py-1 rounded-lg hover:bg-white/10 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          ) : (
            <>
              <motion.button
                onClick={onLoginClick}
                className="px-3 py-1 rounded-lg hover:bg-white/10 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
              <motion.button
                onClick={onSignupClick}
                className="px-3 py-1 rounded-lg hover:bg-white/10 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Sign up
              </motion.button>
            </>
          )}
          <motion.button className="px-3 py-1 rounded-lg hover:bg-white/10 transition" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Help & Support
          </motion.button>
          <motion.button className="px-3 py-1 rounded-lg hover:bg-white/10 transition" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            Contact Us 
          </motion.button>
        </div>
      </motion.div>

      {/* Main navbar - STICKY */}
      <div className="sticky top-0 z-40 w-full bg-[#1A1E21] border-b border-white/20 shadow-lg">
        <div className="flex flex-wrap items-center justify-center gap-3 px-3 sm:px-4 lg:px-6 py-3">
          {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="hidden"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo and Search bar grouped together */}
        <div className="flex items-center gap-3 order-1">
          {/* Logo */}
          <div className="flex items-center">
            <img src={img} alt="Logo" className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>

          {/* Search bar with cart */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[300px] sm:min-w-[500px] md:min-w-[600px] lg:min-w-[700px]">
              <motion.input
                placeholder="Search products..."
                className="w-full h-10 pl-10 pr-4 rounded-lg bg-white text-black border-none outline-none"
                whileFocus={{ scale: 1.01 }}
                transition={{ type: "spring", stiffness: 300, damping: 22 }}
                value={searchValue}
                onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1110.5 3a7.5 7.5 0 016.15 13.65z"
                />
              </svg>
            </div>

            {/* Cart button */}
            <motion.div
              className="relative cursor-pointer select-none text-white"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartClick}
              role="button"
              aria-label="Open cart"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="sm:w-10 sm:h-10"
              >
                <circle cx="9" cy="20" r="1.5" />
                <circle cx="18" cy="20" r="1.5" />
                <path d="M3 3h2l1.6 9.6a2 2 0 0 0 2 1.6h7.8a1 1 0 0 0 .98-.79L21 6H6" />
              </svg>
              {count > 0 && (
                <span
                  className="absolute -top-1 -right-2 bg-red-600 text-white text-xs rounded-full px-2 py-0.5 shadow"
                  aria-label={`Cart items: ${count}`}
                >
                  {count}
                </span>
              )}
            </motion.div>
          </div>
        </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden bg-[#1A1E21] border-t border-white/20"
          >
            <div className="px-4 py-3 space-y-3">
              {/* Mobile search */}
              <div className="md:hidden">
                <input
                  placeholder="Search products..."
                  className="w-full h-10 px-4 rounded-lg bg-white text-black"
                  value={searchValue}
                  onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
                />
              </div>

              {/* Mobile menu items */}
              <div className="flex flex-col space-y-2 text-white">
                {user && (
                  <div className="text-sm text-gray-300 pb-2 border-b border-white/20">
                    Hi, {user.username || user.email}
                  </div>
                )}
                <button className="text-left py-2 hover:bg-white/10 rounded">Help & Support</button>
                <button className="text-left py-2 hover:bg-white/10 rounded">Contact Us</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </>
  );
}

export default Navbar;
