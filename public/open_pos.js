// Square Point of Sale API Integration
// This file handles the Square Point of Sale app integration

// Global variables for Square Point of Sale configuration
var callbackUrl = window.location.origin + "/callback.html";
var applicationId = "sq0idp-PbznJFG3brzaUpfhFZD3mg";
var sdkVersion = "v2.0";

// Function to open Square Point of Sale app
function openSquarePOS(transactionTotal, currencyCode = "USD") {
  // Configure the allowable tender types
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

  // Open the Square Point of Sale app
  window.open(posUrl);
}

// Make the function globally available
window.openSquarePOS = openSquarePOS;
