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
    // For desktop browsers - Square POS requires mobile devices
    console.log('Desktop browser detected - Square POS requires mobile device');
    
    // Show clear instructions about Square POS requirements
    alert('Square Point of Sale requires a mobile device with the Square app installed.\n\n' +
          'For the best experience, please use:\n' +
          '• Android device with Square Point of Sale app\n' +
          '• iPad/iPhone with Square Point of Sale app\n\n' +
          'Transaction Amount: $' + (transactionTotal/100).toFixed(2) + '\n\n' +
          'Alternatively, you can:\n' +
          '• Install Square Point of Sale on your computer\n' +
          '• Use Square Dashboard for manual entry\n' +
          '• Contact support for assistance');
  }
}

// Make the function globally available
window.openSquarePOS = openSquarePOS;
