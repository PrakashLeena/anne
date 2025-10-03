import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import ImageSlider from "./components/ImageSlider";
import reportWebVitals from "./reportWebVitals";
import Navbar from "./components/Navbar";
import SideNav from "./components/SideNav";
import TimedSalesPage from "./components/TimedSalesPage";
import ProductsSection from "./components/Products";
import AuthModal from "./components/AuthModal";
import FiltersSidebar from "./components/FiltersSidebar";
import Footer from "./components/Footer";
import LiveEmojiBanner from "./components/LiveEmojiBanner";
import { getCurrentUser, logout } from "./services/auth";
import { CartProvider } from "./context/CartContext";
import { ProductsProvider } from "./context/ProductsContext";
import CartPage from "./components/CartPage";
import Profile from "./components/Profile";
import AdminPanel from "./components/AdminPanel";
import Orders from "./components/Orders";
import { motion, AnimatePresence } from "framer-motion";
import { BrowserRouter } from "react-router-dom";
import Chatbot from "./components/Chatbot";
import auth from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

function RootApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [view, setView] = useState("home"); // 'home' | 'cart' | 'profile' | 'admin' | 'orders'
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dealsRef = useRef(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const ADMIN_UID = "eOWzgdSCQDNXPyrorChBbkvaTrZ2"; // change to your admin UID(s)

  const allCategories = [
    "Smartphone",
    "Headphones",
    "Sneakers",
    "Smartwatch",
    "Laptop",
    "Backpack",
    "Camera",
    "Tablet",
    "Smart TV",
    "Bluetooth Speaker",
    "Gaming Console"
  ];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      // map to app's user shape
      const mapped = fbUser
        ? { username: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "User"), email: fbUser.email || "" }
        : null;
      setUser(mapped);
      setIsAdmin(!!fbUser && fbUser.uid === ADMIN_UID);
    });
    return () => unsubscribe && unsubscribe();
  }, []);

  function toggleCategory(cat) {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }
  function clearFilters() {
    setSelectedCategories([]);
    setPriceRange([0, 1000]);
    setSearchQuery("");
  }

  return (
    <div>
      {/* Navbar with handlers */}
      <Navbar
        user={user}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        onCartClick={() => setView("cart")}
        onLoginClick={() => {
          setActiveTab("login");
          setIsOpen(true);
        }}
        onSignupClick={() => {
          setActiveTab("signup");
          setIsOpen(true);
        }}
        onLogoutClick={() => {
          logout();
          setUser(null);
        }}
      />

      <div className="flex">
        <SideNav
          onHomeClick={() => setView("home")}
          onCartClick={() => setView("cart")}
          onFiltersClick={() => setFiltersOpen(true)}
          onDealsClick={() => {
            setView("home");
            setTimeout(() => {
              if (dealsRef.current) {
                dealsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
              }
            }, 0);
          }}
          onProfileClick={() => setView("profile")}
          onOrdersClick={() => setView("orders")}
          onAdminClick={() => setView("admin")}
          isAdmin={isAdmin}
        />
        <div className="flex-1 min-h-screen">
          {view === "cart" && (
            <div className="w-full">
              <CartPage onBack={() => setView("home")} />
            </div>
          )}
          {view === "profile" && (
            <div className="w-full">
              <Profile
                user={user}
                onBack={() => setView("home")}
                onLogout={() => {
                  logout();
                  setUser(null);
                  setView("home");
                }}
                onUserChange={(u) => setUser(u)}
                onOrdersClick={() => setView("orders")}
              />
            </div>
          )}
          {view === "admin" && (
            <div className="w-full">
              <AdminPanel onBack={() => setView("home")} isAdmin={isAdmin} />
            </div>
          )}
          {view === "orders" && (
            <div className="w-full">
              <Orders onBack={() => setView("home")} />
            </div>
          )}
          {view === "home" && (
            <>
              {/* Live Emoji Banner with Image Slider */}
              <LiveEmojiBanner />
              
              <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 flex flex-col gap-4 sm:gap-6 lg:gap-8">
                <div ref={dealsRef} />
                <TimedSalesPage
                  searchQuery={searchQuery}
                  selectedCategories={selectedCategories}
                  priceRange={priceRange}
                  onGrabDeal={() => setView("cart")}
                />
                <ProductsSection
                  searchQuery={searchQuery}
                  selectedCategories={selectedCategories}
                  priceRange={priceRange}
                  onBuyNow={() => setView("cart")}
                />
              </div>
              {/* Live Chatbot */}
              <Chatbot />
            </>
          )}
        </div>
      </div>

      {/* Filters Drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-[60]"
              onClick={() => setFiltersOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed top-0 left-0 bottom-0 w-[320px] max-w-[85vw] bg-white z-[61] shadow-xl overflow-y-auto"
              initial={{ x: -360 }}
              animate={{ x: 0 }}
              exit={{ x: -360 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <h2 className="font-semibold text-lg">Filters</h2>
                <button
                  className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setFiltersOpen(false)}
                >
                  Close
                </button>
              </div>
              <div className="p-4">
                <FiltersSidebar
                  categories={allCategories}
                  selectedCategories={selectedCategories}
                  onToggleCategory={(c) => toggleCategory(c)}
                  priceRange={priceRange}
                  onPriceChange={setPriceRange}
                  onClear={() => {
                    clearFilters();
                  }}
                />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AuthModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSuccess={(u) => {
          setUser(u);
          setIsOpen(false);
        }}
      />

      <div>
         <Footer/>
        </div>
    </div>

    
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <CartProvider>
    <ProductsProvider>
      <BrowserRouter>
        <RootApp />
      </BrowserRouter>
    </ProductsProvider>
  </CartProvider>
);

reportWebVitals();
