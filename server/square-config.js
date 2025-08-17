import dotenv from 'dotenv';
dotenv.config();

export const squareConfig = {
  // Square API credentials - you'll need to get these from your Square Developer Dashboard
  accessToken: process.env.SQUARE_ACCESS_TOKEN || 'EAAAl4PphE7QgwgQVOiktL8eny84Q3JD0u88au_JNNuRGLGb_6C2l9lD6o6EGbnf',
  environment: process.env.SQUARE_ENVIRONMENT || 'sandbox', // 'sandbox' or 'production'
  locationId: process.env.SQUARE_LOCATION_ID || 'LF27DPP7A16EP',
  applicationId: process.env.SQUARE_APPLICATION_ID || 'sandbox-sq0idb-oiHZXPm4ARnnaEG9ZX1MfQ',
  // Square API version - should match your dashboard
  apiVersion: '2024-12-18',
  
  // Webhook endpoint for payment notifications
  webhookUrl: process.env.SQUARE_WEBHOOK_URL || 'http://localhost:3000/api/square/webhook',
  
  // Payment methods supported
  supportedPaymentMethods: [
    'CARD',
    'CASH_APP_PAY',
    'APPLE_PAY',
    'GOOGLE_PAY',
    'SQUARE_GIFT_CARD',
    'VENMO'
  ],
  
  // Enable mock mode for testing (set to false when you get real Square working)
  mockMode: true
};

// Helper function to get Square client
export async function getSquareClient() {
  if (squareConfig.mockMode) {
    // Return mock client for testing
    return {
      payments: {
        create: async (paymentData) => {
          // Simulate Square payment processing
          console.log('Mock Square payment:', paymentData);
          return {
            result: {
              payment: {
                id: `mock_payment_${Date.now()}`,
                status: 'COMPLETED',
                amountMoney: paymentData.amountMoney,
                locationId: paymentData.locationId
              }
            }
          };
        }
      },
      locations: {
        list: async () => {
          // Simulate Square locations
          return {
            result: {
              locations: [
                {
                  id: squareConfig.locationId,
                  name: 'Mock Location',
                  status: 'ACTIVE'
                }
              ]
            }
          };
        }
      }
    };
  }
  
  // Real Square client
  const square = await import('square');
  
  return new square.SquareClient({
    accessToken: squareConfig.accessToken,
    environment: squareConfig.environment === 'production' ? square.SquareEnvironment.Production : square.SquareEnvironment.Sandbox,
    userAgentDetail: `POSCC/${squareConfig.apiVersion}`,
  });
}
