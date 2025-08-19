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
    
    // For iOS, try multiple approaches
    var success = false;
    
    // Method 1: Try the Square app URL scheme
    try {
      console.log('Trying square:// URL scheme...');
      window.location.href = "square://";
      success = true;
    } catch (e) {
      console.log('square:// failed:', e);
    }
    
    // Method 2: If square:// didn't work, try opening the Square app store page
    if (!success) {
      try {
        console.log('Trying to open Square app in App Store...');
        window.open("https://apps.apple.com/app/square-point-of-sale/id335393788");
        success = true;
      } catch (e) {
        console.log('App Store redirect failed:', e);
      }
    }
    
    // Method 3: Show manual instructions
    if (!success) {
      console.log('All methods failed, showing manual instructions...');
      alert('Please open the Square Point of Sale app manually and enter:\n\n' +
            'Amount: $' + (transactionTotal/100).toFixed(2) + '\n\n' +
            'Or install Square Point of Sale from the App Store if not already installed.');
    } else {
      // Show instructions after a short delay
      setTimeout(function() {
        alert('If Square app opened, please enter:\n\n' +
              'Amount: $' + (transactionTotal/100).toFixed(2) + '\n\n' +
              'If Square app did not open, please install it from the App Store.');
      }, 2000);
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
