import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

async function userPurchasedProduct(userId, productId) {
  return Order.findOne({
    userId,
    'items.productId': new mongoose.Types.ObjectId(productId),
    $or: [
      { paymentStatus: { $regex: /^paid$/i } },
      { orderStatus: { $in: ['delivered', 'shipped'] } },
    ],
  });
}

async function updateProductRatings(productId) {
  const product = await Product.findById(productId);
  if (!product) return;

  const allReviews = await Review.find({ productId, isApproved: true });
  product.numReviews = allReviews.length;
  product.ratings =
    allReviews.length > 0
      ? allReviews.reduce((acc, item) => acc + item.rating, 0) / allReviews.length
      : 0;
  await product.save();
}

// @desc    Get product reviews (approved)
// @route   GET /api/products/:productId/reviews
export const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({
      productId: req.params.productId,
      isApproved: true,
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Can current user leave a review?
// @route   GET /api/products/:productId/reviews/eligibility
export const getReviewEligibility = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user._id;

    const existing = await Review.findOne({ productId, userId });
    if (existing) {
      return res.json({
        canReview: false,
        reason: existing.isApproved
          ? 'You already reviewed this product.'
          : 'Your review is pending admin approval.',
        existingReview: existing,
      });
    }

    const hasBought = await userPurchasedProduct(userId, productId);
    if (!hasBought) {
      return res.json({
        canReview: false,
        reason: 'Purchase this book first to leave a review.',
      });
    }

    res.json({ canReview: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a review
// @route   POST /api/products/:productId/reviews
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }
    if (!comment?.trim()) {
      return res.status(400).json({ message: 'Please write a review comment' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const hasBought = await userPurchasedProduct(userId, productId);
    if (!hasBought) {
      return res.status(400).json({
        message: 'You must purchase this product before leaving a review',
      });
    }

    const alreadyReviewed = await Review.findOne({ productId, userId });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'You already submitted a review for this product' });
    }

    const autoApprove = process.env.REVIEW_AUTO_APPROVE === 'true';

    const review = await Review.create({
      productId,
      userId,
      rating: Number(rating),
      comment: comment.trim(),
      isApproved: autoApprove,
    });

    if (autoApprove) {
      await updateProductRatings(productId);
    }

    res.status(201).json({
      ...review.toObject(),
      message: autoApprove
        ? 'Review published!'
        : 'Review submitted! It will appear after admin approval.',
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get current user's reviews
// @route   GET /api/reviews/me
export const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ userId: req.user._id })
      .populate('productId', 'name slug images')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get pending reviews (admin)
// @route   GET /api/reviews/pending
export const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .populate('userId', 'name email')
      .populate('productId', 'name images slug')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject review (admin)
// @route   PUT /api/reviews/:id/approve
export const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.isApproved = Boolean(req.body.isApproved);
    await review.save();

    await updateProductRatings(review.productId);

    res.json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
