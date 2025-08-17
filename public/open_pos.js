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
    // Android intent URL
    console.log('Opening Square POS for Android...');
    var tenderTypes = 
      "com.squareup.pos.TENDER_CARD, " +
      "com.squareup.pos.TENDER_CARD_ON_FILE, " +
      "com.squareup.pos.TENDER_CASH, " +
      "com.squareup.pos.TENDER_OTHER";
    
    var posUrl = 
      "intent:#Intent;" +
      "action=com.squareup.pos.action.CHARGE;" +
      "package=com.squareup;" +
      "S.com.squareup.pos.WEB_CALLBACK_URI=" + callbackUrl + ";" +
      "S.com.squareup.pos.CLIENT_ID=" + applicationId + ";" +
      "S.com.squareup.pos.API_VERSION=" + sdkVersion + ";" +
      "i.com.squareup.pos.TOTAL_AMOUNT=" + transactionTotal + ";" +
      "S.com.squareup.pos.CURRENCY_CODE=" + currencyCode + ";" +
      "S.com.squareup.pos.TENDER_TYPES=" + tenderTypes + ";" +
      "end";
    
    window.open(posUrl);
  } else if (isIOS) {
    // iOS URL scheme (works for iPad and iPhone)
    console.log('Opening Square POS for iOS (iPad/iPhone)...');
    var dataParameter = {
      callback_url: callbackUrl,
      client_id: applicationId,
      version: "1.3",
      notes: "POS Transaction",
      options: {
        supported_tender_types: ["CREDIT_CARD", "CASH", "OTHER", "SQUARE_GIFT_CARD", "CARD_ON_FILE"]
      }
    };
    
    var posUrl = 
      "square-commerce-v1://payment/create?data=" + 
      encodeURIComponent(JSON.stringify(dataParameter));
    
    window.location = posUrl;
  } else {
    // For desktop browsers, show a message about Square POS requirements
    console.log('Desktop browser detected - Square POS requires mobile device or Square app');
    
    // Show user-friendly message about Square POS requirements
    alert('Square Point of Sale requires a mobile device with the Square app installed.\n\n' +
          'Please use:\n' +
          '• Android device with Square Point of Sale app\n' +
          '• iPad/iPhone with Square Point of Sale app\n' +
          '• Or install Square Point of Sale on your computer\n\n' +
          'Amount: $' + (transactionTotal/100).toFixed(2));
  }
}



// Make the function globally available
window.openSquarePOS = openSquarePOS;
