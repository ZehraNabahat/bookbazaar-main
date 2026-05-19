'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import axios from '@/lib/axios';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { getChatSessionId, rotateChatSession } from '@/lib/chatSession';
import { FiMessageSquare, FiX, FiSend, FiShoppingCart, FiTrash2, FiPlus, FiTag } from 'react-icons/fi';

const CATEGORIES = ['Textbooks', 'Fiction', 'Non-Fiction', 'Science'];
const CONDITIONS = ['Like New', 'Good', 'Acceptable'];

interface ProductCard {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category?: string;
  brand?: string;
  ratings?: number;
  images?: string[];
}

interface CartLineItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image?: string;
  slug?: string;
}

interface OrderTimeline {
  status: string;
  timestamp?: string;
  note?: string;
}

interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  data?: unknown;
  dataType?: string | null;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'ai',
  content:
    "Hi! I can search books, add or remove cart items, apply coupons (e.g. SAVE10), and remind you about abandoned carts.",
};

const QUICK_PROMPTS = [
  "What's in my cart?",
  'Apply coupon SAVE10',
  'Show me books under Rs. 500',
  'Where is my order?',
];

function ProductResults({
  products,
  cartItems,
  onAddToCart,
  onRemoveFromCart,
}: {
  products: ProductCard[];
  cartItems?: CartLineItem[];
  onAddToCart?: (p: ProductCard) => void;
  onRemoveFromCart?: (productId: string) => void;
}) {
  if (!products?.length) return null;
  return (
    <div className="mt-2 space-y-2 max-h-52 overflow-y-auto">
      {products.map((p) => {
        const inCart = cartItems?.find((i) => i.productId === p._id);
        return (
        <div key={p._id} className="flex gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
        <Link
          href={`/products/${p.slug}`}
          className="flex gap-2 flex-1 min-w-0"
        >
          <div
            className="w-12 h-14 bg-gray-200 rounded flex-shrink-0 bg-cover bg-center"
            style={{
              backgroundImage: `url('${p.images?.[0] || 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=80'}')`,
            }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-navy-900 line-clamp-2">{p.name}</p>
            <p className="text-xs text-gray-500">
              {p.category}
              {p.brand ? ` · ${p.brand}` : ''}
            </p>
            <p className="text-sm font-bold text-teal-700">Rs. {p.price?.toFixed(2)}</p>
          </div>
        </Link>
          <div className="flex flex-col gap-1 justify-center shrink-0">
            {onAddToCart && !inCart && (
              <button
                type="button"
                onClick={() => onAddToCart(p)}
                className="w-8 h-8 rounded-full bg-teal-500 text-navy-900 flex items-center justify-center hover:bg-teal-400 transition-colors"
                title="Add to cart"
              >
                <FiPlus size={16} />
              </button>
            )}
            {onRemoveFromCart && inCart && (
              <button
                type="button"
                onClick={() => onRemoveFromCart(p._id)}
                className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                title="Remove from cart"
              >
                <FiTrash2 size={16} />
              </button>
            )}
            {onAddToCart && inCart && (
              <button
                type="button"
                onClick={() => onAddToCart(p)}
                className="w-8 h-8 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center hover:bg-teal-200 transition-colors"
                title="Add another to cart"
              >
                <FiPlus size={16} />
              </button>
            )}
          </div>
        </div>
      )})}
    </div>
  );
}

function CartItemsCard({
  items,
  total,
  onRemove,
}: {
  items: CartLineItem[];
  total: number;
  onRemove?: (productId: string) => void;
}) {
  if (!items?.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {items.map((item) => (
        <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 text-xs">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-navy-900 line-clamp-1">{item.name}</p>
            <p className="text-gray-500">Qty {item.qty} · Rs. {(item.price * item.qty).toFixed(2)}</p>
          </div>
          {onRemove && (
            <button type="button" onClick={() => onRemove(item.productId)} className="text-gray-400 hover:text-red-500 p-1">
              <FiTrash2 size={14} />
            </button>
          )}
        </div>
      ))}
      <div className="flex justify-between items-center pt-1">
        <span className="text-sm font-bold text-navy-900">Total: Rs. {total.toFixed(2)}</span>
        <Link href="/checkout" className="text-xs text-teal-600 font-semibold hover:underline">Checkout →</Link>
      </div>
    </div>
  );
}

function OrderTrackingCard({ order }: { order: Record<string, unknown> }) {
  const timeline = (order.trackingTimeline as OrderTimeline[]) || [];
  return (
    <div className="mt-2 p-3 bg-white border border-gray-200 rounded-lg text-xs">
      <div className="flex justify-between mb-2">
        <span className="font-bold text-navy-900 capitalize">{String(order.orderStatus)}</span>
        <span className="text-gray-500">Rs. {Number(order.totalAmount).toFixed(2)}</span>
      </div>
      {order.trackingNumber ? (
        <p className="text-gray-600 mb-2">Tracking: {String(order.trackingNumber)}</p>
      ) : null}
      <div className="space-y-2 border-l-2 border-teal-400 pl-3 ml-1">
        {timeline.map((step, i) => (
          <div key={i}>
            <p className="font-medium text-navy-900">{step.status}</p>
            {step.note && <p className="text-gray-500">{step.note}</p>}
          </div>
        ))}
      </div>
      <Link
        href={`/orders/${order._id}`}
        className="inline-block mt-2 text-teal-600 hover:underline font-medium"
      >
        View full order →
      </Link>
    </div>
  );
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [conditionFilter, setConditionFilter] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [suggestions, setSuggestions] = useState<{
    products: ProductCard[];
    categories: string[];
    queries: string[];
  } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const {
    cart,
    addToCart,
    removeFromCart,
    cartTotal,
    cartUpdatedAt,
    appliedCoupon,
    setAppliedCoupon,
  } = useCart();
  const abandonedReminderShown = useRef(false);
  const { user } = useAuth();

  const userId = user?._id ?? null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const loadHistory = useCallback(async (sid: string) => {
    try {
      const { data } = await axios.get('/api/ai/chat/history', {
        params: { sessionId: sid },
      });
      if (Array.isArray(data) && data.length > 0) {
        setMessages(
          data.map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? ('ai' as const) : ('user' as const),
            content: m.content,
          }))
        );
      } else {
        setMessages([WELCOME_MESSAGE]);
      }
    } catch {
      setMessages([WELCOME_MESSAGE]);
    }
  }, []);

  useEffect(() => {
    const prev = prevUserIdRef.current;
    const current = userId;

    if (prev === undefined) {
      prevUserIdRef.current = current;
      const sid = getChatSessionId(current);
      setSessionId(sid);
      return;
    }

    if (prev !== current) {
      prevUserIdRef.current = current;
      const sid = getChatSessionId(current);
      setSessionId(sid);
      setMessages([WELCOME_MESSAGE]);
      loadHistory(sid);
    }
  }, [userId, loadHistory]);

  useEffect(() => {
    if (sessionId && isOpen) {
      loadHistory(sessionId);
    }
  }, [isOpen, sessionId, loadHistory]);

  const loadInitialRecommendations = useCallback(async () => {
    if (!sessionId) return;
    try {
      const { data } = await axios.get('/api/ai/recommendations', {
        params: { mode: user ? 'personalized' : 'trending', sessionId },
      });
      if (data.products?.length) {
        setMessages((prev) => {
          if (prev.length > 1) return prev;
          return [
            ...prev,
            {
              role: 'ai',
              content: user ? 'Based on your interests, you might like:' : 'Trending on BookBazaar:',
              data: { products: data.products },
              dataType: 'products',
            },
          ];
        });
      }
    } catch {
      // silent
    }
  }, [user, sessionId]);

  useEffect(() => {
    if (isOpen && sessionId) loadInitialRecommendations();
  }, [isOpen, sessionId, loadInitialRecommendations]);

  useEffect(() => {
    const q = input.trim();
    if (q.length < 2) {
      setSuggestions(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const { data } = await axios.get('/api/ai/suggestions', { params: { q } });
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions(null);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [input]);

  const buildFilters = () => ({
    ...(categoryFilter ? { category: categoryFilter } : {}),
    ...(conditionFilter ? { condition: conditionFilter } : {}),
  });

  const handleAddProductToCart = (p: ProductCard) => {
    addToCart({
      productId: p._id,
      name: p.name,
      price: p.price,
      qty: 1,
      image: p.images?.[0] || '',
      slug: p.slug,
    });
    setMessages((prev) => [
      ...prev,
      { 
        role: 'ai', 
        content: `Added "${p.name}" to your cart.`,
        dataType: 'cart_action_success',
        data: { action: 'add' }
      },
    ]);
  };

  const handleRemoveProductFromCart = (productId: string) => {
    removeFromCart(productId);
    setMessages((prev) => [
      ...prev,
      { role: 'ai', content: 'Removed item from your cart.' },
    ]);
  };

  const applyChatAction = (dataType: string | null | undefined, data: unknown) => {
    if (!data || !dataType) return;
    if (dataType === 'cart_add') {
      const d = data as { product: CartLineItem };
      if (d.product) {
        addToCart({
          productId: d.product.productId,
          name: d.product.name,
          price: d.product.price,
          qty: d.product.qty || 1,
          image: d.product.image || '',
          slug: d.product.slug,
        });
      }
    }
    if (dataType === 'cart_remove') {
      const d = data as { productId: string };
      if (d.productId) removeFromCart(d.productId);
    }
    if (dataType === 'coupon') {
      const c = data as { code: string; discountAmount: number; discountType?: string; value?: number };
      setAppliedCoupon(c);
    }
  };

  const checkAbandonedCartReminder = useCallback(async () => {
    if (!sessionId || cart.length === 0 || abandonedReminderShown.current) return;
    try {
      const { data } = await axios.post('/api/ai/chat', {
        sessionId,
        message: 'check abandoned cart',
        guestCartTotal: cartTotal,
        cartItems: cart,
        cartUpdatedAt,
      });
      if (data.dataType === 'abandoned_cart' && data.data) {
        abandonedReminderShown.current = true;
        setMessages((prev) => [
          ...prev,
          { role: 'ai', content: data.reply, data: data.data, dataType: data.dataType },
        ]);
      }
    } catch {
      // silent
    }
  }, [sessionId, cart, cartTotal, cartUpdatedAt]);

  useEffect(() => {
    if (isOpen && cart.length > 0) {
      const timer = setTimeout(checkAbandonedCartReminder, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, cart.length, checkAbandonedCartReminder]);

  const sendMessage = async (text: string, filterOnly = false) => {
    const userMsg = text.trim();
    const filters = buildFilters();
    if (!userMsg && !filterOnly && !filters.category && !filters.condition) return;
    if (!sessionId) return;

    setInput('');
    setShowSuggestions(false);

    const displayText =
      userMsg ||
      `Show books${filters.category ? ` in ${filters.category}` : ''}${filters.condition ? ` (${filters.condition})` : ''}`;

    setMessages((prev) => [...prev, { role: 'user', content: displayText }]);
    setIsLoading(true);

    try {
      const { data } = await axios.post('/api/ai/chat', {
        sessionId,
        message: userMsg,
        guestCartTotal: cartTotal,
        cartItems: cart,
        cartUpdatedAt,
        filters: Object.keys(filters).length ? filters : undefined,
      });

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }

      applyChatAction(data.dataType, data.data);

      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: data.reply,
          data: data.data,
          dataType: data.dataType,
        },
      ]);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      const serverMsg = axiosErr.response?.data?.message;
      const isOffline = !axiosErr.response;
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content: isOffline
            ? 'Cannot reach the server. Make sure the backend is running on port 5000.'
            : serverMsg || 'Sorry, something went wrong. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!sessionId) return;
    try {
      await axios.delete('/api/ai/chat/history', { data: { sessionId } });
    } catch {
      // continue local reset
    }
    const newSid = rotateChatSession(userId);
    setSessionId(newSid);
    setMessages([WELCOME_MESSAGE]);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const renderMessageData = (msg: ChatMessage) => {
    if (!msg.data || !msg.dataType) return null;

    if (msg.dataType === 'products') {
      const products = (msg.data as { products: ProductCard[] }).products;
      return <ProductResults products={products} cartItems={cart} onAddToCart={handleAddProductToCart} onRemoveFromCart={handleRemoveProductFromCart} />;
    }
    if (msg.dataType === 'order') {
      return <OrderTrackingCard order={msg.data as Record<string, unknown>} />;
    }
    if (msg.dataType === 'cart' || msg.dataType === 'abandoned_cart') {
      const d = msg.data as { items: CartLineItem[]; total: number };
      return (
        <CartItemsCard
          items={d.items || []}
          total={d.total || 0}
          onRemove={(id) => {
            removeFromCart(id);
            setMessages((prev) => [
              ...prev,
              { role: 'ai', content: 'Item removed from your cart.' },
            ]);
          }}
        />
      );
    }
    if (msg.dataType === 'coupon') {
      const c = msg.data as { code: string; discountAmount: number };
      return (
        <p className="mt-1 text-xs text-green-700 font-medium">
          Coupon <span className="font-mono bg-green-50 px-1 rounded">{c.code}</span> applied — Rs.{' '}
          {c.discountAmount?.toFixed(2)} off at checkout.
          <Link href="/checkout" className="block mt-1 text-teal-600 hover:underline">
            Go to checkout →
          </Link>
        </p>
      );
    }
    if (msg.dataType === 'cart_action_success' || msg.dataType === 'cart_add') {
      return (
        <div className="mt-3 flex gap-2 w-full">
          <Link href="/cart" className="flex-1 text-center py-2 px-3 bg-white border border-teal-500 text-teal-600 rounded-lg text-xs font-semibold hover:bg-teal-50 transition-colors">
            View Cart
          </Link>
          <Link href="/checkout" className="flex-1 text-center py-2 px-3 bg-teal-500 text-navy-900 rounded-lg text-xs font-semibold hover:bg-teal-400 transition-colors">
            Checkout →
          </Link>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-teal-500 text-navy-900 rounded-full flex items-center justify-center shadow-lg hover:bg-teal-400 transition-transform duration-300 z-50 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open AI assistant"
      >
        <FiMessageSquare size={24} />
        {cart.length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {cart.length}
          </span>
        )}
      </button>

      <div
        className={`fixed bottom-6 right-6 w-80 md:w-[420px] bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '600px', maxHeight: 'calc(100vh - 48px)' }}
      >
        <div className="bg-navy-900 text-white p-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-navy-900 font-bold text-sm shrink-0">
              AI
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm">BookBazaar Assistant</h3>
              <p className="text-xs text-teal-400 truncate">
                {user ? `Hi, ${user.name.split(' ')[0]}` : 'Guest'} · private chat
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleClearChat}
              className="text-gray-300 hover:text-white p-1"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <FiTrash2 size={18} />
            </button>
            <button onClick={() => setIsOpen(false)} className="text-gray-300 hover:text-white p-1" aria-label="Close chat">
              <FiX size={22} />
            </button>
          </div>
        </div>

        <div className="px-3 py-2 bg-white border-b border-gray-100 grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-bold text-navy-900 uppercase tracking-wide">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-navy-900 uppercase tracking-wide">Condition</label>
            <select
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              className="w-full mt-0.5 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">Any condition</option>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => sendMessage('', true)}
            disabled={isLoading || (!categoryFilter && !conditionFilter)}
            className="col-span-2 text-xs py-1.5 bg-teal-500 text-navy-900 font-semibold rounded-lg hover:bg-teal-400 disabled:opacity-40"
          >
            Apply filters & search
          </button>
        </div>

        <div className="px-3 py-2 bg-gray-50 border-b border-gray-100 flex gap-1 overflow-x-auto">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              className="flex-shrink-0 text-xs px-2.5 py-1 bg-white border border-gray-200 rounded-full text-gray-700 hover:border-teal-400 hover:text-teal-700 whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col gap-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[90%] p-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-teal-500 text-navy-900 rounded-tr-none'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                }`}
              >
                {msg.content}
                {msg.role === 'ai' && renderMessageData(msg)}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="p-3 rounded-2xl bg-white border border-gray-200 flex gap-1 items-center h-10">
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {showSuggestions && suggestions && input.length >= 2 && (
          <div className="border-t border-gray-100 bg-white max-h-36 overflow-y-auto text-sm">
            {suggestions.products?.map((p) => (
              <button
                key={p._id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-teal-50 flex justify-between"
                onClick={() => sendMessage(`show me ${p.name}`)}
              >
                <span className="truncate">{p.name}</span>
                <span className="text-gray-500 text-xs ml-2">Rs. {p.price}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="p-3 bg-white rounded-b-2xl border-t border-gray-100">
          <div className="flex flex-col gap-1 text-xs text-gray-500 mb-1.5 px-1">
            <div className="flex items-center gap-2">
              <FiShoppingCart size={12} />
              <span>
                Cart: {cart.length} items · Rs. {cartTotal.toFixed(2)}
              </span>
              <Link href="/cart" className="ml-auto text-teal-600 hover:underline">
                View
              </Link>
            </div>
            {appliedCoupon && (
              <div className="flex items-center gap-1 text-green-700">
                <FiTag size={12} />
                <span>
                  {appliedCoupon.code} (−Rs. {appliedCoupon.discountAmount.toFixed(2)})
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => input.length >= 2 && setShowSuggestions(true)}
              placeholder="Search books, track order, ask FAQ..."
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 bg-navy-900 text-white rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-navy-800"
            >
              <FiSend size={16} />
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
