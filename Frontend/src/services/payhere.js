// PayHere Payment Gateway Integration
import CryptoJS from 'crypto-js';

const PAYHERE_CONFIG = {
  MERCHANT_ID: '1232223',
  MERCHANT_SECRET: 'MTczMjUyMTQ3ODE0MTI5Njg5MzkyMTEyMjA2MDI2NDU3NDUw',
  APP_ID: '4OVyIPRBDwu4JFnJsiyj4a3D3',
  APP_SECRET: '4E1BAvC5UIL4ZCbWDIfItK49Z4CkZCF0N8W3jZn6NXjp',
  CURRENCY: 'LKR',
  SANDBOX: true, // Set to false for production
  DOMAIN: 'anne'
};

// Generate PayHere hash for security
function generateHash(orderId, amount, currency = 'LKR') {
  const merchantSecret = PAYHERE_CONFIG.MERCHANT_SECRET;
  const merchantId = PAYHERE_CONFIG.MERCHANT_ID;
  
  const hashString = merchantId + orderId + amount + currency + CryptoJS.MD5(merchantSecret).toString().toUpperCase();
  return CryptoJS.MD5(hashString).toString().toUpperCase();
}

// Convert USD to LKR (approximate rate)
function convertToLKR(usdAmount) {
  const exchangeRate = 325; // Approximate USD to LKR rate
  return Math.round(usdAmount * exchangeRate * 100) / 100;
}

// Initialize PayHere payment
export function initiatePayHerePayment(orderDetails, onSuccess, onError, onDismiss) {
  return new Promise((resolve, reject) => {
    try {
      // Convert amount to LKR
      const amountLKR = convertToLKR(orderDetails.totalAmount);
      
      const payment = {
        sandbox: PAYHERE_CONFIG.SANDBOX,
        merchant_id: PAYHERE_CONFIG.MERCHANT_ID,
        return_url: `${window.location.origin}/payment-success`,
        cancel_url: `${window.location.origin}/payment-cancel`,
        notify_url: `${window.location.origin}/api/payhere/notify`,
        order_id: orderDetails.orderId,
        items: orderDetails.items.map(item => item.title).join(', '),
        amount: amountLKR.toFixed(2),
        currency: PAYHERE_CONFIG.CURRENCY,
        hash: generateHash(orderDetails.orderId, amountLKR.toFixed(2), PAYHERE_CONFIG.CURRENCY),
        first_name: orderDetails.customerName.split(' ')[0] || 'Customer',
        last_name: orderDetails.customerName.split(' ').slice(1).join(' ') || '',
        email: orderDetails.customerEmail,
        phone: orderDetails.phone || '0771234567',
        address: orderDetails.shippingAddress.street,
        city: orderDetails.shippingAddress.city,
        country: 'Sri Lanka',
        delivery_address: orderDetails.shippingAddress.street,
        delivery_city: orderDetails.shippingAddress.city,
        delivery_country: 'Sri Lanka',
        custom_1: orderDetails.userId || '',
        custom_2: PAYHERE_CONFIG.DOMAIN
      };

      // PayHere event handlers
      window.payhere.onCompleted = function onCompleted(orderId) {
        console.log("Payment completed. OrderID:" + orderId);
        if (onSuccess) onSuccess(orderId);
        resolve({ success: true, orderId });
      };

      window.payhere.onDismissed = function onDismissed() {
        console.log("Payment dismissed");
        if (onDismiss) onDismiss();
        resolve({ success: false, reason: 'dismissed' });
      };

      window.payhere.onError = function onError(error) {
        console.log("Error:" + error);
        if (onError) onError(error);
        reject(new Error(error));
      };

      // Start payment
      window.payhere.startPayment(payment);
      
    } catch (error) {
      console.error('PayHere initialization error:', error);
      reject(error);
    }
  });
}

// Verify payment hash (for backend verification)
export function verifyPaymentHash(merchantId, orderId, amount, currency, statusCode, md5sig) {
  const merchantSecret = PAYHERE_CONFIG.MERCHANT_SECRET;
  const localMd5sig = CryptoJS.MD5(
    merchantId + orderId + amount + currency + statusCode + CryptoJS.MD5(merchantSecret).toString().toUpperCase()
  ).toString().toUpperCase();
  
  return localMd5sig === md5sig;
}

// Format amount for display
export function formatLKR(amount) {
  return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Get exchange rate info
export function getExchangeInfo(usdAmount) {
  const lkrAmount = convertToLKR(usdAmount);
  return {
    usd: usdAmount,
    lkr: lkrAmount,
    rate: 325,
    formatted: formatLKR(lkrAmount)
  };
}
