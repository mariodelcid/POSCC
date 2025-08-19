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
    console.log('Desktop browser detected - showing payment options');
    
    // Show a comprehensive message with multiple options
    var amount = (transactionTotal/100).toFixed(2);
    var message = 'Desktop Payment Options:\n\n' +
                  'Transaction Amount: $' + amount + '\n\n' +
                  'Choose your payment method:\n\n' +
                  '1. SQUARE DASHBOARD (Manual Entry):\n' +
                  '   • Opens Square web dashboard\n' +
                  '   • You must enter amount manually\n' +
                  '   • Best for card payments\n\n' +
                  '2. CASH/COMPRAS (Record Only):\n' +
                  '   • Use "Compras" button below\n' +
                  '   • Record cash payment in POS\n' +
                  '   • No Square processing needed\n\n' +
                  '3. MOBILE DEVICE:\n' +
                  '   • Use Android phone/tablet\n' +
                  '   • Use iPad/iPhone\n' +
                  '   • Automatic amount pre-fill\n\n' +
                  'Which option would you like?';
    
    var choice = confirm(message);
    
    if (choice) {
      // User chose Square Dashboard
      var squareDashboardUrl = "https://squareup.com/dashboard/sales/transactions/new";
      
      try {
        window.open(squareDashboardUrl, '_blank');
        
        // Show specific instructions
        setTimeout(function() {
          alert('Square Dashboard opened!\n\n' +
                'IMPORTANT: You must manually enter the amount.\n\n' +
                'Steps:\n' +
                '1. In Square Dashboard, click "New Sale"\n' +
                '2. Enter amount: $' + amount + '\n' +
                '3. Process the payment\n' +
                '4. Return here and use "Compras" button to record\n\n' +
                'Note: Square web dashboard cannot pre-fill amounts.');
        }, 1000);
        
      } catch (e) {
        console.log('Failed to open Square Dashboard:', e);
        alert('Please manually go to:\n' +
              'https://squareup.com/dashboard/sales/transactions/new\n\n' +
              'Enter amount: $' + amount);
      }
    } else {
      // User chose to use Compras/Cash option
      alert('Perfect! Use the "Compras" button below to record this as a cash payment.\n\n' +
            'Amount to record: $' + amount);
    }
  }
}

// Make the function globally available
window.openSquarePOS = openSquarePOS;
