import Stripe from 'stripe';
import Order from '../models/Order.js';
import { isStripeConfigured, getStripeCurrency } from '../utils/stripe.js';

let stripeInstance = null;
const getStripe = () => {
  if (!stripeInstance && isStripeConfigured()) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

// @desc    Create Payment Intent
// @route   POST /api/payments/intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const stripe = getStripe();
    if (!isStripeConfigured() || !stripe) {
      return res.status(503).json({
        configured: false,
        message:
          'Stripe is not configured. Add STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to your .env files.',
      });
    }

    const { amount, couponCode } = req.body;
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({ message: 'Invalid payment amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(numericAmount * 100),
      currency: getStripeCurrency(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: req.user._id.toString(),
        couponCode: couponCode || '',
      },
    });

    res.json({
      configured: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe intent error:', error.message);
    res.status(500).json({
      configured: true,
      message: error.message || 'Failed to create payment session',
    });
  }
};

// @desc    Stripe webhook endpoint
// @route   POST /api/payments/webhook
// @access  Public
export const stripeWebhook = async (req, res) => {
  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).send('Stripe not configured');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy'
    );
  } catch (err) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const order = await Order.findOne({ stripePaymentIntentId: paymentIntent.id });
      if (order) {
        order.paymentStatus = 'Paid';
        order.orderStatus = 'processing';
        order.trackingTimeline.push({
          status: 'Payment Confirmed',
          note: 'Payment was successfully processed.',
        });
        await order.save();
      }
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.send();
};
