import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import img1 from "../assets/img1.jpg";
import img2 from "../assets/img2.jpg";
import img3 from "../assets/img3.jpg";

// Slider images
const sliderImages = [img1, img2, img3];

// Animated Emoji Component
function AnimatedEmoji({ emoji, animation = "bounce", delay = 0, size = "text-2xl" }) {
  const animations = {
    bounce: {
      y: [0, -10, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }
    },
    pulse: {
      scale: [1, 1.2, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }
    },
    rotate: {
      rotate: [0, 360],
      transition: {
        duration: 3,
        repeat: Infinity,
        delay: delay,
        ease: "linear"
      }
    },
    wiggle: {
      rotate: [-5, 5, -5],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }
    },
    float: {
      y: [0, -15, 0],
      x: [0, 5, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.span
      className={`inline-block ${size}`}
      animate={animations[animation]}
    >
      {emoji}
    </motion.span>
  );
}

// Image Slider Banner Component
function ImageSliderBanner() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for next, -1 for prev

  // Different transition effects
  const transitions = [
    // Slide from right
    {
      initial: { x: 1000, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -1000, opacity: 0 },
    },
    // Zoom and fade
    {
      initial: { scale: 0.8, opacity: 0, rotate: -5 },
      animate: { scale: 1, opacity: 1, rotate: 0 },
      exit: { scale: 1.2, opacity: 0, rotate: 5 },
    },
    // Flip effect
    {
      initial: { rotateY: 90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: -90, opacity: 0 },
    },
    // Slide up
    {
      initial: { y: 500, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -500, opacity: 0 },
    },
    // Diagonal slide
    {
      initial: { x: 500, y: 500, opacity: 0, scale: 0.5 },
      animate: { x: 0, y: 0, opacity: 1, scale: 1 },
      exit: { x: -500, y: -500, opacity: 0, scale: 0.5 },
    },
    // Rotate and zoom
    {
      initial: { scale: 0, rotate: 180, opacity: 0 },
      animate: { scale: 1, rotate: 0, opacity: 1 },
      exit: { scale: 0, rotate: -180, opacity: 0 },
    },
  ];

  // Use different transition for each image
  const currentTransition = transitions[currentIndex % transitions.length];

  // Auto slide
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prevIndex) =>
        prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) =>
      prevIndex === sliderImages.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? sliderImages.length - 1 : prevIndex - 1
    );
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl shadow-2xl">
      {/* Image Slider */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.img
          key={currentIndex}
          src={sliderImages[currentIndex]}
          alt={`Slide ${currentIndex + 1}`}
          className="absolute inset-0 w-full h-full object-cover"
          custom={direction}
          variants={currentTransition}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ 
            duration: 0.8,
            ease: [0.43, 0.13, 0.23, 0.96]
          }}
        />
      </AnimatePresence>

      {/* Overlay Content */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/30 z-10">
        <div className="h-full flex items-center justify-between px-8 md:px-16">
          {/* Left Content */}
          <motion.div
            className="text-white max-w-xl"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div
              className="inline-block bg-red-600 px-4 py-2 rounded-full mb-4"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="font-bold text-sm md:text-base flex items-center gap-2">
                <AnimatedEmoji emoji="🔥" animation="wiggle" size="text-xl" />
                HOT DEALS
              </span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-4 leading-tight drop-shadow-lg">
              MEGA SALE
            </h2>
            
            <p className="text-xl md:text-2xl mb-6 drop-shadow-md">
              Up to <span className="text-yellow-400 font-bold">70% OFF</span>
            </p>
            
            <motion.button
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-8 py-3 rounded-full shadow-lg text-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Shop Now
            </motion.button>
          </motion.div>

          {/* Right Floating Emojis */}
          <div className="hidden lg:block">
            <motion.div
              className="text-6xl"
              animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              🎁
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl z-20 transition-all"
      >
        ‹
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white/30 hover:bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-2xl z-20 transition-all"
      >
        ›
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-20">
        {sliderImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentIndex === index ? "bg-white w-8" : "bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Floating Decorative Emojis */}
      <motion.div
        className="absolute top-10 right-20 text-4xl z-20"
        animate={{ y: [0, -15, 0], rotate: [0, 360] }}
        transition={{ duration: 4, repeat: Infinity }}
      >
        ✨
      </motion.div>
      <motion.div
        className="absolute bottom-20 left-20 text-3xl z-20"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        💫
      </motion.div>
    </div>
  );
}

// Individual Banner Components
function FreeDeliveryBanner() {
  return (
    <motion.div
      className="bg-gradient-to-r from-green-400 via-green-500 to-green-600 text-white py-3 px-6 rounded-lg shadow-lg"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center gap-3">
        <AnimatedEmoji emoji="🚚" animation="bounce" size="text-3xl" />
        <div className="text-center">
          <h3 className="font-bold text-lg">FREE DELIVERY</h3>
          <p className="text-sm opacity-90">On orders over $50</p>
        </div>
        <AnimatedEmoji emoji="📦" animation="pulse" delay={0.5} size="text-2xl" />
      </div>
    </motion.div>
  );
}

function SaleBanner() {
  return (
    <motion.div
      className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 text-white py-3 px-6 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center gap-3">
        <AnimatedEmoji emoji="🔥" animation="wiggle" size="text-3xl" />
        <div className="text-center">
          <h3 className="font-bold text-lg">MEGA SALE</h3>
          <p className="text-sm opacity-90">Up to 70% OFF</p>
        </div>
        <AnimatedEmoji emoji="💥" animation="pulse" delay={0.3} size="text-2xl" />
      </div>
    </motion.div>
  );
}

function NewArrivalsBanner() {
  return (
    <motion.div
      className="bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 text-white py-3 px-6 rounded-lg shadow-lg"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center gap-3">
        <AnimatedEmoji emoji="✨" animation="rotate" size="text-3xl" />
        <div className="text-center">
          <h3 className="font-bold text-lg">NEW ARRIVALS</h3>
          <p className="text-sm opacity-90">Fresh & Trendy</p>
        </div>
        <AnimatedEmoji emoji="🆕" animation="bounce" delay={0.7} size="text-2xl" />
      </div>
    </motion.div>
  );
}

function QualityGuaranteeBanner() {
  return (
    <motion.div
      className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 text-white py-3 px-6 rounded-lg shadow-lg"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-center justify-center gap-3">
        <AnimatedEmoji emoji="🏆" animation="float" size="text-3xl" />
        <div className="text-center">
          <h3 className="font-bold text-lg">QUALITY GUARANTEED</h3>
          <p className="text-sm opacity-90">100% Satisfaction</p>
        </div>
        <AnimatedEmoji emoji="⭐" animation="pulse" delay={0.9} size="text-2xl" />
      </div>
    </motion.div>
  );
}

// Floating Emoji Background
function FloatingEmojis() {
  const emojis = [
    { emoji: "🎉", x: "10%", y: "20%", delay: 0 },
    { emoji: "💝", x: "85%", y: "15%", delay: 1 },
    { emoji: "🛍️", x: "15%", y: "70%", delay: 2 },
    { emoji: "❤️", x: "90%", y: "75%", delay: 3 },
    { emoji: "🎊", x: "50%", y: "10%", delay: 4 },
    { emoji: "💫", x: "75%", y: "45%", delay: 5 },
  ];

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {emojis.map((item, index) => (
        <motion.div
          key={index}
          className="absolute text-4xl opacity-20"
          style={{ left: item.x, top: item.y }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            delay: item.delay,
            ease: "easeInOut"
          }}
        >
          {item.emoji}
        </motion.div>
      ))}
    </div>
  );
}

// Main Live Emoji Banner Component
export default function LiveEmojiBanner() {
  return (
    <div className="relative">
      {/* Floating Background Emojis */}
      <FloatingEmojis />
      
      {/* Main Banner Section */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8">
        {/* Special Offers Ticker - Top Heading */}
        <motion.div
          className="bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-500 text-black py-3 px-4 rounded-full shadow-lg overflow-hidden mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-4">
            <AnimatedEmoji emoji="🎯" animation="rotate" size="text-xl" />
            <motion.div
              className="flex items-center gap-8 whitespace-nowrap"
              animate={{ x: [-100, 100] }}
              transition={{
                duration: 15,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <span className="font-bold flex items-center gap-2">
                <AnimatedEmoji emoji="⚡" animation="wiggle" size="text-lg" />
                Limited Time Offer!
              </span>
              <span className="flex items-center gap-2">
                <AnimatedEmoji emoji="🎁" animation="bounce" size="text-lg" />
                Buy 2 Get 1 FREE
              </span>
              <span className="flex items-center gap-2">
                <AnimatedEmoji emoji="💰" animation="pulse" size="text-lg" />
                Save up to 50%
              </span>
              <span className="flex items-center gap-2">
                <AnimatedEmoji emoji="🚚" animation="float" size="text-lg" />
                Fast Shipping
              </span>
            </motion.div>
            <AnimatedEmoji emoji="🎯" animation="rotate" size="text-xl" />
          </div>
        </motion.div>

        {/* Image Slider Banner */}
        <div className="mb-8">
          <ImageSliderBanner />
        </div>

        {/* Top Promotional Banners */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <FreeDeliveryBanner />
          <SaleBanner />
          <NewArrivalsBanner />
          <QualityGuaranteeBanner />
        </div>

        {/* Bottom Action Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          <motion.div
            className="bg-gradient-to-r from-emerald-400 to-teal-500 text-white py-4 px-6 rounded-lg text-center shadow-lg"
            whileHover={{ scale: 1.05, rotate: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <AnimatedEmoji emoji="🌟" animation="pulse" size="text-3xl" />
            <h4 className="font-bold mt-2">Premium Quality</h4>
            <p className="text-sm opacity-90">Handpicked Products</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-rose-400 to-pink-500 text-white py-4 px-6 rounded-lg text-center shadow-lg"
            whileHover={{ scale: 1.05, rotate: -1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <AnimatedEmoji emoji="💎" animation="rotate" size="text-3xl" />
            <h4 className="font-bold mt-2">Exclusive Deals</h4>
            <p className="text-sm opacity-90">Members Only</p>
          </motion.div>

          <motion.div
            className="bg-gradient-to-r from-violet-400 to-purple-500 text-white py-4 px-6 rounded-lg text-center shadow-lg"
            whileHover={{ scale: 1.05, rotate: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <AnimatedEmoji emoji="🎪" animation="wiggle" size="text-3xl" />
            <h4 className="font-bold mt-2">Fun Shopping</h4>
            <p className="text-sm opacity-90">Enjoy the Experience</p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
