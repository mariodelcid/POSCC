# Square Payment Integration Setup

This guide will help you set up Square payment processing in your POS system.

## Prerequisites

1. **Square Developer Account**: Sign up at [Square Developer Dashboard](https://developer.squareup.com/)
2. **Square Business Account**: You need an active Square business account
3. **Node.js**: Version 18.18 or higher

## Step 1: Get Square API Credentials

1. Go to [Square Developer Dashboard](https://developer.squareup.com/)
2. Create a new application or select an existing one
3. Navigate to **Credentials** in your app
4. Copy your **Access Token** and **Application ID**
5. Go to **Locations** and copy your **Location ID**

## Step 2: Environment Configuration

Create a `.env` file in your project root with the following variables:

```env
# Square API Configuration
SQUARE_ACCESS_TOKEN=your_square_access_token_here
SQUARE_ENVIRONMENT=sandbox
SQUARE_LOCATION_ID=your_square_location_id_here
SQUARE_APPLICATION_ID=your_square_application_id_here

# Optional: Webhook URL for production
SQUARE_WEBHOOK_URL=https://yourdomain.com/api/square/webhook

# Local Development
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

## Step 3: Test the Integration

1. Start your development servers:
   ```bash
   npm run dev
   ```

2. Open your POS system at `http://localhost:5173`

3. Add items to cart and test the payment flow

## Supported Payment Methods

The system now supports:
- 💳 **Credit/Debit Cards**
- 📱 **Cash App Pay**
- 🍎 **Apple Pay**
- 🤖 **Google Pay**
- 🎁 **Square Gift Cards**
- 💙 **Venmo**

## Features

- **Automatic Payment Processing**: No more manual cash handling
- **Multiple Payment Options**: Customers can choose their preferred method
- **Secure Transactions**: All payments processed through Square's secure infrastructure
- **Real-time Updates**: Payment status updates in real-time
- **Professional Receipts**: Square handles receipt generation

## Production Deployment

When deploying to production:

1. Change `SQUARE_ENVIRONMENT` to `production`
2. Update `SQUARE_WEBHOOK_URL` to your production domain
3. Ensure your webhook endpoint is publicly accessible
4. Test thoroughly in sandbox mode first

## Troubleshooting

### Common Issues

1. **"Payment processing failed"**
   - Check your Square API credentials
   - Verify your Square account is active
   - Ensure you have sufficient funds/limits

2. **"Invalid location ID"**
   - Verify your location ID in Square Dashboard
   - Ensure the location is active

3. **Webhook errors**
   - Check your webhook URL is accessible
   - Verify webhook signature verification

### Support

- [Square Developer Documentation](https://developer.squareup.com/docs)
- [Square Support](https://squareup.com/help)
- [Square Community](https://community.squareup.com/)

## Security Notes

- Never commit your `.env` file to version control
- Keep your Square access tokens secure
- Use environment variables for all sensitive data
- Implement proper webhook signature verification in production

