import Order from '../models/Order.js';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Settings from '../models/Settings.js';

const getRevenuePercentage = async () => {
  const setting = await Settings.findOne({ key: 'revenuePercentage' });
  return setting ? parseFloat(setting.value) : 5; // Default 5%
};

// @desc    Get top-level admin stats
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Revenue
    const orders = await Order.find({ paymentStatus: 'Paid' });
    const revenuePercentage = await getRevenuePercentage();
    const rawTotalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);
    const totalRevenue = rawTotalRevenue * (revenuePercentage / 100);

    // Low stock alerts
    const lowStockCount = await Product.countDocuments({ stock: { $lt: 10 } });

    res.json({
      totalOrders,
      totalUsers,
      totalProducts,
      totalRevenue,
      lowStockCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory analytics for charts
// @route   GET /api/admin/analytics/inventory
// @access  Private/Admin
export const getInventoryAnalytics = async (req, res) => {
  try {
    // 1. Stock vs Sold grouped by category
    const categoryStats = await Product.aggregate([
      {
        $group: {
          _id: "$category",
          totalStock: { $sum: "$stock" },
          totalSold: { $sum: "$sold" },
          avgPrice: { $avg: "$price" }
        }
      }
    ]);

    // 2. Inventory health
    const products = await Product.find({}, 'name price stock sold category images').sort({ sold: -1 }).lean();
    
    const inStockItems = products.filter(p => p.stock >= 10);
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock < 10);
    const outOfStockItems = products.filter(p => p.stock === 0);

    const inStock = inStockItems.length;
    const lowStock = lowStockItems.length;
    const outOfStock = outOfStockItems.length;

    // 3. Mock Price Trends (Since history isn't stored, generate increasing trend for demo)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const priceTrends = {
      labels: months,
      datasets: categoryStats.map(c => ({
        label: c._id,
        data: months.map((_, i) => c.avgPrice * (0.8 + (i * 0.05))) // Increasing price
      }))
    };

    // 4. Category Projections
    const projections = categoryStats.map(c => ({
      category: c._id,
      projectedNeed: Math.ceil((c.totalSold / 6) * 1.5) // Projected 50% growth next month
    }));

    res.json({
      categoryStats,
      products,
      priceTrends,
      projections,
      health: {
        inStock,
        lowStock,
        outOfStock,
        outOfStockItems,
        lowStockItems
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get sales analytics
// @route   GET /api/admin/analytics/sales
// @access  Private/Admin
const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const getSalesAnalytics = async (req, res) => {
  try {
    const days = 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const salesOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          paymentStatus: 'Paid'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const revenuePercentage = await getRevenuePercentage();
    const salesByDay = new Map(
      salesOverTime.map((item) => [
        item._id,
        item.revenue * (revenuePercentage / 100),
      ])
    );

    const adjustedSalesOverTime = [];
    const current = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    while (current <= today) {
      const dayKey = formatDateKey(current);
      adjustedSalesOverTime.push({
        _id: dayKey,
        revenue: salesByDay.get(dayKey) ?? 0,
      });
      current.setDate(current.getDate() + 1);
    }

    res.json(adjustedSalesOverTime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get users list
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsersList = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Admin Settings
// @route   GET /api/admin/settings
// @access  Private/Admin
export const getSettings = async (req, res) => {
  try {
    const revenuePercentage = await getRevenuePercentage();
    res.json({ revenuePercentage });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Admin Settings
// @route   POST /api/admin/settings
// @access  Private/Admin
export const updateSettings = async (req, res) => {
  try {
    const { revenuePercentage } = req.body;
    if (revenuePercentage !== undefined) {
      await Settings.findOneAndUpdate(
        { key: 'revenuePercentage' },
        { value: revenuePercentage },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Settings updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Restock a product automatically
// @route   POST /api/admin/inventory/restock
// @access  Private/Admin
export const restockProduct = async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    
    product.stock += amount;
    await product.save();
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
