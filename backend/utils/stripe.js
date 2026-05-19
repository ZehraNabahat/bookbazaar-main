export const isStripeConfigured = () => {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(
    key &&
      key.startsWith('sk_') &&
      !key.includes('...') &&
      key !== 'sk_test_dummy'
  );
};

export const getStripeCurrency = () => process.env.STRIPE_CURRENCY || 'pkr';
