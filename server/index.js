import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { getSquareClient, squareConfig } from './square-config.js';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_ORIGIN?.split(',') || '*',
}));

// Health
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// Items
app.get('/api/items', async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  res.json(items);
});

// Inventory view
app.get('/api/inventory', async (_req, res) => {
  const items = await prisma.item.findMany({ orderBy: [{ category: 'asc' }, { name: 'asc' }] });
  res.json(items);
});

// Bulk upsert items (admin/import)
app.post('/api/items/bulk', async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }
  const ops = items.map((it) =>
    prisma.item.upsert({
      where: { name: it.name },
      update: {
        category: it.category,
        priceCents: it.priceCents,
        stock: typeof it.stock === 'number' ? it.stock : undefined,
        imageUrl: it.imageUrl || null,
      },
      create: {
        name: it.name,
        category: it.category,
        priceCents: it.priceCents,
        stock: typeof it.stock === 'number' ? it.stock : 0,
        imageUrl: it.imageUrl || null,
      },
    })
  );
  await prisma.$transaction(ops);
  res.json({ ok: true });
});

// Get packaging materials inventory
app.get('/api/packaging', async (_req, res) => {
  const packaging = await prisma.packagingMaterial.findMany({ orderBy: { name: 'asc' } });
  res.json(packaging);
});

// Update packaging stock
app.put('/api/packaging/:id', async (req, res) => {
  const { id } = req.params;
  const { stock } = req.body;
  
  if (typeof stock !== 'number' || stock < 0) {
    return res.status(400).json({ error: 'Invalid stock value' });
  }
  
  try {
    const updated = await prisma.packagingMaterial.update({
      where: { id: parseInt(id) },
      data: { stock },
    });
    res.json(updated);
  } catch (error) {
    res.status(404).json({ error: 'Packaging material not found' });
  }
});

// Get sales history
app.get('/api/sales', async (_req, res) => {
  const sales = await prisma.sale.findMany({
    include: {
      items: {
        include: {
          item: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(sales);
});

// Create sale
app.post('/api/sales', async (req, res) => {
  try {
    const { items, paymentMethod, amountTenderedCents } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items in sale' });
    }
    if (!paymentMethod.startsWith('square_')) {
      return res.status(400).json({ error: 'Invalid payment method - Square payments only' });
    }

    const itemIds = items.map((i) => i.itemId);
    const dbItems = await prisma.item.findMany({ where: { id: { in: itemIds } } });
    const idToItem = new Map(dbItems.map((i) => [i.id, i]));

    let subtotalCents = 0;
    for (const line of items) {
      const dbItem = idToItem.get(line.itemId);
      if (!dbItem) return res.status(400).json({ error: `Item not found: ${line.itemId}` });
      if (dbItem.stock < line.quantity) return res.status(400).json({ error: `Insufficient stock for ${dbItem.name}` });
      subtotalCents += dbItem.priceCents * line.quantity;
    }
    const taxCents = 0; // Adjust if tax required
    const totalCents = subtotalCents + taxCents;

    // For Square payments, we don't need cash handling
    const { squarePaymentId } = req.body;
    if (!squarePaymentId) {
      return res.status(400).json({ error: 'Square payment ID required' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          paymentMethod,
          squarePaymentId,
          subtotalCents,
          taxCents,
          totalCents,
          amountTenderedCents: null,
          changeDueCents: null,
        },
      });

      // Track packaging usage
      const packagingUsage = new Map();

      for (const line of items) {
        const dbItem = idToItem.get(line.itemId);
        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            itemId: dbItem.id,
            quantity: line.quantity,
            unitPriceCents: dbItem.priceCents,
            lineTotalCents: dbItem.priceCents * line.quantity,
          },
        });
        
        // Decrement item stock
        await tx.item.update({
          where: { id: dbItem.id },
          data: { stock: { decrement: line.quantity } },
        });

        // Track packaging usage
        if (dbItem.packaging) {
          const current = packagingUsage.get(dbItem.packaging) || 0;
          packagingUsage.set(dbItem.packaging, current + line.quantity);
        }
      }

      // Decrement packaging stock
      for (const [packagingName, quantity] of packagingUsage) {
        await tx.packagingMaterial.updateMany({
          where: { name: packagingName },
          data: { stock: { decrement: quantity } },
        });
      }

      return sale;
    });

    res.json({ ok: true, saleId: result.id, totalCents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get purchases history
app.get('/api/purchases', async (_req, res) => {
  const purchases = await prisma.purchase.findMany({
    orderBy: { createdAt: 'desc' },
  });
  res.json(purchases);
});

// Create purchase
app.post('/api/purchases', async (req, res) => {
  try {
    const { amountCents, description } = req.body;
    if (typeof amountCents !== 'number' || amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const purchase = await prisma.purchase.create({
      data: {
        amountCents,
        description: description || 'Daily purchase',
      },
    });

    res.json({ ok: true, purchaseId: purchase.id, amountCents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Square Payment Endpoints

// Create a payment intent for Square
app.post('/api/square/create-payment-intent', async (req, res) => {
  try {
    const { amountCents, currency = 'USD' } = req.body;
    
    if (typeof amountCents !== 'number' || amountCents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const client = await getSquareClient();
    const amount = BigInt(amountCents); // Keep amount in cents as BigInt for Square
    
    const response = await client.payments.create({
      sourceId: 'cnon', // This will be replaced with actual payment source ID
      idempotencyKey: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amountMoney: {
        amount: amount,
        currency: currency
      },
      locationId: squareConfig.locationId,
      note: 'POS Transaction'
    });

    res.json({
      ok: true,
      paymentId: response.result.payment.id,
      status: response.result.payment.status
    });
  } catch (error) {
    console.error('Square payment error:', error);
    res.status(500).json({ error: 'Payment processing failed', details: error.message });
  }
});

// Test endpoint to check if server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    ok: true, 
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    squareConfig: {
      environment: squareConfig.environment,
      hasAccessToken: !!squareConfig.accessToken,
      hasLocationId: !!squareConfig.locationId,
      hasApplicationId: !!squareConfig.applicationId
    }
  });
});

// Get available payment methods from Square
app.get('/api/square/payment-methods', async (_req, res) => {
  try {
    // Return supported payment methods
    res.json({
      ok: true,
      paymentMethods: squareConfig.supportedPaymentMethods.map(method => ({
        id: method,
        name: getPaymentMethodDisplayName(method),
        icon: getPaymentMethodIcon(method)
      }))
    });
  } catch (error) {
    console.error('Error getting payment methods:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Get Square locations
app.get('/api/square/locations', async (_req, res) => {
  try {
    const client = await getSquareClient();
    const response = await client.locations.list();
    
    res.json({
      ok: true,
      locations: response.result.locations || []
    });
  } catch (error) {
    console.error('Error getting locations:', error);
    res.status(500).json({ error: 'Failed to get locations', details: error.message });
  }
});

// Point of Sale API callback for mobile web transactions
app.post('/api/square/pos-callback', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    console.log('Point of Sale callback received:', req.body);
    
    // Handle the transaction response from Square Point of Sale app
    const { 
      'com.squareup.pos.CLIENT_TRANSACTION_ID': clientTransactionId,
      'com.squareup.pos.SERVER_TRANSACTION_ID': transactionId,
      'com.squareup.pos.ERROR_CODE': errorCode,
      client_transaction_id: iosClientTransactionId,
      transaction_id: iosTransactionId,
      error_code: iosErrorCode
    } = req.body;
    
    // Determine if it's Android or iOS response
    const isAndroid = clientTransactionId || transactionId || errorCode;
    const isIOS = iosClientTransactionId || iosTransactionId || iosErrorCode;
    
    if (isAndroid) {
      // Android response
      if (errorCode) {
        console.log('Android transaction failed:', errorCode);
        res.json({ success: false, error: errorCode });
      } else {
        console.log('Android transaction successful:', { clientTransactionId, transactionId });
        res.json({ success: true, clientTransactionId, transactionId });
      }
    } else if (isIOS) {
      // iOS response
      if (iosErrorCode) {
        console.log('iOS transaction failed:', iosErrorCode);
        res.json({ success: false, error: iosErrorCode });
      } else {
        console.log('iOS transaction successful:', { iosClientTransactionId, iosTransactionId });
        res.json({ success: true, clientTransactionId: iosClientTransactionId, transactionId: iosTransactionId });
      }
    } else {
      console.log('Unknown callback format:', req.body);
      res.json({ success: false, error: 'Unknown callback format' });
    }
  } catch (error) {
    console.error('Point of Sale callback error:', error);
    res.status(500).json({ error: 'Callback processing failed' });
  }
});

// Square webhook for payment notifications (keeping for compatibility)
app.post('/api/square/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-square-signature'];
    const body = req.body;
    
    // Verify webhook signature (you should implement this in production)
    // For now, we'll just log the webhook
    
    console.log('Square webhook received:', {
      signature,
      body: JSON.parse(body.toString())
    });
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Helper functions for payment methods
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

function getPaymentMethodIcon(method) {
  const icons = {
    'CARD': '💳',
    'CASH_APP_PAY': '📱',
    'APPLE_PAY': '🍎',
    'GOOGLE_PAY': '🤖',
    'SQUARE_GIFT_CARD': '🎁',
    'VENMO': '💙'
  };
  return icons[method] || '💳';
}

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).end();
  res.sendFile(path.join(distPath, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});


