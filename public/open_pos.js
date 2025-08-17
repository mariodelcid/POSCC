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
    // Web browser fallback - create a web-based payment flow
    console.log('Web browser detected, creating web payment flow...');
    
    // For web browsers, we'll create a simple payment form
    createWebPaymentForm(transactionTotal, currencyCode);
  }
}

// Function to create a web payment form for browsers
function createWebPaymentForm(amount, currency) {
  // Remove any existing payment form
  var existingForm = document.getElementById('web-payment-form');
  if (existingForm) {
    existingForm.remove();
  }
  
  // Create payment form container
  var formContainer = document.createElement('div');
  formContainer.id = 'web-payment-form';
  formContainer.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  // Create payment form
  var form = document.createElement('div');
  form.style.cssText = `
    background: white;
    padding: 30px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
  `;
  
  form.innerHTML = `
    <h2 style="color: #333; margin-bottom: 20px;">💳 Web Payment</h2>
    <p style="color: #666; margin-bottom: 20px;">Amount: $${(amount/100).toFixed(2)} ${currency}</p>
    
    <div style="margin-bottom: 15px;">
      <input type="text" id="card-number" placeholder="Card Number" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
    </div>
    
    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
      <input type="text" id="expiry" placeholder="MM/YY" style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
      <input type="text" id="cvv" placeholder="CVV" style="flex: 1; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
    </div>
    
    <div style="margin-bottom: 20px;">
      <input type="text" id="name" placeholder="Cardholder Name" style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
    </div>
    
    <div style="display: flex; gap: 10px;">
      <button onclick="processWebPayment(${amount}, '${currency}')" style="flex: 1; padding: 12px; background: #00d4aa; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">Pay $${(amount/100).toFixed(2)}</button>
      <button onclick="closeWebPaymentForm()" style="flex: 1; padding: 12px; background: #6b7280; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">Cancel</button>
    </div>
  `;
  
  formContainer.appendChild(form);
  document.body.appendChild(formContainer);
}

// Function to close the web payment form
function closeWebPaymentForm() {
  var form = document.getElementById('web-payment-form');
  if (form) {
    form.remove();
  }
}

// Function to process web payment
function processWebPayment(amount, currency) {
  var cardNumber = document.getElementById('card-number').value;
  var expiry = document.getElementById('expiry').value;
  var cvv = document.getElementById('cvv').value;
  var name = document.getElementById('name').value;
  
  if (!cardNumber || !expiry || !cvv || !name) {
    alert('Please fill in all fields');
    return;
  }
  
  // Show processing message
  var form = document.getElementById('web-payment-form');
  form.innerHTML = `
    <div style="text-align: center; padding: 40px;">
      <h3>Processing Payment...</h3>
      <p>Please wait while we process your payment.</p>
      <div style="margin-top: 20px;">⏳</div>
    </div>
  `;
  
  // Simulate payment processing (replace with real Square API call)
  setTimeout(() => {
    // For now, we'll simulate success
    // In production, you'd call your Square API endpoint here
    form.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <h3 style="color: #10b981;">Payment Successful! ✅</h3>
        <p>Amount: $${(amount/100).toFixed(2)} ${currency}</p>
        <p>Transaction ID: WEB_${Date.now()}</p>
        <button onclick="closeWebPaymentForm()" style="padding: 12px 24px; background: #10b981; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; margin-top: 20px;">Close</button>
      </div>
    `;
    
    // Send success message to parent window
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'square_transaction_result',
        data: {
          success: true,
          transaction_id: 'WEB_' + Date.now(),
          amount: amount
        }
      }, '*');
    }
  }, 2000);
}
}

// Make the function globally available
window.openSquarePOS = openSquarePOS;
