import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../config/api';

export default function ApiTest() {
  const [apiStatus, setApiStatus] = useState('Testing...');
  const [apiUrl, setApiUrl] = useState('');
  const [testResults, setTestResults] = useState([]);

  useEffect(() => {
    const currentApiUrl = getApiUrl('');
    setApiUrl(currentApiUrl);
    runApiTests(currentApiUrl);
  }, []);

  const runApiTests = async (baseUrl) => {
    const tests = [
      { name: 'API Test Endpoint', url: `${baseUrl}/api/test` },
      { name: 'Products Endpoint', url: `${baseUrl}/api/products` },
      { name: 'Flash Products Endpoint', url: `${baseUrl}/api/flash-products` },
      { name: 'Chat Sessions Endpoint', url: `${baseUrl}/api/chat-sessions` }
    ];

    const results = [];

    for (const test of tests) {
      try {
        console.log(`Testing: ${test.url}`);
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          results.push({
            name: test.name,
            status: 'SUCCESS',
            statusCode: response.status,
            data: JSON.stringify(data, null, 2).substring(0, 200) + '...'
          });
        } else {
          results.push({
            name: test.name,
            status: 'FAILED',
            statusCode: response.status,
            error: `HTTP ${response.status}: ${response.statusText}`
          });
        }
      } catch (error) {
        results.push({
          name: test.name,
          status: 'ERROR',
          error: error.message
        });
      }
    }

    setTestResults(results);
    const allSuccess = results.every(r => r.status === 'SUCCESS');
    setApiStatus(allSuccess ? 'All tests passed!' : 'Some tests failed');
  };

  return (
    <div className="p-6 bg-white border rounded-lg shadow-lg max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">🔧 API Connection Diagnostics</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Configuration:</h3>
        <p><strong>API Base URL:</strong> <code className="bg-gray-200 px-2 py-1 rounded">{apiUrl}</code></p>
        <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>REACT_APP_API_URL:</strong> {process.env.REACT_APP_API_URL || 'Not set'}</p>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Overall Status: <span className={apiStatus.includes('passed') ? 'text-green-600' : 'text-red-600'}>{apiStatus}</span></h3>
      </div>

      <div className="space-y-4">
        {testResults.map((result, index) => (
          <div key={index} className={`p-4 border rounded ${
            result.status === 'SUCCESS' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
          }`}>
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{result.name}</h4>
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'SUCCESS' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              }`}>
                {result.status}
              </span>
            </div>
            
            {result.statusCode && (
              <p className="text-sm text-gray-600 mb-1">Status Code: {result.statusCode}</p>
            )}
            
            {result.error && (
              <p className="text-sm text-red-600 mb-2">Error: {result.error}</p>
            )}
            
            {result.data && (
              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600">Response Data</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">{result.data}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h4 className="font-semibold text-blue-800 mb-2">🔍 Troubleshooting Tips:</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• If API Base URL shows localhost, set REACT_APP_API_URL in Vercel environment variables</li>
          <li>• If all tests fail, check if your backend is deployed and running</li>
          <li>• If you get CORS errors, check backend CORS configuration</li>
          <li>• If you get 404 errors, verify your backend endpoints are deployed correctly</li>
        </ul>
      </div>

      <div className="mt-4">
        <button 
          onClick={() => runApiTests(apiUrl)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Run Tests Again
        </button>
      </div>
    </div>
  );
}
