import React from "react";
import { motion } from "framer-motion";

export default function PromoBanners() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Main Daily Essentials Banner */}
      <motion.div
        className="relative bg-gradient-to-r from-teal-600 via-teal-500 to-teal-600 rounded-2xl overflow-hidden shadow-2xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="relative flex items-center justify-between p-8 md:p-12">
          {/* Left Content */}
          <div className="flex-1 z-10">
            <motion.div
              className="inline-block bg-white px-4 py-1 rounded-full mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-orange-600 font-bold text-sm md:text-base">
                🎯 PAYDAY SALE
              </span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight">
              DAILY<br />ESSENTIALS
            </h2>
            
            <div className="flex flex-wrap gap-3 mb-6">
              <div className="bg-white px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-2xl">🚚</span>
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Free</p>
                  <p className="text-sm font-bold text-teal-600">Delivery</p>
                </div>
              </div>
              
              <div className="bg-orange-500 px-4 py-2 rounded-lg flex items-center gap-2">
                <span className="text-2xl">🎟️</span>
                <div>
                  <p className="text-xs text-white font-semibold">Voucher Max</p>
                  <p className="text-sm font-bold text-white">Deals</p>
                </div>
              </div>
            </div>
            
            <motion.button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-full shadow-lg text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Shop Now
            </motion.button>
          </div>

          {/* Center Discount Badge */}
          <motion.div
            className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 bg-yellow-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white">
                <div className="text-center">
                  <p className="text-sm md:text-base font-bold text-teal-700">UP TO</p>
                  <p className="text-4xl md:text-5xl font-black text-teal-700">70%</p>
                  <p className="text-lg md:text-xl font-bold text-teal-700">OFF</p>
                </div>
              </div>
              {/* Decorative dots */}
              <motion.div
                className="absolute -top-2 -right-2 w-6 h-6 bg-orange-500 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-pink-500 rounded-full"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              />
            </div>
          </motion.div>

          {/* Right Product Display */}
          <div className="hidden md:flex flex-1 justify-end items-center relative z-10">
            <div className="relative">
              {/* Product boxes */}
              <motion.div
                className="relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="flex gap-4 items-end">
                  <div className="w-24 h-32 bg-gradient-to-br from-purple-400 to-purple-600 rounded-lg shadow-xl transform rotate-6"></div>
                  <div className="w-24 h-36 bg-gradient-to-br from-red-400 to-red-600 rounded-lg shadow-xl"></div>
                  <div className="w-24 h-28 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg shadow-xl transform -rotate-6"></div>
                </div>
              </motion.div>
              
              {/* Floating emojis */}
              <motion.span
                className="absolute -top-4 -left-4 text-3xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                ✨
              </motion.span>
              <motion.span
                className="absolute -bottom-2 -right-2 text-2xl"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🎁
              </motion.span>
            </div>
          </div>

          {/* Decorative elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full"></div>
            <div className="absolute bottom-10 right-10 w-32 h-32 bg-white rounded-full"></div>
            <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-yellow-300 rounded-full"></div>
          </div>
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-20">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
          <div className="w-2 h-2 bg-white/50 rounded-full"></div>
        </div>

        {/* Navigation arrows */}
        <button className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white z-20">
          ‹
        </button>
        <button className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white z-20">
          ›
        </button>
      </motion.div>

      {/* Secondary Payday Sale Banner */}
      <motion.div
        className="relative bg-gradient-to-r from-yellow-300 via-yellow-200 to-yellow-300 rounded-2xl overflow-hidden shadow-xl border-4 border-yellow-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex items-center justify-between p-6 md:p-8">
          {/* Left - Sale Badge */}
          <motion.div
            className="flex items-center gap-4"
            animate={{ x: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="relative">
              <div className="bg-gradient-to-br from-orange-500 to-red-600 text-white px-6 py-4 rounded-xl transform -rotate-3 shadow-lg">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl md:text-4xl font-black">25</span>
                  <span className="text-xl font-bold">th</span>
                </div>
              </div>
              <motion.div
                className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-xl"
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                🎪
              </motion.div>
            </div>
            
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-3 rounded-lg shadow-lg transform rotate-1">
              <p className="text-2xl md:text-3xl font-black italic">PAYDAY SALE</p>
              <p className="text-sm font-semibold">25-30 SEP</p>
            </div>
          </motion.div>

          {/* Center - Products */}
          <div className="hidden md:flex items-center gap-4">
            <motion.div
              className="w-20 h-24 bg-gradient-to-br from-gray-300 to-gray-400 rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="w-24 h-28 bg-gradient-to-br from-purple-300 to-purple-500 rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
            <motion.div
              className="w-20 h-24 bg-gradient-to-br from-pink-300 to-pink-500 rounded-lg shadow-lg"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.6 }}
            />
          </div>

          {/* Right - Free Delivery & CTA */}
          <div className="flex items-center gap-4">
            <motion.div
              className="bg-teal-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
            >
              <span className="text-3xl">🚚</span>
              <div>
                <p className="text-sm font-semibold">FREE</p>
                <p className="text-xl font-black">DELIVERY</p>
              </div>
            </motion.div>
            
            <motion.button
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-8 py-4 rounded-xl shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Shop Now
            </motion.button>
          </div>
        </div>

        {/* Decorative elements */}
        <motion.div
          className="absolute top-4 right-1/4 text-2xl"
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          🎉
        </motion.div>
        <motion.div
          className="absolute bottom-4 left-1/3 text-xl"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ⭐
        </motion.div>
      </motion.div>

      {/* Flash Sale Header */}
      <motion.div
        className="flex items-center gap-3 pt-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <h3 className="text-2xl md:text-3xl font-bold text-gray-800">Flash Sale</h3>
        <motion.span
          className="text-3xl"
          animate={{ rotate: [0, 20, -20, 0] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          ⚡
        </motion.span>
      </motion.div>
    </div>
  );
}
