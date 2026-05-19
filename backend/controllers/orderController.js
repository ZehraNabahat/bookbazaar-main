import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      stripePaymentIntentId,
      discountCode
    } = req.body;

    if (items && items.length === 0) {
      return res.status(400).json({ message: 'No order items' });
    }

    const paidViaStripe = Boolean(stripePaymentIntentId);

    const order = new Order({
      userId: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      stripePaymentIntentId,
      discountCode,
      paymentStatus: paidViaStripe ? 'Paid' : 'pending',
      orderStatus: paidViaStripe ? 'processing' : 'pending',
      trackingTimeline: [
        { status: 'Order Placed', note: 'We have received your order.' },
        ...(paidViaStripe
          ? [{ status: 'Payment Confirmed', note: 'Payment received via Stripe.' }]
          : []),
      ],
    });

    const createdOrder = await order.save();

    if (discountCode) {
      await Coupon.findOneAndUpdate(
        { code: discountCode.trim().toUpperCase() },
        { $inc: { usedCount: 1 } }
      );
    }

    // Deduct stock and increment sold count
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.stock = product.stock - item.qty;
        product.sold = product.sold + item.qty;
        await product.save();
      }
    }

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('userId', 'id name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/my
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('userId', 'name email').populate('items.productId', 'name image');

    if (order) {
      // Check if user is admin or the order belongs to them
      if (req.user.role === 'admin' || order.userId._id.toString() === req.user._id.toString()) {
        res.json(order);
      } else {
        res.status(401).json({ message: 'Not authorized to view this order' });
      }
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note, trackingNumber } = req.body;
    const order = await Order.findById(req.params.id);

    if (order) {
      order.orderStatus = status;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      
      order.trackingTimeline.push({
        status,
        note: note || `Order marked as ${status}`
      });

      if (status === 'delivered' && order.paymentStatus !== 'Paid') {
        order.paymentStatus = 'Paid';
        order.trackingTimeline.push({
          status: 'Payment Confirmed',
          note: 'Payment marked as Paid upon delivery'
        });
      }

      const updatedOrder = await order.save();

      // Emit socket event to notify user
      if (req.io) {
        req.io.to(`order_${order._id}`).emit('order_status_update', {
          status,
          note,
          timestamp: new Date()
        });
      }

      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
