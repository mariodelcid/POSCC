// Square Point of Sale API Callback Processing
// This file handles the transaction response from Square Point of Sale app

// For Android devices, declare the parameter keys
const clientTransactionId = "com.squareup.pos.CLIENT_TRANSACTION_ID";
const transactionId = "com.squareup.pos.SERVER_TRANSACTION_ID";
const errorField = "com.squareup.pos.ERROR_CODE";

// For iOS devices, declare the parameter keys
const iosClientTransactionId = "client_transaction_id";
const iosTransactionId = "transaction_id";
const iosErrorField = "error_code";

// Get the URL parameters and puts them in an array (for Android)
function getUrlParams(URL) {
    var vars = {};
    var parts = URL.replace(/[?&]+([^=&]+)=([^&]*)/gi,
    function(m,key,value) {
      vars[key] = value;
    });
    return vars;
}

// Get the data URL and encode in JSON (for iOS)
function getTransactionInfo(URL) {
    var data = decodeURI(URL.searchParams.get("data"));
    console.log("data: " + data);
    var transactionInfo = JSON.parse(data);
    return transactionInfo;
}

// Makes a result string for success situation
function handleSuccess(transactionInfo){
  var resultString = "";
  if (clientTransactionId in transactionInfo) {
    resultString += "Client Transaction ID: " + transactionInfo[clientTransactionId] + "<br>";
  }
  if (transactionId in transactionInfo) {
    resultString += "Transaction ID: " + transactionInfo[transactionId] + "<br>";
  } else {
    resultString += "Transaction ID: NO CARD USED<br>";
  }
  return resultString;
}

// Makes an error string for error situation
function handleError(transactionInfo){
  var resultString = "";
  if (errorField in transactionInfo) {
    resultString += "Error Code: " + transactionInfo[errorField] + "<br>";
  }
  if (clientTransactionId in transactionInfo) {
    resultString += "Client Transaction ID: " + transactionInfo[clientTransactionId] + "<br>";
  }
  if (transactionId in transactionInfo) {
    resultString += "Transaction ID: " + transactionInfo[transactionId] + "<br>";
  } else {
    resultString += "Transaction ID: PROCESSED OFFLINE OR NO CARD USED<br>";
  }
  return resultString;
}

// Determines whether error or success based on urlParams, then prints the string
function printResponse() {
  var responseUrl = window.location.href;
  var transactionInfo = getTransactionInfo(responseUrl);
  var resultString = "";
  
  if (errorField in transactionInfo || iosErrorField in transactionInfo) {
    resultString = handleError(transactionInfo);
  } else {
    resultString = handleSuccess(transactionInfo);
  }
  
  document.getElementById('url').innerHTML = resultString;
  
  // Send the transaction result back to the main app
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage({
      type: 'square_transaction_result',
      data: transactionInfo
    }, '*');
  }
  
  // Auto-return to original tab after 3 seconds
  setTimeout(function() {
    // Try to close this window/tab and return to the original
    if (window.opener) {
      // If this was opened in a new window, close it
      window.close();
    } else {
      // If this is a new tab, redirect back to the main app
      window.location.href = window.location.origin;
    }
  }, 3000);
}
