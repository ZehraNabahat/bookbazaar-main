import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';

// @desc    Get product reviews
// @route   GET /api/products/:productId/reviews
// @access  Public
export const getProductReviews = async (req, res) => {
  try {
    // Only fetch approved reviews for public view
    const reviews = await Review.find({ productId: req.params.productId, isApproved: true })
      .populate('userId', 'name avatar')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a review
// @route   POST /api/products/:productId/reviews
// @access  Private
export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    const userId = req.user._id;

    // Check if user actually bought the product
    const hasBought = await Order.findOne({
      userId,
      'items.productId': productId,
      paymentStatus: 'Paid'
    });

    if (!hasBought) {
      return res.status(400).json({ message: 'You must purchase this product to leave a review' });
    }

    const alreadyReviewed = await Review.findOne({ productId, userId });
    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = await Review.create({
      productId,
      userId,
      rating: Number(rating),
      comment,
      isApproved: false // Requires admin approval
    });

    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get pending reviews
// @route   GET /api/reviews/pending
// @access  Private/Admin
export const getPendingReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ isApproved: false })
      .populate('userId', 'name email')
      .populate('productId', 'name image');
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve/Reject review
// @route   PUT /api/reviews/:id/approve
// @access  Private/Admin
export const approveReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (review) {
      review.isApproved = req.body.isApproved; // true to approve, false to keep hidden
      await review.save();

      // Recalculate product rating if approved
      if (review.isApproved) {
        const product = await Product.findById(review.productId);
        const allReviews = await Review.find({ productId: review.productId, isApproved: true });
        
        product.numReviews = allReviews.length;
        if (product.numReviews > 0) {
           product.ratings = allReviews.reduce((acc, item) => item.rating + acc, 0) / product.numReviews;
        }
        await product.save();
      }

      res.json(review);
    } else {
      res.status(404).json({ message: 'Review not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
