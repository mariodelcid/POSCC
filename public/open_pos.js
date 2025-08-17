// Square Point of Sale API Integration
// This file handles the Square Point of Sale app integration

// Global variables for Square Point of Sale configuration
var callbackUrl = window.location.origin + "/callback.html";
var applicationId = "sq0idp-PbznJFG3brzaUpfhFZD3mg";
var sdkVersion = "v2.0";

// Function to open Square Point of Sale app
function openSquarePOS(transactionTotal, currencyCode = "USD") {
  // Detect platform
  var isAndroid = /Android/i.test(navigator.userAgent);
  var isIOS = /iPad|iPhone|iPod/i.test(navigator.userAgent);
  var isMobile = isAndroid || isIOS;
  
  if (isAndroid) {
    // Android intent URL
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
    // iOS URL scheme
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
    // Desktop fallback - show payment form or redirect to Square web
    console.log('Desktop detected, redirecting to Square web payment...');
    
    // Create a web-based payment flow for desktop
    var squareWebUrl = "https://checkout.squareup.com/v2/checkout" +
      "?client_id=" + applicationId +
      "&amount=" + transactionTotal +
      "&currency=" + currencyCode +
      "&callback_url=" + encodeURIComponent(callbackUrl);
    
    window.open(squareWebUrl, '_blank');
  }
}

// Make the function globally available
window.openSquarePOS = openSquarePOS;
