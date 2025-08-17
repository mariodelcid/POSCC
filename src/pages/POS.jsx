import React, { useEffect, useMemo, useState } from 'react';

function centsToUSD(cents) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function POS() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]); // {itemId, name, priceCents, quantity}
  const [paymentMethod, setPaymentMethod] = useState('square');
  const [selectedSquareMethod, setSelectedSquareMethod] = useState('CARD');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [showPurchaseInput, setShowPurchaseInput] = useState(false);
  const [squarePaymentMethods, setSquarePaymentMethods] = useState([]);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });


  useEffect(() => {
    fetch('/api/items').then((r) => r.json()).then(setItems);
    
    // Fetch available Square payment methods
    fetch('/api/square/payment-methods')
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setSquarePaymentMethods(data.paymentMethods);
        }
      })
      .catch((err) => console.error('Failed to fetch payment methods:', err));
    
    // Listen for Square transaction results from callback page
    const handleSquareMessage = (event) => {
      if (event.data && event.data.type === 'square_transaction_result') {
        const transactionInfo = event.data.data;
        
        // Check if transaction was successful
        const isSuccess = !transactionInfo['com.squareup.pos.ERROR_CODE'] && !transactionInfo.error_code;
        
        if (isSuccess) {
          // Create the sale record
          createSaleRecord(transactionInfo);
        } else {
          // Handle error
          const errorCode = transactionInfo['com.squareup.pos.ERROR_CODE'] || transactionInfo.error_code;
          setMessage(`Transaction failed: ${errorCode}`);
        }
      }
    };
    
    window.addEventListener('message', handleSquareMessage);
    
    return () => {
      window.removeEventListener('message', handleSquareMessage);
    };
  }, []);

  const grouped = useMemo(() => {
    const map = new Map();
    for (const it of items) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category).push(it);
    }
    
         // Define the order for SNACKS items
     const snacksOrder = [
       'Elote Chico',
       'Elote Grande', 
       'Elote Entero',
      'Takis',
      'Cheetos',
      'Conchitas',
      'Tostitos'
    ];
    
         // Define the exact category order we want
     const categoryOrder = ['SNACKS', 'CHAMOYADAS', 'REFRESHERS', 'MILK SHAKES', 'BOBAS'];
    
    // Sort categories in the specific order we want
    const sortedCategories = Array.from(map.entries()).sort(([a], [b]) => {
      const aIndex = categoryOrder.indexOf(a);
      const bIndex = categoryOrder.indexOf(b);
      
      // If both categories are in our order list, sort by their position
      if (aIndex !== -1 && bIndex !== -1) {
        return aIndex - bIndex;
      }
      // If only one is in the order list, prioritize it
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      // If neither is in the order list, sort alphabetically
      return a.localeCompare(b);
    });
    
    return sortedCategories.map(([category, list]) => {
      let sortedList = list;
      
      // Sort SNACKS items in specific order
      if (category === 'SNACKS') {
        sortedList = list.sort((a, b) => {
          const aIndex = snacksOrder.indexOf(a.name);
          const bIndex = snacksOrder.indexOf(b.name);
          
          // If both items are in the order list, sort by their position
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          // If only one is in the order list, prioritize it
          if (aIndex !== -1) return -1;
          if (bIndex !== -1) return 1;
          // If neither is in the order list, sort alphabetically
          return a.name.localeCompare(b.name);
        });
      } else {
        // For other categories, sort alphabetically
        sortedList = list.sort((a, b) => a.name.localeCompare(b.name));
      }
      
      return { category, list: sortedList };
    });
  }, [items]);

  const subtotalCents = cart.reduce((s, l) => s + l.priceCents * l.quantity, 0);
  const totalCents = subtotalCents; // No tax

  function addToCart(item) {
    setCart((prev) => {
      const found = prev.find((l) => l.itemId === item.id);
      if (found) {
        return prev.map((l) => (l.itemId === item.id ? { ...l, quantity: l.quantity + 1 } : l));
      }
      return [...prev, { itemId: item.id, name: item.name, priceCents: item.priceCents, quantity: 1 }];
    });
  }

  function updateQty(itemId, delta) {
    setCart((prev) => prev
      .map((l) => (l.itemId === itemId ? { ...l, quantity: Math.max(0, l.quantity + delta) } : l))
      .filter((l) => l.quantity > 0));
  }

  function removeFromCart(itemId) {
    setCart((prev) => prev.filter((l) => l.itemId !== itemId));
  }

  // Function to play cash drawer sound
  function playCashDrawerSound() {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Audio play failed:', e));
  }

  async function completeOrder() {
    if (paymentMethod === 'square') {
      // Check if user is on mobile device
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Use Point of Sale API for mobile web transactions
        initiateSquarePOSTransaction();
      } else {
        // Show payment form for desktop users
        setShowPaymentForm(true);
      }
      return;
    }
    
    // Handle other payment methods if any
    setSubmitting(true);
    setMessage('');
    try {
      // For non-Square payments, create the sale record directly
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
          paymentMethod: 'cash',
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete order');
      
      setMessage(`Sale ${data.saleId} complete via cash. Total ${centsToUSD(data.totalCents)}`);
      setCart([]);
      // Play success sound
      playCashDrawerSound();
      // refresh items to show updated stock on inventory page too if needed
      fetch('/api/items').then((r) => r.json()).then(setItems);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  function initiateSquarePOSTransaction() {
    // Use the global openSquarePOS function from open_pos.js
    if (window.openSquarePOS) {
      window.openSquarePOS(totalCents, 'USD');
    } else {
      console.error('openSquarePOS function not found. Make sure open_pos.js is loaded.');
      setMessage('Square POS integration not available');
    }
  }

  async function createSaleRecord(transactionInfo) {
    setSubmitting(true);
    setMessage('');
    
    try {
      // Get transaction IDs
      const clientTransactionId = transactionInfo['com.squareup.pos.CLIENT_TRANSACTION_ID'] || transactionInfo.client_transaction_id;
      const serverTransactionId = transactionInfo['com.squareup.pos.SERVER_TRANSACTION_ID'] || transactionInfo.transaction_id;
      
      // Create the sale record
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
          paymentMethod: 'square_pos',
          squarePaymentId: serverTransactionId,
          squareClientTransactionId: clientTransactionId,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete order');
      
      setMessage(`Sale ${data.saleId} complete via Square POS. Total ${centsToUSD(data.totalCents)}`);
      setCart([]);
      // Play success sound
      playCashDrawerSound();
      // refresh items to show updated stock on inventory page too if needed
      fetch('/api/items').then((r) => r.json()).then(setItems);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function processSquarePayment() {
    setSubmitting(true);
    setMessage('');
    try {
      // Validate payment form
      if (!paymentFormData.cardNumber || !paymentFormData.expiryDate || !paymentFormData.cvv || !paymentFormData.cardholderName) {
        throw new Error('Please fill in all payment fields');
      }

      // For Square payments, first create a payment intent
      const paymentRes = await fetch('/api/square/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: totalCents,
          currency: 'USD'
        }),
      });
      
      const paymentData = await paymentRes.json();
      if (!paymentRes.ok) throw new Error(paymentData.error || 'Payment processing failed');
      
      // Now create the sale record
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
          paymentMethod: `square_${selectedSquareMethod}`,
          squarePaymentId: paymentData.paymentId,
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete order');
      
      setMessage(`Sale ${data.saleId} complete via ${getPaymentMethodDisplayName(selectedSquareMethod)}. Total ${centsToUSD(data.totalCents)}`);
      setCart([]);
      setShowPaymentForm(false);
      setPaymentFormData({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
      // Play success sound
      playCashDrawerSound();
      // refresh items to show updated stock on inventory page too if needed
      fetch('/api/items').then((r) => r.json()).then(setItems);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  }



  function clearCart() {
    setCart([]);
    setMessage('');
  }

  async function recordPurchase() {
    if (!purchaseAmount || parseFloat(purchaseAmount) <= 0) {
      setMessage('Please enter a valid purchase amount');
      return;
    }

    setSubmitting(true);
    setMessage('');
    try {
      const purchaseCents = Math.round(parseFloat(purchaseAmount) * 100);
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountCents: purchaseCents,
          description: 'Daily purchase'
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record purchase');
      setMessage(`Purchase recorded: ${centsToUSD(purchaseCents)}`);
      setPurchaseAmount('');
      setShowPurchaseInput(false);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Helper function to get payment method display name
  function getPaymentMethodDisplayName(method) {
    const names = {
      'CARD': 'Credit/Debit Card',
      'CASH_APP_PAY': 'Cash App Pay',
      'APPLE_PAY': 'Apple Pay',
      'GOOGLE_PAY': 'Google Pay',
      'SQUARE_GIFT_CARD': 'Square Gift Card',
      'VENMO': 'Venmo'
    };
    return names[method] || method;
  }

  // Quick tender buttons for common amounts (kept for potential future use)
  const quickTenderAmounts = [5, 10, 20, 50, 100];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 'calc(100vh - 60px)', gap: 0 }}>
      {/* Left Side - All Items (Scrollable) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        borderRight: '2px solid #e5e7eb',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Items Grid */}
        <div style={{ 
          padding: '20px', 
          overflow: 'auto', 
          flex: 1,
          backgroundColor: '#ffffff',
          height: '100%'
        }}>
          {grouped.map(({ category, list }) => (
            <div key={category} style={{ marginBottom: '32px' }}>
              {/* Category Header */}
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#f8fafc',
                borderBottom: '2px solid #e5e7eb',
                marginBottom: '16px',
                borderRadius: '8px'
              }}>
                <h3 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1f2937'
                }}>
                  {category}
                </h3>
              </div>
              
              {/* Items Grid for this category */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px' 
              }}>
                {list.map((it) => {
                  // Define background colors for different categories
                  let backgroundColor = '#ffffff';
                  let borderColor = '#e5e7eb';
                  
                                     if (it.category === 'SNACKS') {
                     backgroundColor = '#f0fdf4';
                     borderColor = '#22c55e';
                   } else if (it.category === 'CHAMOYADAS') {
                     backgroundColor = '#fefce8';
                     borderColor = '#fbbf24';
                   } else if (it.category === 'REFRESHERS') {
                     backgroundColor = '#eff6ff';
                     borderColor = '#3b82f6';
                   } else if (it.category === 'MILK SHAKES') {
                     backgroundColor = '#fee2e2';
                     borderColor = '#ef4444';
                   } else if (it.category === 'BOBAS') {
                     backgroundColor = '#fdf2f8';
                     borderColor = '#ec4899';
                   }
                  
                  return (
                    <button 
                      key={it.id} 
                      onClick={() => addToCart(it)} 
                      style={{ 
                        padding: '12px', 
                        textAlign: 'left', 
                        border: `2px solid ${borderColor}`, 
                        borderRadius: '12px', 
                        background: backgroundColor, 
                        cursor: 'pointer', 
                        fontSize: '16px',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        minHeight: '80px',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                      }}
                    >
                      <div style={{ fontWeight: '600', fontSize: '16px', lineHeight: '1.1' }}>{it.name}</div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#059669',
                        marginTop: 'auto'
                      }}>
                        {centsToUSD(it.priceCents)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Cart and Checkout (Fixed) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: '#f8fafc',
        padding: '20px',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>
            Current Order
          </h2>
          <button
            onClick={clearCart}
            style={{
              padding: '8px 16px',
              border: '1px solid #dc2626',
              borderRadius: '6px',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            Clear Cart
          </button>
        </div>

        {/* Cart Items */}
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          {cart.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#6b7280', 
              fontSize: '16px',
              padding: '40px 20px'
            }}>
              No items in cart
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.map((l) => (
                <div key={l.itemId} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '1fr auto auto auto auto', 
                  gap: '12px', 
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#f9fafb',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{ fontWeight: '500', fontSize: '16px' }}>{l.name}</div>
                  <div style={{ fontSize: '16px', color: '#059669', fontWeight: '600' }}>
                    {centsToUSD(l.priceCents)}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => updateQty(l.itemId, -1)} 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      -
                    </button>
                    <span style={{ 
                      margin: '0 8px', 
                      fontSize: '16px', 
                      fontWeight: '600',
                      minWidth: '20px',
                      textAlign: 'center'
                    }}>
                      {l.quantity}
                    </span>
                    <button 
                      onClick={() => updateQty(l.itemId, 1)} 
                      style={{ 
                        width: '32px', 
                        height: '32px', 
                        border: '1px solid #d1d5db',
                        borderRadius: '4px',
                        backgroundColor: '#ffffff',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: 'bold'
                      }}
                    >
                      +
                    </button>
                  </div>
                  <div style={{ 
                    textAlign: 'right', 
                    fontSize: '16px', 
                    fontWeight: '700',
                    color: '#059669'
                  }}>
                    {centsToUSD(l.priceCents * l.quantity)}
                  </div>
                  <button
                    onClick={() => removeFromCart(l.itemId)}
                    style={{
                      padding: '4px 8px',
                      border: '1px solid #dc2626',
                      borderRadius: '4px',
                      backgroundColor: '#fef2f2',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', fontSize: '16px' }}>
            <div style={{ color: '#6b7280' }}>Total</div>
            <div style={{ fontWeight: '600' }}>{centsToUSD(totalCents)}</div>

          </div>
        </div>

        {/* Square Payment Methods */}
        <div style={{ 
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: '600' }}>Payment Method</h3>
          
          {/* Square Payment Method Selection */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              Select Payment Method:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
              {squarePaymentMethods.map((method) => (
                <label
                  key={method.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    border: `2px solid ${selectedSquareMethod === method.id ? '#2563eb' : '#e5e7eb'}`,
                    borderRadius: '8px',
                    backgroundColor: selectedSquareMethod === method.id ? '#eff6ff' : '#ffffff',
                    cursor: 'pointer',
                    justifyContent: 'center',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  <input
                    type="radio"
                    name="squareMethod"
                    value={method.id}
                    checked={selectedSquareMethod === method.id}
                    onChange={() => setSelectedSquareMethod(method.id)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: '20px' }}>{method.icon}</span>
                  <span>{method.name}</span>
                </label>
                ))}
            </div>
          </div>

          {/* Payment Method Info */}
          <div style={{
            padding: '12px',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
              Selected Payment Method
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#1e293b' }}>
              {getPaymentMethodDisplayName(selectedSquareMethod)}
            </div>
          </div>
        </div>

        {/* Complete Order Button */}
        <button 
          disabled={cart.length === 0 || submitting} 
          onClick={completeOrder} 
          style={{ 
            width: '100%', 
            padding: '20px', 
            background: cart.length === 0 || submitting 
              ? '#9ca3af' 
              : '#059669', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '12px', 
            fontSize: '20px', 
            fontWeight: '700',
            cursor: cart.length === 0 || submitting 
              ? 'not-allowed' 
              : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '12px'
          }}
        >
          {submitting ? 'Processing Payment...' : 'Complete Order'}
        </button>

        {/* Square POS Button */}
        <button 
          disabled={cart.length === 0} 
          onClick={() => window.openSquarePOS && window.openSquarePOS(totalCents, 'USD')}
          style={{ 
            width: '100%', 
            padding: '16px', 
            background: cart.length === 0 
              ? '#9ca3af' 
              : '#00d4aa', 
            color: '#ffffff', 
            border: 'none', 
            borderRadius: '12px', 
            fontSize: '18px', 
            fontWeight: '700',
            cursor: cart.length === 0 
              ? 'not-allowed' 
              : 'pointer',
            transition: 'all 0.2s',
            marginBottom: '12px'
          }}
        >
          Start Square Transaction
        </button>

        {/* Compras Button and Input */}
        <div style={{ marginBottom: '12px' }}>
          {!showPurchaseInput ? (
            <button 
              onClick={() => setShowPurchaseInput(true)}
              style={{ 
                width: '100%', 
                padding: '16px', 
                background: '#dc2626', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '12px', 
                fontSize: '18px', 
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Compras
            </button>
          ) : (
            <div style={{ 
              padding: '16px', 
              border: '2px solid #dc2626', 
              borderRadius: '12px',
              backgroundColor: '#fef2f2'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: '#dc2626' 
                }}>
                  Purchase Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={purchaseAmount}
                  onChange={(e) => setPurchaseAmount(e.target.value)}
                  placeholder="0.00"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #dc2626',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '600'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={recordPurchase}
                  disabled={submitting || !purchaseAmount}
                  style={{ 
                    flex: 1,
                    padding: '12px', 
                    background: submitting || !purchaseAmount ? '#9ca3af' : '#dc2626', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    cursor: submitting || !purchaseAmount ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Recording...' : 'Record Purchase'}
                </button>
                <button 
                  onClick={() => {
                    setShowPurchaseInput(false);
                    setPurchaseAmount('');
                  }}
                  style={{ 
                    padding: '12px 16px', 
                    background: '#6b7280', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Message */}
        {message && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px',
            backgroundColor: message.includes('complete') ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${message.includes('complete') ? '#22c55e' : '#dc2626'}`,
            borderRadius: '8px',
            color: message.includes('complete') ? '#059669' : '#dc2626',
            fontSize: '16px',
            fontWeight: '500',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              padding: '32px',
              borderRadius: '16px',
              width: '90%',
              maxWidth: '500px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              <h2 style={{
                margin: '0 0 24px 0',
                fontSize: '24px',
                fontWeight: '700',
                color: '#1f2937',
                textAlign: 'center'
              }}>
                Payment Information
              </h2>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  Card Number
                </label>
                <input
                  type="text"
                  value={paymentFormData.cardNumber}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                  placeholder="1234 5678 9012 3456"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.expiryDate}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    placeholder="MM/YY"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px', 
                    fontWeight: '600', 
                    color: '#374151' 
                  }}>
                    CVV
                  </label>
                  <input
                    type="text"
                    value={paymentFormData.cvv}
                    onChange={(e) => setPaymentFormData(prev => ({ ...prev, cvv: e.target.value }))}
                    placeholder="123"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px'
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontWeight: '600', 
                  color: '#374151' 
                }}>
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={paymentFormData.cardholderName}
                  onChange={(e) => setPaymentFormData(prev => ({ ...prev, cardholderName: e.target.value }))}
                  placeholder="John Doe"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  onClick={processSquarePayment}
                  disabled={submitting}
                  style={{ 
                    flex: 1,
                    padding: '16px', 
                    background: submitting ? '#9ca3af' : '#10b981', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    cursor: submitting ? 'not-allowed' : 'pointer'
                  }}
                >
                  {submitting ? 'Processing...' : `Pay ${centsToUSD(totalCents)}`}
                </button>
                <button 
                  onClick={() => {
                    setShowPaymentForm(false);
                    setPaymentFormData({ cardNumber: '', expiryDate: '', cvv: '', cardholderName: '' });
                  }}
                  style={{ 
                    padding: '16px 24px', 
                    background: '#6b7280', 
                    color: '#ffffff', 
                    border: 'none', 
                    borderRadius: '8px', 
                    fontSize: '16px', 
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}



