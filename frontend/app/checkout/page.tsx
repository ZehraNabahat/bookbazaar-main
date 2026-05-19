'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from '@/lib/axios';
import SEOHead from '@/components/SEOHead';

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
const stripePromise = publishableKey && !publishableKey.includes('dummy') && !publishableKey.includes('your_key_here')
  ? loadStripe(publishableKey)
  : null;

type AppliedCoupon = {
  code: string;
  discountAmount: number;
};

function CheckoutForm({
  clientSecret,
  totalAmount,
  shippingAddress,
  couponCode,
  onAddressError,
}: {
  clientSecret: string;
  totalAmount: number;
  shippingAddress: Record<string, string>;
  couponCode: string;
  onAddressError: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const { cart, clearCart } = useCart();
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const isAddressComplete = () =>
    Object.values(shippingAddress).every((v) => v.trim().length > 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    if (!isAddressComplete()) {
      onAddressError();
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setProcessing(false);
      return;
    }

    const result = await stripe.confirmPayment({
      elements,
      clientSecret,
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message || 'Payment failed');
      setProcessing(false);
    } else if (result.paymentIntent?.status === 'succeeded') {
      try {
        const orderData = {
          items: cart.map((item) => ({
            productId: item.productId || (item as any)._id,
            qty: item.qty,
            price: item.price,
          })),
          shippingAddress,
          paymentMethod: 'Stripe',
          totalAmount,
          stripePaymentIntentId: result.paymentIntent.id,
          discountCode: couponCode || undefined,
        };

        const res = await axios.post('/api/orders', orderData);
        clearCart();
        router.push(`/orders/${res.data._id}?success=true`);
      } catch (err) {
        console.error('Order creation failed', err);
        setError('Payment succeeded but order creation failed. Please contact support.');
        setProcessing(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="btn-primary w-full py-3 mt-4 disabled:opacity-50"
      >
        {processing ? 'Processing...' : `Pay Rs. ${totalAmount.toFixed(2)}`}
      </button>
      <p className="text-xs text-gray-500 text-center">
        Test card: 4242 4242 4242 4242 · any future expiry · any CVC
      </p>
    </form>
  );
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart, appliedCoupon, setAppliedCoupon, clearAppliedCoupon } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const [clientSecret, setClientSecret] = useState('');
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [paymentError, setPaymentError] = useState('');
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });
  const [addressError, setAddressError] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponMessage, setCouponMessage] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const discount = appliedCoupon?.discountAmount ?? 0;
  const total = Math.max(0, cartTotal - discount);

  const createPaymentIntent = useCallback(async () => {
    if (!user || cart.length === 0 || total <= 0) return;

    setLoadingPayment(true);
    setPaymentError('');
    setClientSecret('');

    try {
      const res = await axios.post('/api/payments/intent', {
        amount: total,
        couponCode: appliedCoupon?.code || '',
      });

      if (res.data.configured === false) {
        setStripeConfigured(false);
        setClientSecret('');
        setPaymentError(res.data.message);
        return;
      }

      setStripeConfigured(true);
      setClientSecret(res.data.clientSecret);
    } catch (error: any) {
      setStripeConfigured(false);
      setPaymentError(
        error.response?.data?.message || 'Failed to load payment gateway. Check Stripe keys in .env.'
      );
    } finally {
      setLoadingPayment(false);
    }
  }, [user, cart.length, total, appliedCoupon?.code]);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/checkout');
    } else if (cart.length === 0) {
      router.push('/cart');
    }
  }, [user, cart, router]);

  useEffect(() => {
    if (appliedCoupon?.code) {
      setCouponInput(appliedCoupon.code);
    }
  }, [appliedCoupon?.code]);

  useEffect(() => {
    if (user && cart.length > 0 && total > 0) {
      createPaymentIntent();
    }
  }, [user, cart.length, total, createPaymentIntent]);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddressError(false);
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setApplyingCoupon(true);
    setCouponMessage('');

    try {
      const { data } = await axios.post('/api/coupons/validate', {
        code: couponInput,
        orderAmount: cartTotal,
      });
      setAppliedCoupon({ code: data.code, discountAmount: data.discountAmount });
      setCouponMessage(`Coupon "${data.code}" applied!`);
    } catch (error: any) {
      clearAppliedCoupon();
      setCouponMessage(error.response?.data?.message || 'Invalid coupon');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    clearAppliedCoupon();
    setCouponInput('');
    setCouponMessage('');
  };

  const handleDemoCheckout = async () => {
    if (!Object.values(shippingAddress).every((v) => v.trim().length > 0)) {
      setAddressError(true);
      return;
    }

    try {
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId || (item as any)._id,
          qty: item.qty,
          price: item.price,
        })),
        shippingAddress,
        paymentMethod: 'Demo (development)',
        totalAmount: total,
        discountCode: appliedCoupon?.code || undefined,
      };
      const res = await axios.post('/api/orders', orderData);
      clearCart();
      router.push(`/orders/${res.data._id}?success=true`);
    } catch (error: any) {
      setPaymentError(error.response?.data?.message || 'Failed to place order');
    }
  };

  if (!user || cart.length === 0) return null;

  return (
    <>
      <SEOHead title="Checkout | BookBazaar" description="Secure checkout" metaRobots="noindex,nofollow" />
      <h1 className="text-3xl font-bold text-navy-900 mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-navy-900 mb-4">Shipping Address</h2>
            {addressError && (
              <p className="text-red-500 text-sm mb-3">Please fill in all shipping fields before paying.</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                name="street"
                placeholder="Street Address"
                required
                value={shippingAddress.street}
                className="input-field md:col-span-2"
                onChange={handleAddressChange}
              />
              <input
                name="city"
                placeholder="City"
                required
                value={shippingAddress.city}
                className="input-field"
                onChange={handleAddressChange}
              />
              <input
                name="state"
                placeholder="State/Province"
                required
                value={shippingAddress.state}
                className="input-field"
                onChange={handleAddressChange}
              />
              <input
                name="postalCode"
                placeholder="Postal Code"
                required
                value={shippingAddress.postalCode}
                className="input-field"
                onChange={handleAddressChange}
              />
              <input
                name="country"
                placeholder="Country"
                required
                value={shippingAddress.country}
                className="input-field"
                onChange={handleAddressChange}
              />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-navy-900 mb-4">Payment</h2>

            {loadingPayment && <p className="text-gray-600">Loading payment gateway...</p>}

            {paymentError && !loadingPayment && (
              <div className="space-y-4">
                <p className="text-amber-700 text-sm bg-amber-50 border border-amber-200 rounded p-3">
                  {paymentError}
                </p>
                {stripeConfigured === false && (
                  <button type="button" onClick={handleDemoCheckout} className="btn-outline w-full py-3">
                    Place order (demo — no Stripe)
                  </button>
                )}
              </div>
            )}

            {clientSecret && stripePromise && !loadingPayment && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: { theme: 'stripe' },
                }}
              >
                <CheckoutForm
                  clientSecret={clientSecret}
                  totalAmount={total}
                  shippingAddress={shippingAddress}
                  couponCode={appliedCoupon?.code || ''}
                  onAddressError={() => setAddressError(true)}
                />
              </Elements>
            )}
          </div>
        </div>

        <div className="lg:w-1/3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-24">
            <h2 className="text-xl font-bold text-navy-900 mb-6">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {cart.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    {item.qty}x {item.name}
                  </span>
                  <span className="font-medium">Rs. {(item.price * item.qty).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-navy-900 mb-2">Coupon code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="e.g. SAVE10"
                  className="input-field flex-1"
                  disabled={!!appliedCoupon}
                />
                {appliedCoupon ? (
                  <button type="button" onClick={handleRemoveCoupon} className="btn-outline px-4">
                    Remove
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={applyingCoupon || !couponInput.trim()}
                    className="btn-primary px-4 disabled:opacity-50"
                  >
                    {applyingCoupon ? '...' : 'Apply'}
                  </button>
                )}
              </div>
              {couponMessage && (
                <p
                  className={`text-sm mt-2 ${appliedCoupon ? 'text-green-600' : 'text-red-500'}`}
                >
                  {couponMessage}
                </p>
              )}
            </div>

            <hr className="my-4 border-gray-200" />

            <div className="flex justify-between mb-2 text-gray-600">
              <span>Subtotal</span>
              <span>Rs. {cartTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between mb-2 text-green-600">
                <span>Discount ({appliedCoupon?.code})</span>
                <span>-Rs. {discount.toFixed(2)}</span>
              </div>
            )}

            <hr className="my-4 border-gray-200" />

            <div className="flex justify-between font-bold text-xl text-navy-900">
              <span>Total</span>
              <span>Rs. {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
