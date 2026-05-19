import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Cart from '../models/Cart.js';
import Coupon from '../models/Coupon.js';
import ProductView from '../models/ProductView.js';
import { FAQ_ENTRIES, findFaqMatch } from '../data/faqData.js';
import {
  BOOK_CATEGORIES,
  BOOK_CONDITIONS,
  normalizeCategory,
  normalizeCondition,
} from '../data/catalogFilters.js';

export { BOOK_CATEGORIES, BOOK_CONDITIONS };

const PUBLISHED_FILTER = { isPublished: true, stock: { $gt: 0 } };

export function buildSystemPrompt(user) {
  const faqBlock = FAQ_ENTRIES.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
  const userLine = user
    ? `The customer is logged in as ${user.name} (id: ${user._id}).`
    : 'The customer is a guest (not logged in).';

  return `You are BookBazaar's friendly AI shopping assistant — a bookstore e-commerce site.

${userLine}

FAQ KNOWLEDGE BASE:
${faqBlock}

CAPABILITIES: product search, recommendations, order tracking, cart add/remove, cart summary, coupon apply, abandoned cart reminders, FAQ.

When the user needs a structured action, respond with EXACTLY one line starting with ACTION: followed by valid JSON (no markdown).
Action schemas:
- search: {"type":"search","keyword?":"","category?":"Textbooks|Fiction|Non-Fiction|Science","condition?":"Like New|Good|Acceptable","minPrice?":number,"maxPrice?":number,"minRating?":number}
  (condition maps to product brand field in the database)
- track_order: {"type":"track_order","orderId":"mongoId or empty for latest"}
- recommendations: {"type":"recommendations","mode":"trending|personalized|also_bought","productId?":""}
- add_to_cart: {"type":"add_to_cart","productId":"","qty":1}
- remove_from_cart: {"type":"remove_from_cart","productId":""}
- apply_coupon: {"type":"apply_coupon","code":""}
- cart_summary: {"type":"cart_summary"}
- abandoned_cart: {"type":"abandoned_cart"}

For general FAQ or policy questions, answer directly WITHOUT an ACTION line.
Be concise, warm, and helpful. Currency is Rs. (PKR).`;
}

export function parseActionFromResponse(text) {
  if (!text.includes('ACTION:')) return null;
  try {
    const actionStr = text.split('ACTION:')[1].split('\n')[0].trim();
    return JSON.parse(actionStr);
  } catch {
    return null;
  }
}

export function detectIntentFallback(message) {
  const lower = message.toLowerCase().trim();

  const priceMatch =
    lower.match(/under\s*(?:rs\.?\s*)?(\d+)/i) ||
    lower.match(/below\s*(?:rs\.?\s*)?(\d+)/i) ||
    lower.match(/(?:rs\.?|pkr)\s*(\d+)/i);
  const maxPrice = priceMatch ? Number(priceMatch[1]) : undefined;

  if (/where is my order|track order|order status/i.test(lower)) {
    const idMatch = message.match(/[a-f0-9]{24}/i);
    return { type: 'track_order', orderId: idMatch?.[0] || '' };
  }
  if (/trending|popular|best.?sell/i.test(lower)) {
    return { type: 'recommendations', mode: 'trending' };
  }
  if (/recommend|suggest|for me/i.test(lower)) {
    return { type: 'recommendations', mode: 'personalized' };
  }
  if (/also bought|frequently bought|customers also/i.test(lower)) {
    return { type: 'recommendations', mode: 'also_bought' };
  }
  if (/apply coupon|use coupon|promo code|discount code/i.test(lower)) {
    const codeMatch = message.match(/\b([A-Z0-9]{4,20})\b/);
    return { type: 'apply_coupon', code: codeMatch?.[1] || '' };
  }
  if (/my cart|what.?s in (?:my )?cart|show cart|view cart|cart summary/i.test(lower)) {
    return { type: 'cart_summary' };
  }
  if (/abandoned|left in cart|forgot cart|check abandoned|items in cart/i.test(lower)) {
    return { type: 'abandoned_cart' };
  }
  if (/remove .+ from cart|delete .+ from cart|take .+ out/i.test(lower)) {
    const nameHint = message.replace(/remove|delete|take|from cart|out of cart/gi, '').trim();
    return { type: 'remove_from_cart', productName: nameHint };
  }
  if (/add .+ to cart|put .+ in cart/i.test(lower)) {
    const nameHint = message.replace(/add|put|to cart|in cart/gi, '').trim();
    const qtyMatch = lower.match(/(\d+)\s*x/);
    return {
      type: 'add_to_cart',
      productName: nameHint,
      qty: qtyMatch ? Number(qtyMatch[1]) : 1,
    };
  }
  if (/shipping|delivery|how long.*ship/i.test(lower)) {
    const faq = findFaqMatch('shipping');
    if (faq) return { type: 'faq', answer: faq.answer };
  }
  if (/return|refund/i.test(lower)) {
    const faq = findFaqMatch('return');
    if (faq) return { type: 'faq', answer: faq.answer };
  }
  if (/payment|pay with|card|stripe/i.test(lower)) {
    const faq = findFaqMatch('payment');
    if (faq) return { type: 'faq', answer: faq.answer };
  }

  let category;
  for (const cat of BOOK_CATEGORIES) {
    if (lower.includes(cat.toLowerCase())) {
      category = cat;
      break;
    }
  }

  let condition;
  for (const cond of BOOK_CONDITIONS) {
    if (lower.includes(cond.toLowerCase())) {
      condition = cond;
      break;
    }
  }

  if (/show me|find|search|books? under|looking for/i.test(lower) || maxPrice || category || condition) {
    const categoryMatch = lower.match(/(?:in|category)\s+([\w-]+)/i);
    const cleanedKeyword = lower
      .replace(/show me|find|search|books?|under\s*(?:rs\.?\s*)?\d+/gi, '')
      .replace(new RegExp(BOOK_CATEGORIES.join('|'), 'gi'), '')
      .replace(new RegExp(BOOK_CONDITIONS.join('|'), 'gi'), '')
      .trim();
    return {
      type: 'search',
      keyword: cleanedKeyword || undefined,
      maxPrice,
      category: category || normalizeCategory(categoryMatch?.[1]),
      condition,
    };
  }

  const faq = findFaqMatch(message);
  if (faq) return { type: 'faq', answer: faq.answer, question: faq.question };

  return null;
}

export function mergeSearchFilters(action = {}, activeFilters = {}) {
  const category =
    normalizeCategory(action.category || activeFilters.category) || undefined;
  const condition =
    normalizeCondition(action.condition || action.brand || activeFilters.condition) ||
    undefined;

  return {
    keyword: action.keyword,
    category,
    brand: condition,
    minPrice: action.minPrice,
    maxPrice: action.maxPrice,
    minRating: action.minRating,
  };
}

export async function searchProducts(filters = {}) {
  const query = { ...PUBLISHED_FILTER };
  const merged = mergeSearchFilters(filters, {});

  if (merged.keyword) {
    query.$or = [
      { name: { $regex: merged.keyword, $options: 'i' } },
      { description: { $regex: merged.keyword, $options: 'i' } },
    ];
  }
  if (merged.category) {
    query.category = merged.category;
  }
  if (merged.brand) {
    query.brand = merged.brand;
  }
  if (merged.maxPrice != null) {
    query.price = { ...(query.price || {}), $lte: Number(merged.maxPrice) };
  }
  if (merged.minPrice != null) {
    query.price = { ...(query.price || {}), $gte: Number(merged.minPrice) };
  }
  if (merged.minRating != null) {
    query.ratings = { $gte: Number(merged.minRating) };
  }

  const products = await Product.find(query)
    .select('name slug price category brand ratings images stock')
    .sort({ ratings: -1, sold: -1 })
    .limit(8);

  return products;
}

export async function getSearchSuggestions(q) {
  if (!q || q.length < 2) return [];

  const products = await Product.find({
    ...PUBLISHED_FILTER,
    $or: [
      { name: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { brand: { $regex: q, $options: 'i' } },
    ],
  })
    .select('name slug price category brand')
    .limit(8);

  const categories = await Product.distinct('category', {
    ...PUBLISHED_FILTER,
    category: { $regex: q, $options: 'i' },
  });

  return {
    products,
    categories: categories.slice(0, 5),
    queries: [
      `books under Rs. 500`,
      `best rated in ${q}`,
      `${q} trending`,
    ].slice(0, 3),
  };
}

export async function getTrendingProducts(limit = 6) {
  return Product.find(PUBLISHED_FILTER)
    .sort({ sold: -1, ratings: -1 })
    .limit(limit)
    .select('name slug price category brand ratings images sold');
}

export async function getPersonalizedRecommendations(userId, sessionId, limit = 6) {
  const viewFilter = userId ? { userId } : sessionId ? { sessionId } : null;
  let categoryIds = [];

  if (viewFilter) {
    const views = await ProductView.find(viewFilter)
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('productId', 'category');
    const categories = views
      .map((v) => v.productId?.category)
      .filter(Boolean);
    categoryIds = [...new Set(categories)];
  }

  if (userId) {
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(5);
    const productIds = orders.flatMap((o) => o.items.map((i) => i.productId));
    const purchased = await Product.find({ _id: { $in: productIds } }).select('category');
    categoryIds = [...new Set([...categoryIds, ...purchased.map((p) => p.category)])];
  }

  const query =
    categoryIds.length > 0
      ? { ...PUBLISHED_FILTER, category: { $in: categoryIds } }
      : PUBLISHED_FILTER;

  return Product.find(query).sort({ ratings: -1, sold: -1 }).limit(limit).select(
    'name slug price category brand ratings images'
  );
}

export async function getAlsoBoughtProducts(productId, limit = 6) {
  if (!productId) return getTrendingProducts(limit);

  const orders = await Order.find({ 'items.productId': productId }).limit(50);
  const counts = {};

  for (const order of orders) {
    for (const item of order.items) {
      const id = item.productId.toString();
      if (id !== productId.toString()) {
        counts[id] = (counts[id] || 0) + item.qty;
      }
    }
  }

  const sortedIds = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  if (sortedIds.length === 0) {
    const base = await Product.findById(productId);
    if (base) {
      return Product.find({
        ...PUBLISHED_FILTER,
        category: base.category,
        _id: { $ne: productId },
      })
        .limit(limit)
        .select('name slug price category brand ratings images');
    }
    return getTrendingProducts(limit);
  }

  return Product.find({ _id: { $in: sortedIds }, ...PUBLISHED_FILTER }).select(
    'name slug price category brand ratings images'
  );
}

export async function trackOrder(orderId, userId) {
  let order;

  if (orderId) {
    order = await Order.findById(orderId).populate('items.productId', 'name images');
  } else if (userId) {
    order = await Order.findOne({ userId }).sort({ createdAt: -1 }).populate('items.productId', 'name images');
  }

  if (!order) {
    return { found: false, message: 'Order not found. Please provide your order ID or sign in.' };
  }

  if (userId && order.userId.toString() !== userId.toString()) {
    return { found: false, message: 'You are not authorized to view this order.' };
  }

  return {
    found: true,
    order: {
      _id: order._id,
      orderStatus: order.orderStatus,
      paymentStatus: order.paymentStatus,
      trackingNumber: order.trackingNumber,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      items: order.items,
      trackingTimeline: order.trackingTimeline,
    },
  };
}

export function mapCartItems(items = []) {
  return items.map((item) => ({
    productId: item.productId?.toString?.() || item.productId,
    name: item.name,
    price: Number(item.price),
    qty: Number(item.qty) || 1,
    image: item.image || '',
    slug: item.slug || item.productId,
  }));
}

export function summarizeCartItems(items = []) {
  const mapped = mapCartItems(items);
  const total = mapped.reduce((sum, i) => sum + i.price * i.qty, 0);
  return { empty: mapped.length === 0, items: mapped, total };
}

export async function findProductByNameHint(nameHint) {
  if (!nameHint?.trim()) return null;
  const hint = nameHint.trim();
  const product = await Product.findOne({
    ...PUBLISHED_FILTER,
    name: { $regex: hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' },
  }).select('name slug price images stock category');
  if (product) return product;
  return Product.findOne({
    ...PUBLISHED_FILTER,
    $or: [
      { name: { $regex: hint.split(/\s+/).slice(0, 3).join('|'), $options: 'i' } },
      { description: { $regex: hint, $options: 'i' } },
    ],
  }).select('name slug price images stock category');
}

export async function resolveProductIdFromAction(action) {
  if (action.productId) return action.productId;
  if (action.productName) {
    const product = await findProductByNameHint(action.productName);
    return product?._id?.toString();
  }
  return null;
}

export async function getCartSummary(userId, guestCartItems = []) {
  if (userId) {
    const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price images slug stock');
    if (cart?.items?.length) {
      const items = cart.items
        .filter((item) => item.productId)
        .map((item) => ({
          productId: item.productId._id.toString(),
          name: item.productId.name,
          price: item.productId.price,
          qty: item.qty,
          image: item.productId.images?.[0],
          slug: item.productId.slug,
        }));
      const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
      return { empty: false, items, total, source: 'account' };
    }
  }

  const guest = summarizeCartItems(guestCartItems);
  return { ...guest, source: 'browser' };
}

export function checkGuestAbandonedCart(guestCartItems = [], cartUpdatedAt, minMinutes = 30) {
  const summary = summarizeCartItems(guestCartItems);
  if (summary.empty || !cartUpdatedAt) return null;

  const minutesSince = (Date.now() - new Date(cartUpdatedAt).getTime()) / (1000 * 60);
  if (minutesSince < minMinutes) return null;

  return {
    abandoned: true,
    hoursSinceUpdate: Math.max(1, Math.round(minutesSince / 60)),
    minutesSinceUpdate: Math.round(minutesSince),
    items: summary.items,
    total: summary.total,
    source: 'browser',
  };
}

export async function checkAbandonedCart(userId, guestCartItems = [], cartUpdatedAt = null) {
  if (userId) {
    const cart = await Cart.findOne({ userId }).populate('items.productId', 'name price images slug');
    if (cart?.items?.length) {
      const hoursSinceUpdate =
        (Date.now() - new Date(cart.updatedAt).getTime()) / (1000 * 60 * 60);
      if (hoursSinceUpdate >= 1) {
        const items = cart.items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId._id.toString(),
            name: item.productId.name,
            price: item.productId.price,
            qty: item.qty,
            image: item.productId.images?.[0],
            slug: item.productId.slug,
          }));
        const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
        return {
          abandoned: true,
          hoursSinceUpdate: Math.round(hoursSinceUpdate),
          items,
          total,
          source: 'account',
        };
      }
    }
  }

  return checkGuestAbandonedCart(guestCartItems, cartUpdatedAt);
}

export async function validateCouponForChat(code, orderAmount = 0) {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) return { valid: false, message: 'Invalid coupon code.' };
  if (new Date() > new Date(coupon.expiresAt)) {
    return { valid: false, message: 'This coupon has expired.' };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, message: 'Coupon usage limit reached.' };
  }
  if (orderAmount < coupon.minOrderAmount) {
    return {
      valid: false,
      message: `Minimum order amount is Rs. ${coupon.minOrderAmount}.`,
    };
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percent') {
    discountAmount = orderAmount * (coupon.value / 100);
  } else {
    discountAmount = coupon.value;
  }
  discountAmount = Math.min(discountAmount, orderAmount || discountAmount);

  return {
    valid: true,
    code: coupon.code,
    discountAmount,
    discountType: coupon.discountType,
    value: coupon.value,
    message: `Coupon ${coupon.code} is valid!`,
  };
}

export async function getProductForCart(productId) {
  return Product.findOne({ _id: productId, ...PUBLISHED_FILTER }).select(
    'name slug price images stock category'
  );
}

export async function recordProductView({ userId, sessionId, productId }) {
  if (!productId) return;
  await ProductView.create({ userId: userId || undefined, sessionId, productId });
}

export async function executeAction(action, context) {
  const { user, sessionId, guestCartTotal = 0, guestCartItems = [], cartUpdatedAt } = context;

  switch (action.type) {
    case 'search': {
      const searchFilters = mergeSearchFilters(action, context.activeFilters || {});
      const products = await searchProducts({ ...action, ...searchFilters });
      const filterDesc = [
        searchFilters.category,
        searchFilters.brand,
      ]
        .filter(Boolean)
        .join(' · ');
      const reply =
        products.length > 0
          ? `I found ${products.length} book(s)${filterDesc ? ` (${filterDesc})` : ''}:`
          : `No books matched${filterDesc ? ` for ${filterDesc}` : ''}. Try different filters or a broader search.`;
      return { reply, data: { products, filters: searchFilters }, dataType: 'products' };
    }

    case 'recommendations': {
      let products;
      if (action.mode === 'trending') {
        products = await getTrendingProducts();
      } else if (action.mode === 'also_bought') {
        products = await getAlsoBoughtProducts(action.productId);
      } else {
        products = await getPersonalizedRecommendations(user?._id, sessionId);
      }
      const label =
        action.mode === 'trending'
          ? 'Trending now'
          : action.mode === 'also_bought'
            ? 'Customers also bought'
            : 'Picked for you';
      return {
        reply: `Here are some ${label.toLowerCase()}:`,
        data: { products, label },
        dataType: 'products',
      };
    }

    case 'track_order': {
      const result = await trackOrder(action.orderId, user?._id);
      if (!result.found) {
        return { reply: result.message, data: null, dataType: null };
      }
      return {
        reply: `Here's the status for order #${result.order._id.toString().slice(-6).toUpperCase()}:`,
        data: result.order,
        dataType: 'order',
      };
    }

    case 'add_to_cart': {
      const productId = await resolveProductIdFromAction(action);
      const product = productId ? await getProductForCart(productId) : null;
      if (!product) {
        return {
          reply: action.productName
            ? `I couldn't find "${action.productName}". Try searching first, then tap Add on a book.`
            : 'Please specify which book to add, or pick one from search results.',
          data: null,
          dataType: null,
        };
      }
      return {
        reply: `Added "${product.name}" to your cart.`,
        data: {
          product: {
            productId: product._id.toString(),
            name: product.name,
            price: product.price,
            qty: action.qty || 1,
            image: product.images?.[0] || '',
            slug: product.slug,
          },
        },
        dataType: 'cart_add',
      };
    }

    case 'remove_from_cart': {
      let productId = action.productId;
      if (!productId && action.productName) {
        const product = await findProductByNameHint(action.productName);
        productId = product?._id?.toString();
      }
      const inGuest = guestCartItems.find(
        (i) => i.productId === productId || i.name?.toLowerCase().includes(action.productName?.toLowerCase?.() || '')
      );
      const targetId = productId || inGuest?.productId;
      if (!targetId) {
        return {
          reply: "I couldn't find that item in your cart. Say \"what's in my cart\" to see current items.",
          data: null,
          dataType: null,
        };
      }
      const name = inGuest?.name || action.productName || 'Item';
      return {
        reply: `Removed "${name}" from your cart.`,
        data: { productId: targetId },
        dataType: 'cart_remove',
      };
    }

    case 'apply_coupon': {
      if (!action.code?.trim()) {
        return {
          reply: 'Tell me your coupon code, e.g. "apply coupon SAVE10".',
          data: null,
          dataType: null,
        };
      }
      const result = await validateCouponForChat(action.code, guestCartTotal);
      return {
        reply: result.valid
          ? `${result.message} You'll save Rs. ${result.discountAmount.toFixed(2)} on this order. Use it at checkout.`
          : result.message,
        data: result.valid ? result : null,
        dataType: result.valid ? 'coupon' : null,
      };
    }

    case 'cart_summary': {
      const summary = await getCartSummary(user?._id, guestCartItems);
      if (summary.empty) {
        return {
          reply: 'Your cart is empty. Search for books and I can add them for you!',
          data: { items: [], total: 0 },
          dataType: 'cart',
        };
      }
      return {
        reply: `Your cart has ${summary.items.length} item(s) — total Rs. ${summary.total.toFixed(2)}. You can remove items here or say "remove [book] from cart".`,
        data: summary,
        dataType: 'cart',
      };
    }

    case 'abandoned_cart': {
      const abandoned = await checkAbandonedCart(user?._id, guestCartItems, cartUpdatedAt);
      if (!abandoned) {
        if (guestCartItems.length > 0) {
          const summary = summarizeCartItems(guestCartItems);
          return {
            reply: `You have ${summary.items.length} item(s) in your cart (Rs. ${summary.total.toFixed(2)}). Ready to checkout?`,
            data: summary,
            dataType: 'cart',
          };
        }
        return {
          reply: 'Your cart is empty — no items to recover. Browse books and I can help you add them.',
          data: null,
          dataType: null,
        };
      }
      const timeLabel = abandoned.minutesSinceUpdate
        ? `${abandoned.minutesSinceUpdate} minutes`
        : `${abandoned.hoursSinceUpdate} hour(s)`;
      return {
        reply: `You still have ${abandoned.items.length} item(s) waiting (Rs. ${abandoned.total.toFixed(2)}) — last updated about ${timeLabel} ago. Complete checkout before they sell out!`,
        data: abandoned,
        dataType: 'abandoned_cart',
      };
    }

    case 'faq':
      return { reply: action.answer, data: null, dataType: null };

    default:
      return { reply: 'I can help you search books, track orders, manage your cart, or answer policy questions.', data: null, dataType: null };
  }
}
