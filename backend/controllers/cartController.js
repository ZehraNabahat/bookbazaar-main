import Cart from '../models/Cart.js';

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id }).populate('items.productId', 'name price images stock');
    
    if (!cart) {
      cart = await Cart.create({ userId: req.user._id, items: [] });
    }
    
    res.json(cart);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Sync cart (add/update items)
// @route   POST /api/cart
// @access  Private
export const syncCart = async (req, res) => {
  try {
    const { items } = req.body;
    
    let cart = await Cart.findOne({ userId: req.user._id });
    
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items });
    } else {
      cart.items = items;
    }
    
    await cart.save();
    
    // Repopulate before sending back
    const populatedCart = await Cart.findById(cart._id).populate('items.productId', 'name price images stock');
    res.json(populatedCart);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
export const clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id });
    if (cart) {
      cart.items = [];
      await cart.save();
    }
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
