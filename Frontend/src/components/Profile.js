import React, { useState } from "react";
import { motion } from "framer-motion";
import { updateUsername } from "../services/auth";

export default function Profile({ user, onBack, onLogout, onUserChange, onOrdersClick }) {
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user?.username || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!user) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setError("Username cannot be empty");
      return;
    }
    try {
      setSaving(true);
      setError("");
      const updated = await updateUsername(trimmed);
      onUserChange && onUserChange(updated);
      setEditing(false);
    } catch (e) {
      setError(e?.message || "Failed to update username");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Your Profile</h1>
        <motion.button
          className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
        >
          Back
        </motion.button>
      </div>

      <div className="bg-white shadow rounded-lg p-6 flex items-center gap-6">
        <div className="w-20 h-20 rounded-full bg-[#72949A] text-white flex items-center justify-center text-3xl font-bold">
          {user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
        </div>
        <div className="flex-1">
          {!editing ? (
            <>
              <div className="text-lg font-medium">{user?.username || "User"}</div>
              <div className="text-gray-600">{user?.email || "unknown@example.com"}</div>
              {user?.userId && (
                <div className="text-xs text-blue-600 font-mono mt-1">
                  ID: {user.userId}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2 max-w-sm">
              <label className="text-sm text-gray-600">Username</label>
              <input
                className="border rounded px-3 py-2"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                disabled={saving}
              />
              {error && <div className="text-sm text-red-600">{error}</div>}
              <div className="flex gap-2 mt-1">
                <motion.button
                  className="px-3 py-1.5 rounded bg-[#72949A] text-white disabled:opacity-60"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save"}
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 rounded bg-gray-200 hover:bg-gray-300"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setEditing(false);
                    setNameInput(user?.username || "");
                    setError("");
                  }}
                  disabled={saving}
                >
                  Cancel
                </motion.button>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <motion.button
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setEditing(true)}
              disabled={!user}
            >
              Edit
            </motion.button>
          )}
          <motion.button
            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
          >
            Logout
          </motion.button>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Account</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Username</div>
            <div className="font-medium">{user?.username || "—"}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium">{user?.email || "—"}</div>
          </div>
          <div className="p-4 bg-white rounded shadow">
            <div className="text-sm text-gray-500">User ID</div>
            <div className="font-medium font-mono text-sm">
              {user?.userId ? (
                <div className="break-all">
                  <span className="text-blue-600">{user.userId}</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(user.userId)}
                    className="ml-2 text-xs text-gray-500 hover:text-gray-700"
                    title="Copy User ID"
                  >
                    📋
                  </button>
                </div>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <button
            onClick={onOrdersClick}
            className="p-4 bg-white rounded shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="text-lg mb-2">📦</div>
            <div className="font-medium">View My Orders</div>
            <div className="text-sm text-gray-600">Check your order history and status</div>
          </button>
          <button
            onClick={onBack}
            className="p-4 bg-white rounded shadow hover:shadow-md transition-shadow text-left"
          >
            <div className="text-lg mb-2">🛍️</div>
            <div className="font-medium">Continue Shopping</div>
            <div className="text-sm text-gray-600">Browse products and add to cart</div>
          </button>
        </div>
      </div>
    </div>
  );
}
