// Square Point of Sale API Integration
// This file handles the Square Point of Sale app integration

// Global variables for Square Point of Sale configuration
var callbackUrl = window.location.origin + "/callback.html";
var applicationId = "sq0idp-PbznJFG3brzaUpfhFZD3mg";
var sdkVersion = "v2.0";

// Function to open Square Point of Sale app
function openSquarePOS(transactionTotal, currencyCode = "USD") {
  // Detect platform more accurately
  var isAndroid = /Android/i.test(navigator.userAgent);
  var isIPad = /iPad/i.test(navigator.userAgent);
  var isIPhone = /iPhone/i.test(navigator.userAgent);
  var isIPod = /iPod/i.test(navigator.userAgent);
  var isIOS = isIPad || isIPhone || isIPod;
  var isMobile = isAndroid || isIOS;
  
  console.log('Device detection:', {
    isAndroid: isAndroid,
    isIPad: isIPad,
    isIPhone: isIPhone,
    isIPod: isIPod,
    isIOS: isIOS,
    isMobile: isMobile,
    userAgent: navigator.userAgent
  });
  
  console.log('Transaction details:', {
    total: transactionTotal,
    currency: currencyCode,
    callbackUrl: callbackUrl,
    applicationId: applicationId
  });
  
  if (isAndroid) {
    // Android intent URL - using the correct Square Point of Sale API format
    console.log('Opening Square POS for Android...');
    
    // Build the intent URL according to Square's official documentation
    var posUrl = 
      "intent:#Intent;" +
      "action=com.squareup.pos.action.CHARGE;" +
      "package=com.squareup;" +
      "S.com.squareup.pos.WEB_CALLBACK_URI=" + callbackUrl + ";" +
      "S.com.squareup.pos.CLIENT_ID=" + applicationId + ";" +
      "S.com.squareup.pos.API_VERSION=" + sdkVersion + ";" +
      "i.com.squareup.pos.TOTAL_AMOUNT=" + transactionTotal + ";" +
      "S.com.squareup.pos.CURRENCY_CODE=" + currencyCode + ";" +
      "S.com.squareup.pos.TENDER_TYPES=com.squareup.pos.TENDER_CARD,com.squareup.pos.TENDER_CASH;" +
      "end";
    
    console.log('Android POS URL:', posUrl);
    window.open(posUrl);
    
  } else if (isIOS) {
    // iOS - use the correct Square Point of Sale API format for iOS
    console.log('Opening Square POS for iOS (iPad/iPhone)...');
    
    // For iOS, we need to use the Square Point of Sale API format
    // This should connect to the Square terminal on the same WiFi network
    var posUrl = 
      "square-commerce-v1://payment/create?" +
      "data=" + encodeURIComponent(JSON.stringify({
        amount_money: {
          amount: transactionTotal,
          currency_code: currencyCode
        },
        callback_url: callbackUrl,
        client_id: applicationId,
        version: sdkVersion,
        tender_types: ["CARD", "CASH"]
      }));
    
    console.log('iOS POS URL:', posUrl);
    
    // Try to open the Square app with the transaction data
    try {
      window.location.href = posUrl;
      
      // If that doesn't work after a short delay, show instructions
      setTimeout(function() {
        alert('If Square terminal did not open, please:\n\n' +
              '1. Ensure Square Point of Sale app is installed\n' +
              '2. Make sure your device is on the same WiFi as the Square terminal\n' +
              '3. Open Square Point of Sale app manually\n' +
              '4. Enter amount: $' + (transactionTotal/100).toFixed(2));
      }, 3000);
      
    } catch (e) {
      console.log('iOS Square POS failed:', e);
      alert('Please open the Square Point of Sale app manually and enter:\n\n' +
            'Amount: $' + (transactionTotal/100).toFixed(2) + '\n\n' +
            'Make sure you are connected to the same WiFi network as the Square terminal.');
    }
    
  } else {
    // For desktop browsers - provide desktop-friendly Square integration
    console.log('Desktop browser detected - opening Square web interface');
    
    // Open Square Dashboard for manual transaction entry
    var squareDashboardUrl = "https://squareup.com/dashboard/sales/transactions/new";
    
    // Try to open Square Dashboard in a new tab
    try {
      window.open(squareDashboardUrl, '_blank');
      
      // Show instructions for manual entry
      setTimeout(function() {
        alert('Square Dashboard opened in new tab.\n\n' +
              'Please manually enter the transaction:\n' +
              'Amount: $' + (transactionTotal/100).toFixed(2) + '\n\n' +
              'After completing the transaction in Square Dashboard:\n' +
              '1. Return to this POS tab\n' +
              '2. Click "Complete Order" again to record the sale\n' +
              '3. Or use the "Compras" button to record manually');
      }, 1000);
      
    } catch (e) {
      console.log('Failed to open Square Dashboard:', e);
      
      // Fallback: show instructions
      alert('Please open Square Dashboard manually:\n\n' +
            '1. Go to: https://squareup.com/dashboard/sales/transactions/new\n' +
            '2. Enter amount: $' + (transactionTotal/100).toFixed(2) + '\n' +
            '3. Complete the transaction\n' +
            '4. Return here and use "Compras" button to record the sale');
    }
  }
}

// Make the function globally available
window.openSquarePOS = openSquarePOS;
