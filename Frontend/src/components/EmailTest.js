import React, { useState } from 'react';
import axios from 'axios';
import { getApiUrl } from '../config/api';

export default function EmailTest({ onBack }) {
  const [credentials, setCredentials] = useState({ user: '', pass: '' });
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const testEmailCredentials = async () => {
    setLoading(true);
    try {
      const response = await axios.get(getApiUrl('/api/test-email'));
      setTestResult(response.data);
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const setupEmailCredentials = async () => {
    if (!credentials.user || !credentials.pass) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(getApiUrl('/api/setup-email'), credentials);
      setTestResult(response.data);
      if (response.data.success) {
        alert('Email credentials saved successfully!');
        setCredentials({ user: '', pass: '' });
      }
    } catch (error) {
      setTestResult({
        success: false,
        error: error.response?.data?.error || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-3 sm:p-6 bg-white rounded-lg shadow">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold">Email Configuration</h2>
        <button
          onClick={onBack}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back
        </button>
      </div>

      {/* Test Current Credentials */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded">
        <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Test Current Email Setup</h3>
        <button
          onClick={testEmailCredentials}
          disabled={loading}
          className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Testing...' : 'Test Email Credentials'}
        </button>
      </div>

      {/* Setup New Credentials */}
      <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded">
        <h3 className="text-sm sm:text-base font-semibold mb-2 sm:mb-3">Setup Email Credentials</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Gmail Address</label>
            <input
              type="email"
              name="user"
              value={credentials.user}
              onChange={handleInputChange}
              placeholder="your-email@gmail.com"
              className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Gmail App Password</label>
            <input
              type="password"
              name="pass"
              value={credentials.pass}
              onChange={handleInputChange}
              placeholder="16-character app password"
              className="w-full border rounded px-2 sm:px-3 py-1.5 sm:py-2 text-sm sm:text-base"
            />
            <p className="text-xs text-gray-600 mt-1">
              Use Gmail App Password, not your regular password
            </p>
          </div>
          <button
            onClick={setupEmailCredentials}
            disabled={loading}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Email Credentials'}
          </button>
        </div>
      </div>
      {/* Test Result */}
      {testResult && (
        <div className={`p-3 sm:p-4 rounded ${testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <h3 className={`font-semibold mb-2 ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {testResult.success ? '✅ Success' : '❌ Error'}
          </h3>
          <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
            {testResult.message || testResult.error}
          </p>
          {testResult.success && testResult.email && (
            <p className="text-green-600 text-sm mt-1">
              Email: {testResult.email}
            </p>
          )}
          {!testResult.success && testResult.code && (
            <p className="text-red-600 text-sm mt-1">
              Error Code: {testResult.code}
            </p>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2 text-blue-800">📧 Gmail App Password Setup</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Go to your Google Account settings</li>
          <li>2. Enable 2-Factor Authentication</li>
          <li>3. Go to Security → App passwords</li>
          <li>4. Generate an app password for "Mail"</li>
          <li>5. Use that 16-character password here</li>
        </ol>
      </div>
    </div>
  );
}
