import Coupon from '../models/Coupon.js';

// @desc    Validate coupon code
// @route   POST /api/coupons/validate
// @access  Private
export const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;

    if (!code?.trim()) {
      return res.status(400).json({ message: 'Enter a coupon code' });
    }

    const coupon = await Coupon.findOne({
      code: code.trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({ message: 'Invalid coupon code' });
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return res.status(400).json({ message: 'Coupon has expired' });
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: 'Coupon usage limit reached' });
    }

    const amount = Number(orderAmount) || 0;
    if (amount < coupon.minOrderAmount) {
      return res.status(400).json({
        message: `Minimum order amount for this coupon is Rs. ${coupon.minOrderAmount}`,
      });
    }

    let discountAmount = 0;
    if (coupon.discountType === 'percent') {
      discountAmount = amount * (coupon.value / 100);
    } else if (coupon.discountType === 'fixed') {
      discountAmount = coupon.value;
    }

    discountAmount = Math.min(discountAmount, amount);

    res.json({
      code: coupon.code,
      discountAmount,
      discountType: coupon.discountType,
      value: coupon.value,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all coupons
// @route   GET /api/coupons/admin
// @access  Private/Admin
export const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create coupon
// @route   POST /api/coupons/admin
// @access  Private/Admin
export const createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      code: req.body.code?.trim().toUpperCase(),
    });
    res.status(201).json(coupon);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete coupon
// @route   DELETE /api/coupons/admin/:id
// @access  Private/Admin
export const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (coupon) {
      await coupon.deleteOne();
      res.json({ message: 'Coupon removed' });
    } else {
      res.status(404).json({ message: 'Coupon not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
