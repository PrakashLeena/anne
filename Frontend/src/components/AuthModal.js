import LoginForm from "./LoginForm.js";
import SignupForm from "./SignupForm";
import { AnimatePresence, motion } from "framer-motion";

function AuthModal({ isOpen, onClose, activeTab, setActiveTab, onSuccess }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 flex justify-center items-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Modal card */}
          <motion.div
            className="relative bg-white rounded-2xl shadow-lg w-96 p-6"
            role="dialog"
            aria-modal="true"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            {/* Tabs */}
            <div className="flex mb-6 border-b">
              <button
                className={`flex-1 py-2 ${
                  activeTab === "login"
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("login")}
              >
                Login
              </button>
              <button
                className={`flex-1 py-2 ${
                  activeTab === "signup"
                    ? "border-b-2 border-blue-600 text-blue-600 font-semibold"
                    : "text-gray-500"
                }`}
                onClick={() => setActiveTab("signup")}
              >
                Signup
              </button>
            </div>

            {activeTab === "login" ? (
              <LoginForm onSuccess={onSuccess} />
            ) : (
              <SignupForm onSuccess={onSuccess} />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AuthModal
