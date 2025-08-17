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
    
    // Build the iOS URL scheme according to Square's official documentation
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
    
    console.log('iOS POS URL:', posUrl);
    
    // Try to open the Square app using the same intent format as Android
    try {
      window.open(posUrl);
    } catch (e) {
      console.log('iOS Square POS failed, trying alternative method...');
      // Alternative: try direct app opening
      try {
        window.location = "square://";
      } catch (e2) {
        console.log('Both methods failed, showing fallback...');
        // Fallback: show instructions
        alert('Please open the Square Point of Sale app manually and enter:\n\n' +
              'Amount: $' + (transactionTotal/100).toFixed(2) + '\n\n' +
              'Or ensure Square Point of Sale app is installed on your device.');
      }
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
