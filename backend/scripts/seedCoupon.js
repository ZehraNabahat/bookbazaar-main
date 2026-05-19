import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Coupon from '../models/Coupon.js';

dotenv.config();

const seed = async () => {
  await connectDB();

  const expiresAt = new Date();
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);

  await Coupon.findOneAndUpdate(
    { code: 'SAVE10' },
    {
      code: 'SAVE10',
      discountType: 'percent',
      value: 10,
      minOrderAmount: 500,
      usageLimit: 100,
      usedCount: 0,
      expiresAt,
    },
    { upsert: true, new: true }
  );

  console.log('Coupon SAVE10 ready (10% off, min order Rs. 500)');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
